# Security Remediation Plan — Letters to Ko Ko Ye

Audit of the dApp (Solidity contract + Express backend + Vercel serverless + React frontend).
**5 CRITICAL, 5 HIGH, 5 MEDIUM, 4 LOW.** Main risks: sponsor-wallet drain and a leaked live API key.

> **Disclosure note:** Items in **Group A (secrets)** must NOT be posted as public GitHub issues — a public issue would advertise the live key and exposed user data. Report those privately to the owner (DM / email / private security advisory). Everything else is safe to file as public issues or open as PRs.

---

## Group A — Secrets & data leaks (PRIVATE disclosure, owner action required)

These need key revocation + git history rewrite. Cannot be fixed by a normal PR alone (history must be purged and force-pushed by the owner).

### A1 · CRITICAL · Live Alchemy API key committed to git
- **Where:** `.mcp.json` (tracked, not in `.gitignore`)
- **Proof:** key present in `git show HEAD:.mcp.json`; endpoint responds to live RPC calls.
- **Impact:** anyone cloning repo gets a working key — quota theft, rate-limit you off your own faucet.
- **Fix (owner, in order):**
  1. Revoke key at dashboard.alchemy.com **now**, generate new one.
  2. Add `.mcp.json` to `.gitignore`.
  3. Move key to env var / Vercel secret.
  4. Purge from history: `git filter-repo --path .mcp.json --invert-paths`, then force-push (coordinate with all clones).

### A2 · CRITICAL · `drips.json` with real user data committed
- **Where:** `backend/drips.json` (tracked, not in `.gitignore`)
- **Impact:** real Privy DIDs + wallet addresses → links pseudonymous chain identities to accounts. Contains an `"undefined"` key entry (dedup bug, wasted real tx).
- **Fix:**
  1. Add `backend/drips.json` to `.gitignore`.
  2. Purge: `git filter-repo --path backend/drips.json --invert-paths`, force-push.
  3. Add null guard (see C5).

---

## Group B — Faucet drain (HIGH-PRIORITY PRs, real money)

The faucet sends real Sepolia ETH. These three combine into a full sponsor-wallet drain. Fix together in one PR.

### B1 · CRITICAL · No wallet-ownership check
- **Where:** `backend/index.js:34`, `frontend/api/drip.js:22`
- **Bug:** sends 0.01 ETH to any `walletAddress` in POST body; JWT verified but address never tied to the authenticated user.
- **Exploit:** authenticate once → redirect ETH to unlimited attacker-controlled addresses.
- **Fix:** verify `walletAddress` is in Privy `claims.linkedAccounts`:
  ```js
  const owned = (claims.linkedAccounts ?? [])
    .filter(a => a.type === 'wallet')
    .map(a => a.address?.toLowerCase());
  if (!owned.includes(walletAddress.toLowerCase()))
    return res.status(403).json({ error: 'Wallet not owned by this account' });
  ```

### B2 · CRITICAL · Race condition in serverless drip (TOCTOU)
- **Where:** `frontend/api/drip.js:8` — `const dripInFlight = new Set()`
- **Bug:** in-memory Set is empty per serverless cold start; Redis check-then-write is not atomic.
- **Exploit:** N concurrent requests, same JWT → N× ETH sent.
- **Fix:** atomic Redis lock before sending tx:
  ```js
  const acquired = await redis.set(kvKey, 'pending', { nx: true, ex: 300 });
  if (!acquired) return res.json({ success: true, alreadyDripped: true });
  try { /* send tx; on success redis.set final data */ }
  catch (e) { await redis.del(kvKey); throw e; }  // release on failure
  ```

### B3 · CRITICAL · No rate limiting on drip endpoints
- **Where:** `backend/index.js`, `frontend/api/drip.js`
- **Fix:** backend `express-rate-limit` (e.g. 3 / 15min / IP); serverless `@upstash/ratelimit` sliding window keyed on `x-forwarded-for` + Privy userId.

### Also in this PR
- **C5 · undefined-user guard:** `if (!privyUserId) return res.status(401)...` before any send.
- **MEDIUM · backend file-DB race:** `backend/database.js` non-atomic read→write. Move to SQLite (`better-sqlite3`) or Redis.

---

## Group C — Smart contract (PR; needs redeploy — discuss with owner)

Contract is immutable once deployed. These can't patch the live contract — they're for the **next deploy / v2**. File as issues; bundle into a v2 PR.

### C1 · HIGH · `getAllMessages()` unbounded → permanent DoS
- **Where:** `contract/contracts/LettersToKoKoYe.sol:127`
- **Bug:** returns whole array; `eth_call` gas limit eventually exceeded → wall breaks forever, no recovery.
- **Fix:** add `getMessages(uint256 offset, uint256 limit)` paginated getter.

### C2 · HIGH · No reply length cap
- **Where:** `.sol:97` `replyToMessage` — `writeMessage` caps 280, reply uncapped.
- **Fix:** `require(bytes(replyText).length <= 500, "Reply too long");`

### C3 · HIGH · Deployer keeps `toggleLimit` after ownership transfer
- **Where:** `.sol:43` `onlyOwnerOrDeployer`, no removal path.
- **Fix:** add `renounceDeployer()` or drop the deployer role entirely.

### C4 · MEDIUM · `replyToMessage` overwrites silently
- **Where:** `.sol:97`
- **Fix:** `require(!_messages[index].hasReply, "Reply exists");` or emit distinct `ReplyUpdated` event.

### C-LOW · `getWalletFirstTicket` returns 0 ambiguously
- **Where:** `.sol:147` — 0 also = "never sent". Document or use sentinel; downstream NFT must check `hasSentMessage()` first.

---

## Group D — Frontend / config hardening (PR)

### D1 · HIGH · RPC key leaks into client bundle
- **Where:** `frontend/.env.example:3` `VITE_RPC_URL`, used `frontend/src/hooks/useContract.js:8`
- **Bug:** all `VITE_*` baked into JS bundle, served to every visitor.
- **Fix:** remove `VITE_RPC_URL`; route reads through `/api/messages` (server already has `process.env.RPC_URL`). Move `useContractOwner()` to `/api/owner` or a `VITE_OWNER_ADDRESS` constant.

### D2 · HIGH · No security headers
- **Where:** `frontend/vercel.json` (no `headers`)
- **Fix:** add CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.

### D3 · MEDIUM · CORS localhost fallback
- **Where:** `backend/index.js:10` — falls back to `http://localhost:5173` if `FRONTEND_URL` unset.
- **Fix:** throw at startup if `FRONTEND_URL` missing in production.

### D4 · MEDIUM · Error logging leaks internals
- **Where:** `backend/index.js:81,93` — logs full err objects (may contain RPC URLs w/ keys).
- **Fix:** log `err.message` + `err.code` only.

### D5 · LOW · Hardhat fallback private key
- **Where:** `contract/hardhat.config.js:4` — falls back to `0x..0001`.
- **Fix:** throw if `DEPLOYER_PRIVATE_KEY` unset on non-local networks.

### D6 · LOW · Dependency CVEs
- **Where:** backend (4 HIGH), frontend (21 HIGH) — mostly `ws` / `uuid` via Privy.
- **Fix:** `npm audit fix` in `backend/` and `frontend/`; bump `@privy-io/*`.

---

## Suggested rollout

| PR / Action | Contents | Type |
|---|---|---|
| **0. Private report** | A1, A2 — revoke key, purge history | owner-only, urgent |
| **PR 1** | B1, B2, B3, C5, backend DB race | faucet drain — **first PR** |
| **PR 2** | D1, D2, D3, D4 | frontend/config hardening |
| **PR 3 (v2 contract)** | C1, C2, C3, C4, C-LOW | needs redeploy — discuss |
| **PR 4** | D5, D6 | low-risk cleanup |

Order by blast radius: secrets → faucet → frontend → contract-v2 → cleanup.