import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'drips.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return { drips: {} };
  }
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function hasUserReceivedDrip(privyUserId) {
  return !!load().drips[privyUserId];
}

export function recordDrip(privyUserId, walletAddress, txHash) {
  const data = load();
  data.drips[privyUserId] = { walletAddress, txHash, createdAt: new Date().toISOString() };
  save(data);
}
