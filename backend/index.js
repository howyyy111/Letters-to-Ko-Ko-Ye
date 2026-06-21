import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { PrivyClient } from '@privy-io/server-auth';
import { hasUserReceivedDrip, recordDrip } from './database.js';

const app = express();
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

const privy = new PrivyClient(process.env.PRIVY_APP_ID, process.env.PRIVY_APP_SECRET);
const DRIP_AMOUNT = ethers.parseEther('0.001');
const dripInFlight = new Set();

const MESSAGES_ABI = [
    "function getAllMessages() external view returns (tuple(uint256 ticketNumber, address sender, string text, uint256 timestamp, string reply, bool hasReply, uint256 replyTimestamp)[])",
];

function getProvider() {
    return new ethers.JsonRpcProvider(process.env.RPC_URL);
}

function getSponsorWallet() {
    return new ethers.Wallet(process.env.SPONSOR_WALLET_PRIVATE_KEY, getProvider());
}

app.post('/api/drip', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing authorization token' });
        }
        if (!walletAddress || !ethers.isAddress(walletAddress)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        let claims;
        try {
            claims = await privy.verifyAuthToken(authHeader.slice(7));
        } catch {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const privyUserId = claims.userId;

        if (hasUserReceivedDrip(privyUserId)) {
            return res.json({ success: true, alreadyDripped: true, message: 'Wallet already funded' });
        }

        if (dripInFlight.has(privyUserId)) {
            return res.json({ success: true, alreadyDripped: true, message: 'Drip already in progress' });
        }

        dripInFlight.add(privyUserId);

        try {
            const sponsor = getSponsorWallet();
            const balance = await getProvider().getBalance(sponsor.address);

            if (balance < DRIP_AMOUNT) {
                return res.status(503).json({ error: 'Sponsor wallet is low on funds. Please try again later.' });
            }

            const tx = await sponsor.sendTransaction({ to: walletAddress, value: DRIP_AMOUNT });
            await tx.wait();

            recordDrip(privyUserId, walletAddress, tx.hash);

            return res.json({ success: true, alreadyDripped: false, txHash: tx.hash, message: 'Drip sent successfully' });
        } finally {
            dripInFlight.delete(privyUserId);
        }
    } catch (err) {
        console.error('Drip error:', err);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

app.get('/api/messages', async (req, res) => {
    try {
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, MESSAGES_ABI, getProvider());
        const raw = await contract.getAllMessages();

        const messages = raw.map((m) => ({
            ticketNumber: Number(m.ticketNumber),
            sender: m.sender,
            text: m.text,
            timestamp: Number(m.timestamp),
            reply: m.reply,
            hasReply: m.hasReply,
            replyTimestamp: Number(m.replyTimestamp),
        }));

        return res.json({ success: true, messages });
    } catch (err) {
        console.error('Messages error:', err);
        return res.status(500).json({ error: 'Failed to fetch messages from blockchain.' });
    }
});

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Letters to Ko Ko Ye backend running on port ${PORT}`));
