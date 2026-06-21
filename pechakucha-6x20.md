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
  strong { color: #8B2A1A; }
---

<!-- slide 1 -->
# Ko Ko Ye will read your letter.

She's a real person. This is a real guestbook.
And every message is written **directly onto the blockchain** — permanent, public, unstoppable.

You don't need crypto. You don't need a wallet.
You just need something to say.

*VibeCode Tour · Cohort 1 · howyyy111*

---

<!-- slide 2 -->
# "I want to write to her — but how?"

Most blockchain apps greet you with a wall of jargon.
*Install MetaMask. Buy ETH. Approve transaction. Pay gas.*

By the time you figure it out, the moment is gone.

Ko Ko Ye's friends shouldn't have to solve a puzzle
just to say **"I miss you."**

---

<!-- slide 3 -->
# A letter. Forever. In 30 seconds.

**Letters to Ko Ko Ye** — a blockchain guestbook anyone can use.

- Sign in with **email or Google** — no wallet needed
- Gas is **fully sponsored** — you pay absolutely nothing
- Your words are **on-chain** — permanent, censorship-proof
- Ko Ko Ye has a **private reply panel** — she writes back

*The blockchain remembers. Even when everything else forgets.*

---

<!-- slide 4 -->
# How I built it (with Claude as a teammate)

- **MCP:** Claude could query the Sepolia blockchain live during dev — catching bugs before users did
- **Skill:** A custom skill taught Claude to add Burmese translations and top up the sponsor wallet, step by step
- **Agent:** A wall-monitor agent gives a live dashboard — all letters, all balances, one command

*Claude didn't just write code. It understood the project.*

---

<!-- slide 5 -->
# Why this one is different

Most apps are **rented** — shut down the server, gone forever.

This one is **owned** — by the blockchain, by the people who wrote to her.

Letter #001 exists whether the website is up or not.
Whether I maintain it or not.
Whether Ko Ko Ye is reachable or not.

**The letters will outlast all of us.**

---

<!-- slide 6 -->
# Done checklist

- [x] repo public
- [x] MCP + skill + agent used
- [ ] report.md in team repo
