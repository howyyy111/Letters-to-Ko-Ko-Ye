# Skill: Letters to Ko Ko Ye

This skill teaches you how to work with the Letters to Ko Ko Ye project — a blockchain guestbook on Sepolia testnet. Read this before making any changes to translations or the sponsor wallet.

---

## HOW TO ADD NEW TRANSLATIONS

### File location
`frontend/src/i18n/translations.js`

### Structure
The file exports a `translations` object with two keys: `en` (English) and `my` (Burmese/Myanmar). Every UI string must exist in BOTH languages.

```js
export const translations = {
  en: {
    keyName: 'English text here',
    // ... more keys
  },
  my: {
    keyName: 'မြန်မာဘာသာ စာသား ဤနေရာတွင်',
    // ... same keys
  },
};
```

### How to add a new string

**Step 1** — Add the English version inside the `en` object:
```js
en: {
  // ... existing keys ...
  shareOnTwitter: 'Share on Twitter',
},
```

**Step 2** — Add the Burmese version inside the `my` object, using the EXACT same key name:
```js
my: {
  // ... existing keys ...
  shareOnTwitter: 'Twitter တွင် မျှဝေပါ',
},
```

**Step 3** — Use the string in a component via the `t()` helper:
```jsx
import { t } from '../i18n/translations.js';

// Inside a component that receives `lang` as a prop:
<button>{t(lang, 'shareOnTwitter')}</button>
```

### The t() helper
```js
export function t(lang, key) {
  return translations[lang]?.[key] ?? translations['en'][key] ?? key;
}
```
- Falls back to English if the key is missing in Burmese
- Falls back to the key name itself if it's missing entirely
- Never crashes — safe to call with any key

### Complete example: adding a "copy link" feature

```js
// In translations.js — en section:
copyLink: 'Copy link',
copyLinkSuccess: 'Link copied!',

// In translations.js — my section:
copyLink: 'လင့်ကို ကူးယူပါ',
copyLinkSuccess: 'လင့် ကူးယူပြီးပါပြီ!',

// In a component:
import { t } from '../i18n/translations.js';

function ShareButton({ lang }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={handleCopy}>
      {copied ? t(lang, 'copyLinkSuccess') : t(lang, 'copyLink')}
    </button>
  );
}
```

### Burmese translation tips
- If you don't have a Burmese translation, use the English text as a temporary placeholder and mark it with a comment: `// TODO: translate`
- Myanmar Unicode characters are fully supported — no encoding issues
- Keep Burmese text concise; Myanmar script is naturally compact

---

## HOW TO TOP UP THE SPONSOR WALLET

### What is the sponsor wallet?
The sponsor wallet is a dedicated Ethereum wallet that pays gas fees on behalf of new users. When a user signs in for the first time, the backend (`backend/index.js`) automatically sends them 0.001 Sepolia ETH from this wallet. This lets non-crypto users write their first letter without needing to understand gas.

Each drip costs exactly 0.001 ETH + a small gas fee (~0.0001 ETH). Budget ~0.0011 ETH per new user.

### Finding the sponsor wallet address

The private key is stored in `backend/.env`:
```
SPONSOR_WALLET_PRIVATE_KEY=0xabc123...
```

To get the public address from the private key, run this in the project root:
```bash
node -e "
const { ethers } = await import('ethers');
const wallet = new ethers.Wallet(process.env.SPONSOR_WALLET_PRIVATE_KEY);
console.log('Sponsor wallet address:', wallet.address);
" --input-type=module
```

Or check `backend/.env` — if you previously saved the address there, look for:
```
SPONSOR_WALLET_ADDRESS=0x...
```

### Checking the current balance via MCP

With the `ethers-sepolia` MCP server configured, ask Claude Code:
> "What is the Sepolia ETH balance of address 0xYOUR_SPONSOR_ADDRESS?"

The MCP tool `eth_getBalance` will return the balance in wei. Divide by 1e18 to get ETH.

Alternatively, check on Sepolia Etherscan:
```
https://sepolia.etherscan.io/address/0xYOUR_SPONSOR_ADDRESS
```

### Warning signs — when to top up

| Balance        | Status    | Action needed                        |
|----------------|-----------|--------------------------------------|
| > 0.1 ETH      | ✅ Healthy | No action needed                     |
| 0.01–0.1 ETH   | ⚠️ Low    | Top up soon (can fund 10–90 users)   |
| < 0.01 ETH     | 🚨 ALERT  | Top up immediately (< 10 users left) |
| 0 ETH          | ❌ Empty  | Drips will fail; users get errors    |

The wall-monitor agent (`.claude/agents/wall-monitor.md`) checks this automatically and will alert you when balance is below 0.01 ETH.

### Getting Sepolia ETH from a faucet

1. Go to one of these faucets:
   - https://sepoliafaucet.com (Alchemy — requires account)
   - https://www.infura.io/faucet/sepolia (Infura — requires account)
   - https://faucet.sepolia.dev (Google Cloud — requires Google account)

2. Paste your sponsor wallet address

3. Request ETH (usually 0.1–0.5 ETH per request)

4. Wait 1–2 minutes for the transaction to confirm

### Sending ETH to the sponsor wallet

Once you have Sepolia ETH in another wallet, send it to the sponsor wallet address via:
- MetaMask (switch to Sepolia network first)
- Any Sepolia-compatible wallet
- The MCP tool if your MCP wallet has funds

### How many drips remain?

```
drips_remaining = floor(current_balance / 0.0011)
```

Example: 0.055 ETH balance → ~50 drips remaining

The wall-monitor agent calculates this automatically in its reports.

### After topping up

The backend reads balance on every drip request — no restart needed. The sponsor wallet is immediately ready to send drips after the top-up transaction confirms on Sepolia.
