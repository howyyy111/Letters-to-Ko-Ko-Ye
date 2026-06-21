import { ethers } from 'ethers';

const CONTRACT_ABI = [
  "function getAllMessages() external view returns (tuple(uint256 ticketNumber, address sender, string text, uint256 timestamp, string reply, bool hasReply, uint256 replyTimestamp)[])",
];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, provider);
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

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    return res.json({ success: true, messages });
  } catch (err) {
    console.error('Messages error:', err);
    return res.status(500).json({ error: 'Failed to fetch messages from blockchain.' });
  }
}
