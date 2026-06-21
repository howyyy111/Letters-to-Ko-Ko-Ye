# Private Security Report — Letters to Ko Ko Ye

**To:** project owner
**From:** kokoye2007
**Confidential — do not file publicly until secrets are rotated and history is purged.**

---

Hi,

I ran a security review of the Letters to Ko Ko Ye dApp (contract + backend + serverless + frontend). Good news first, then the issues.

## Good news — end users are safe

- The dApp never touches user private keys. Wallets sign locally (Privy / MetaMask); the app cannot move user funds.
- **No XSS.** I checked the message wall — `LetterCard.jsx` renders `message.text` and `message.reply` as plain React text children, which auto-escape HTML. There is no `dangerouslySetInnerHTML`, `innerHTML`, or `eval` anywhere in the frontend. An attacker cannot inject script via a guestbook message.
- The contract only asks users to sign `writeMessage` — no hidden token approvals, no `setApprovalForAll`. Safe to sign.

**The risks below affect the project owner (your sponsor wallet, your API quota, past users' privacy) — not end users' funds.**

---

## URGENT — rotate these now (live exposure)

### 1. Live Alchemy API key committed to git
- File: `.mcp.json` (tracked, not gitignored)
- The key is live and works right now.
- **Action:** revoke at dashboard.alchemy.com, generate a new key, move it to an env var, add `.mcp.json` to `.gitignore`, then purge it from git history:
  `git filter-repo --path .mcp.json --invert-paths` and force-push.

### 2. Real user data committed to git
- File: `backend/drips.json` (tracked, not gitignored)
- Contains real Privy user IDs + wallet addresses (links accounts to chain identities). Also has an `"undefined"` entry from a dedup bug that sent a wasted transaction.
- **Action:** add to `.gitignore`, purge from history (same `git filter-repo` step), force-push.

---

## HIGH — faucet can be drained (your sponsor ETH)

The /drip faucet sends real Sepolia ETH. Three issues combine into a full drain of the sponsor wallet:

1. **No wallet-ownership check** — `backend/index.js:34`, `frontend/api/drip.js:22`. The endpoint sends ETH to any `walletAddress` in the request body. The Privy JWT is verified, but the address is never checked against the user's linked wallets. One login can redirect ETH to unlimited addresses.

2. **Race condition** — `frontend/api/drip.js:8`. Dedup uses an in-memory `Set`, which is empty on every serverless cold start; the Redis check-then-write is not atomic. Sending several requests at once with the same login multiplies the ETH paid out.

3. **No rate limiting** on either drip endpoint, which makes the above trivial to script.

**Fix:** verify the wallet against Privy `claims.linkedAccounts`; replace the in-memory Set with an atomic Redis `SET NX` lock; add rate limiting (`express-rate-limit` on the backend, `@upstash/ratelimit` on serverless). Also add a guard so a request with no user ID is rejected.

---

## MEDIUM / LOW

- **RPC key leaks to the browser** — `VITE_RPC_URL` (frontend/.env, used in `useContract.js:8`). All `VITE_*` vars are baked into the public JS bundle. Route reads through the `/api/messages` endpoint instead and drop the client-side RPC key.
- **No security headers** — `frontend/vercel.json` has none. Add CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` (clickjacking / defense-in-depth).
- **CORS** falls back to `localhost` if `FRONTEND_URL` is unset — throw at startup in production instead.
- **Error logging** dumps full error objects (`backend/index.js:81,93`) which can include RPC URLs with keys — log `err.message` only.
- **Hardhat fallback key** `0x..0001` in `contract/hardhat.config.js:4` — throw if `DEPLOYER_PRIVATE_KEY` is unset.
- **npm audit** — backend 4 high, frontend 21 high (mostly `ws`/`uuid` via Privy). Run `npm audit fix`.

## Contract (immutable — for a future v2, not urgent)
- `getAllMessages()` returns the whole array; it will eventually exceed the RPC gas limit and break the wall permanently. Add a paginated getter in v2.
- `replyToMessage` has no length cap and can silently overwrite an existing reply; `deployer` keeps `toggleLimit` rights after ownership transfer. Address in v2.

---

## Priority order
1. Revoke the Alchemy key + purge both files from history (urgent).
2. Harden the drip endpoints (ownership check + atomic lock + rate limit).
3. Remove the client-side RPC key, add security headers.
4. Cleanup (logging, CORS, hardhat, npm audit).
5. Plan a contract v2 (pagination, reply cap) — no rush.

Happy to send code patches for items 2–4 as a PR if useful.

Thanks,
kokoye2007