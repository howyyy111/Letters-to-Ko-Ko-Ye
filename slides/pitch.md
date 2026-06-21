---
marp: true
theme: default
paginate: true
transition: fade
# PechaKucha: 6 slides, 20s auto-advance. Do not change the count.
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
---

<!-- slide 1 -->
# Who's my person?

**Ko Ko Ye** — and anyone who wants to write to her.

She's a real person. The letters are real. The blockchain makes them permanent.

*VibeCode Tour · Cohort 1 · howyyy111*

---

<!-- slide 2 -->
# Their problem

Most blockchain apps are **too hard for normal people.**

- No wallet? You're locked out.
- No ETH? You can't send a thing.
- No idea what a "transaction" is? Good luck.

Ko Ko Ye's friends shouldn't need a crypto degree to leave her a letter.

---

<!-- slide 3 -->
# What I built

**Letters to Ko Ko Ye** — a public blockchain guestbook on Sepolia testnet.

- Login with **email or Google** — no MetaMask required
- Gas fees are **sponsored** — users pay nothing
- Messages are **permanent** — on-chain, forever
- Ko Ko Ye gets a private **reply panel** to respond

*Non-crypto users. Real blockchain. Zero friction.*

---

<!-- slide 4 -->
# How I built it

- **MCP:** `.mcp.json` wires Sepolia blockchain tools into Claude Code so it can query the network directly during development
- **Skill:** `.claude/skills/letters-to-kokoye/SKILL.md` teaches Claude how to add Burmese translations and top up the sponsor wallet step-by-step
- **Agent:** `.claude/agents/wall-monitor.md` — run it to get a live dashboard of all messages on the wall and the sponsor wallet balance

*All three were actively used — not just placeholder files.*

---

<!-- slide 5 -->
# Why it matters

The letters will **outlast the website.**

Blockchain permanence isn't a feature — it's the point. Ko Ko Ye can read every letter, forever, even if the frontend disappears.

And anyone in the world can write one **right now**, with just an email address and a thought.

*That's what zero-friction blockchain looks like.*

---

<!-- slide 6 -->
# Done checklist

- [x] repo public
- [x] MCP + skill + agent used
- [ ] report.md in team repo
