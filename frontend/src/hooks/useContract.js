import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const ABI = [
  "function getAllMessages() external view returns (tuple(uint256 ticketNumber, address sender, string text, uint256 timestamp, string reply, bool hasReply, uint256 replyTimestamp)[])",
  "function writeMessage(string calldata text) external",
  "function replyToMessage(uint256 ticketNumber, string calldata replyText) external",
  "function owner() external view returns (address)",
  "event MessageWritten(uint256 indexed ticketNumber, address indexed sender, string text, uint256 timestamp)",
];

function getReadContract() {
  const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL);
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
}

function getWriteContract(signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
}

export function useMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/messages');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { messages, loading, error, refetch: fetchMessages };
}

export function useContractOwner() {
  const [owner, setOwner] = useState(null);

  useEffect(() => {
    getReadContract().owner().then(setOwner).catch(() => {});
  }, []);

  return owner;
}

export async function writeMessage(signer, text) {
  const tx = await getWriteContract(signer).writeMessage(text);
  return tx.wait();
}

export async function replyToMessage(signer, ticketNumber, replyText) {
  const tx = await getWriteContract(signer).replyToMessage(ticketNumber, replyText);
  return tx.wait();
}

export function parseTicketFromReceipt(receipt) {
  const iface = new ethers.Interface([ABI[4]]);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics, data: log.data });
      if (parsed?.name === 'MessageWritten') return Number(parsed.args.ticketNumber);
    } catch { /* skip unrelated logs */ }
  }
  return null;
}

export function formatTicket(num) {
  return `#${String(num).padStart(3, '0')}`;
}

export function shortenAddress(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatTimestamp(ts) {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getCardAccentColor(address) {
  if (!address) return '#D4A017';
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 40) + 20;
  const sat = 55 + Math.abs((hash >> 4) % 25);
  const light = 42 + Math.abs((hash >> 8) % 18);
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}
