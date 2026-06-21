import { PrivyClient } from '@privy-io/server-auth';
import { ethers } from 'ethers';
import { Redis } from '@upstash/redis';

const privy = new PrivyClient(process.env.PRIVY_APP_ID, process.env.PRIVY_APP_SECRET);
const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
const DRIP_AMOUNT = ethers.parseEther('0.01');

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

    const kvKey = `drip:${privyUserId}`;

    const alreadyDripped = await redis.exists(kvKey);
    if (alreadyDripped) {
      return res.json({ success: true, alreadyDripped: true, message: 'Wallet already funded' });
    }

    // Atomic lock: SET NX prevents concurrent serverless invocations from double-dripping
    const lockKey = `drip:lock:${privyUserId}`;
    const acquired = await redis.set(lockKey, '1', { nx: true, ex: 300 });
    if (!acquired) {
      return res.json({ success: true, alreadyDripped: true, message: 'Drip already in progress' });
    }

    try {
      const sponsor = getSponsorWallet();
      const balance = await getProvider().getBalance(sponsor.address);

      if (balance < DRIP_AMOUNT) {
        await redis.del(lockKey);
        return res.status(503).json({ error: 'Sponsor wallet is low on funds. Please try again later.' });
      }

      const tx = await sponsor.sendTransaction({ to: walletAddress, value: DRIP_AMOUNT });
      await tx.wait();

      await redis.set(kvKey, { walletAddress, txHash: tx.hash, createdAt: new Date().toISOString() });
      await redis.del(lockKey);

      return res.json({ success: true, alreadyDripped: false, txHash: tx.hash, message: 'Drip sent successfully' });
    } catch (err) {
      await redis.del(lockKey);
      throw err;
    }
  } catch (err) {
    console.error('Drip error:', err.message, err.code);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
