import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { PrivyClient } from '@privy-io/server-auth';
import { hasUserReceivedDrip, recordDrip } from './database.js';

const app = express();
app.use(express.json());
const allowedOrigin = process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : (process.env.FRONTEND_URL || 'http://localhost:5173');
if (!allowedOrigin) throw new Error('FRONTEND_URL must be set in production');
app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

const privy = new PrivyClient(process.env.PRIVY_APP_ID, process.env.PRIVY_APP_SECRET);
const DRIP_AMOUNT = ethers.parseEther('0.01');

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
        if (!privyUserId) {
            return res.status(401).json({ error: 'Could not identify user' });
        }

        const user = await privy.getUser(privyUserId);
        const ownedWallets = (user.linkedAccounts ?? [])
            .filter(a => a.type === 'wallet')
            .map(a => a.address?.toLowerCase());
        if (!ownedWallets.includes(walletAddress.toLowerCase())) {
            return res.status(403).json({ error: 'Wallet not owned by this account' });
        }

        if (hasUserReceivedDrip(privyUserId)) {
            return res.json({ success: true, alreadyDripped: true, message: 'Wallet already funded' });
        }

        const sponsor = getSponsorWallet();
        const balance = await getProvider().getBalance(sponsor.address);

        if (balance < DRIP_AMOUNT) {
            return res.status(503).json({ error: 'Sponsor wallet is low on funds. Please try again later.' });
        }

        const tx = await sponsor.sendTransaction({ to: walletAddress, value: DRIP_AMOUNT });
        await tx.wait();

        recordDrip(privyUserId, walletAddress, tx.hash);

        return res.json({ success: true, alreadyDripped: false, txHash: tx.hash, message: 'Drip sent successfully' });
    } catch (err) {
        console.error('Drip error:', err.message, err.code);
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
        console.error('Messages error:', err.message, err.code);
        return res.status(500).json({ error: 'Failed to fetch messages from blockchain.' });
    }
});

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Letters to Ko Ko Ye backend running on port ${PORT}`));
