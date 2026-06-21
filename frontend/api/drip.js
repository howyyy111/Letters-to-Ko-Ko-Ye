import { PrivyClient } from '@privy-io/server-auth';
import { ethers } from 'ethers';
import { Redis } from '@upstash/redis';

const privy = new PrivyClient(process.env.PRIVY_APP_ID, process.env.PRIVY_APP_SECRET);
const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
const DRIP_AMOUNT = ethers.parseEther('0.01');
const dripInFlight = new Set();

function getProvider() {
  return new ethers.JsonRpcProvider(process.env.RPC_URL);
}

function getSponsorWallet() {
  return new ethers.Wallet(process.env.SPONSOR_WALLET_PRIVATE_KEY, getProvider());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

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
    const kvKey = `drip:${privyUserId}`;

    const alreadyDripped = await redis.exists(kvKey);
    if (alreadyDripped) {
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

      await redis.set(kvKey, { walletAddress, txHash: tx.hash, createdAt: new Date().toISOString() });

      return res.json({ success: true, alreadyDripped: false, txHash: tx.hash, message: 'Drip sent successfully' });
    } finally {
      dripInFlight.delete(privyUserId);
    }
  } catch (err) {
    console.error('Drip error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
