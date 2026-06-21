---
marp: true
theme: default
paginate: false
auto-advance: 20
style: |
  section {
    background: #fdf6e3;
    color: #2c1810;
    font-family: Georgia, serif;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 3rem;
  }
  h1 { color: #8B2A1A; font-size: 2.4rem; margin-bottom: 0.5rem; }
  h2 { color: #8B2A1A; font-size: 1.8rem; margin-bottom: 1rem; }
  p  { font-size: 1.15rem; line-height: 1.7; color: #3d2010; }
  code { background: #f0e2c0; padding: 0.2em 0.5em; border-radius: 4px; font-size: 0.95rem; }
  ul { text-align: left; font-size: 1.1rem; line-height: 1.8; }
  .tag { display: inline-block; background: #d4a017; color: #fff; padding: 0.2em 0.7em; border-radius: 20px; font-size: 0.85rem; margin: 0.2em; }
---

# Letters to Ko Ko Ye ✉️

### A public blockchain guestbook on Sepolia testnet

Anyone can write a letter — **no crypto knowledge needed.**
Ko Ko Ye can read and reply to every one, forever.

*VibeCode Tour · Cohort 1 · howyyy111*

---

## The Problem It Solves

Most blockchain apps are **too hard for normal people.**

Letters to Ko Ko Ye flips that:

- Login with **email or Google** — no MetaMask required
- Gas fees are **sponsored** — users pay nothing
- Messages are **permanent** — on-chain, forever
- Ko Ko Ye gets a private **reply panel** to respond

*Non-crypto users. Real blockchain. Zero friction.*

---

## How It's Built

**3-layer stack:**

- **Smart contract** — Solidity on Sepolia, compiled with Hardhat (32 tests ✅)
- **Backend / Serverless** — Privy auth + ETH drip sponsor wallet + Upstash Redis
- **Frontend** — React + Vite + Privy embedded wallets

**Key decisions:**
- Replaced `better-sqlite3` (broke on Node v24) → plain JSON file locally
- Replaced `@vercel/kv` (discontinued) → Upstash Redis
- `dripInFlight` Set prevents double-drip race condition

---

## MCP · Skill · Agent

**MCP** — `.mcp.json` wires in the Sepolia blockchain tools so Claude Code can query the network directly during development

**Skill** — `.claude/skills/letters-to-kokoye/SKILL.md` teaches Claude how to add Burmese translations and top up the sponsor wallet step-by-step

**Agent** — `.claude/agents/wall-monitor.md` is a dashboard agent: run it to get a live summary of all messages on the wall + sponsor wallet balance

*All three were actively used — not just placeholder files.*

---

## One Feature, End-to-End

**Writing a letter (the vertical slice):**

1. User clicks "Leave your letter" → Privy modal opens
2. Signs in with email/Google → embedded wallet created automatically
3. Backend drips **0.001 Sepolia ETH** to their wallet (sponsor pays)
4. User types message → signs transaction with their new wallet
5. Smart contract stores it on-chain with a ticket number (`#001`, `#002`…)
6. Letter appears on the Wall immediately, searchable, paginated

*Every step works. No crypto knowledge needed at any point.*

---

## What's Next

**Transfer ownership** — hand the contract's reply panel to Ko Ko Ye's real wallet (script already written: `transfer-ownership.js`)

**Fund the sponsor wallet** — top up with Sepolia ETH so more users can write letters

**Myanmar language** — translations already live in `translations.js`, Ko Ko Ye can edit them directly

**Ship it** — deploy to Vercel, share the URL, let people write letters forever

*The blockchain part is permanent. The letters will outlast the website.*
