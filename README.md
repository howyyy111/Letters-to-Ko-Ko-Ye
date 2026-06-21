# Letters to Ko Ko Ye ✉️

A public guestbook where anyone in the world can write a letter to Ko Ko Ye — and those letters are saved forever on the blockchain.

No crypto knowledge needed. No fees. Just write.

---

## If you've never heard of blockchain before

First — take a breath. You do not need to understand blockchain to use this. You do not need to install anything, buy anything, or learn anything new. If you can send an email, you can write a letter here.

This section is for people who are curious about how it works under the hood — explained without any jargon.

---

### Start here: what even is a blockchain?

Imagine a notebook that thousands of computers around the world all share a copy of. Every time someone writes something new in the notebook, all those computers update their copy at the same time.

Because everyone has a copy, no single person — not even the person who built this website — can go back and erase or change what was written. It's like carving your name into stone instead of writing it in sand.

**That notebook is the blockchain. Your letter goes into that notebook.**

---

### "But I heard crypto is dangerous / a scam / confusing"

You're not wrong that a lot of things in the crypto world are confusing or risky. But those risks usually come from things like:

- Buying coins hoping the price goes up (speculation)
- Connecting your real wallet with real money to unknown websites
- Sending money to strangers

**None of that happens here.** You are not buying anything. You are not connecting a real wallet. You are not sending money to anyone. You are writing a letter — and we handle the technical side completely invisibly.

---

### Things you are NOT doing on this site

- You are **not** buying cryptocurrency
- You are **not** connecting MetaMask or any wallet app
- You are **not** giving anyone your bank details
- You are **not** agreeing to any financial transaction
- You are **not** risking any money

The only thing happening is: your words are being saved permanently in a public place. That's it.

---

### What is a "wallet" and why does it get created for me?

In the real world, a wallet holds your money. On the blockchain, a wallet is more like a name tag — a unique ID that says "this letter was written by this person."

When you sign in with your email or Google, the app quietly creates a wallet for you behind the scenes. You never see it, never touch it, never put money in it. It's just used to stamp your letter with a unique identity so it can be stored correctly.

Think of it like a library card that gets automatically issued when you walk in — you don't have to apply for it, it just exists so the library knows who checked out which book.

---

### What is "gas" and why do I not have to pay it?

Saving something permanently on the blockchain isn't free — the thousands of computers that maintain that shared notebook need to do some work, and there's a tiny fee for that work. This fee is called "gas."

Normally in crypto apps, users pay this fee themselves. That's a huge barrier — you'd need to already own some Ethereum just to say hello.

We remove that barrier completely. We pay the gas fee on your behalf every time someone writes a letter. You never see it, never deal with it. It's like a café that covers the tip so you don't have to worry about it.

---

### How writing a letter actually works (in plain English)

1. **You open the site** — it looks like any normal website
2. **You click "Leave your letter"** — a familiar login window appears
3. **You sign in with email or Google** — exactly like signing into any app
4. **A wallet is quietly created for you** — invisible to you, handled automatically
5. **You type your letter** — just words, nothing else
6. **You click send** — we cover the small network fee for you
7. **Your letter gets a ticket number** (#001, #002…) and appears on the wall
8. **It lives there forever** — even if this website shuts down someday

No downloads. No crypto. No confusion. Just your words, permanently saved.

---

### What does "permanent" actually mean?

Most things on the internet can disappear. Companies shut down. Servers get deleted. Links break. Photos get removed.

The blockchain is different. Because thousands of computers all hold a copy of the same data, there is no single server to shut down. Even if the company behind this website closes tomorrow, your letter is still sitting in that shared notebook, readable by anyone who knows how to look.

Permanent means permanent.

---

### Can I read the code? Here's what it does, in plain English

This project is open source — all the code is public. Here's what the important pieces actually do, explained without technical terms.

#### The contract (the rules carved in stone)

The file `contract/contracts/LettersToKoKoYe.sol` is the heart of the project. A "contract" in blockchain terms is a set of rules that lives on the blockchain itself — not on our server, not in our control. Once it's published, even we can't change what it does.

Think of it like a vending machine. The rules are built into the machine. You put something in, you get something out. Nobody stands behind the machine deciding what to give you — the machine just follows its own rules automatically.

What the contract does:

- **Stores letters** — every letter is saved with who wrote it, when, and what it said
- **Gives each letter a ticket number** — so letters can be found and replied to (#001, #002…)
- **Lets Ko Ko Ye reply** — only Ko Ko Ye's account can add replies, nobody else
- **Enforces the rules** — the contract can be set so each person can only write one letter

```
"Your letter is not stored on our server.
 It is stored in a shared notebook that we cannot edit."
```

#### The backend (the invisible helper)

The file `backend/index.js` is the part of the project that runs on our server — think of it as the staff working behind the counter at the café.

What it does:

- **Checks who you are** — when you log in with email or Google, it confirms your identity
- **Pays the gas fee for you** — it has a small amount of Ethereum set aside just to cover the cost of saving your letter. You never touch this.
- **Sends your letter to the contract** — it takes your words and puts them into the blockchain on your behalf

Without the backend, you'd need to own Ethereum yourself and know how to use a crypto wallet. The backend exists so you don't have to.

#### The frontend (what you actually see)

The files in `frontend/src/` are the visual part — the buttons, the text, the wall of letters you read.

It's built with React, which is just a popular tool for building websites. The design uses warm cream and gold colors to feel personal and handwritten, not cold and technical.

The frontend talks to both the backend (to send your letter) and directly to the blockchain (to read existing letters). Reading from the blockchain is always free — you only need to pay when you're writing something new.

---

### One last thing

If you write a letter here, it will be there long after both of us are gone.

That's not a scary thing. That's the whole point.

---

## If you're familiar with Web3

### Stack

| Layer | Technology |
|---|---|
| Smart contract | Solidity ^0.8.20, deployed on Sepolia testnet, compiled with Hardhat |
| Backend | Node.js ESM, Express, ethers.js v6, Privy token verification |
| Frontend | React 18, Vite, Privy React SDK, ethers.js v6, plain CSS |
| Auth | Privy (email + Google only, embedded wallet auto-created on login) |
| Gas sponsorship | Backend relay wallet (see below) |

### Contract

`LettersToKoKoYe.sol` stores messages as an array of structs with ticket numbers, sender address, text, timestamp, and an optional reply from the owner. Features:

- `limitOnePerWallet` toggle — owner can enforce one message per address
- `addReply(ticketNumber, reply)` — owner-only, permanently attaches a reply on-chain
- `transferOwnership()` — hand the reply panel to Ko Ko Ye's real wallet
- 32 Hardhat tests covering all paths

### Gas sponsorship — current approach (ETH drip)

When a new user signs in, the backend checks their Privy user ID against a JSON store. If they haven't been seen before, the backend drips **0.001 Sepolia ETH** to their embedded wallet — enough to cover the `writeMessage` transaction. This is a one-time drip per user, tracked to prevent double-sends.

```
User logs in → backend drips 0.001 ETH → user's wallet pays gas → contract stores message
```

This works but has a drawback: the sponsor wallet must hold both the drip amounts and gas for the drip transactions themselves.

### Gas sponsorship — better approach (meta-transactions)

Instead of funding the user's wallet, the backend can submit the transaction directly and pay gas, while the contract verifies a user signature to attribute the message correctly.

**Contract change — add a relay function:**

```solidity
function writeMessageFor(
    address user,
    string calldata message,
    bytes calldata signature
) external {
    bytes32 hash = keccak256(abi.encodePacked(user, message));
    bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(hash);
    address recovered = ECDSA.recover(ethHash, signature);
    require(recovered == user, "Invalid signature");

    // msg.sender is the backend relay wallet
    // but the message is attributed to `user`
    messages.push(Message(user, message, block.timestamp));
}
```

**Frontend change — sign instead of send:**

```js
const hash = ethers.solidityPackedKeccak256(
    ["address", "string"],
    [userAddress, messageText]
);
const signature = await signer.signMessage(ethers.getBytes(hash));

await fetch("/api/write", {
    method: "POST",
    body: JSON.stringify({ user: userAddress, message: messageText, signature })
});
```

**Backend change — relay the transaction:**

```js
app.post("/api/write", async (req, res) => {
    const { user, message, signature } = req.body;
    const tx = await contract.writeMessageFor(user, message, signature);
    await tx.wait();
    res.json({ success: true });
});
```

**Comparison:**

| | ETH drip (current) | Meta-transaction relay |
|---|---|---|
| User needs ETH | Yes (dripped to them) | No |
| Backend needs ETH | Yes (drip + gas) | Yes (gas only) |
| Per-user tracking | Required (JSON/Redis) | Not needed |
| Contract complexity | Simple | Slightly more (ECDSA verify) |
| Replay attack protection | N/A | Add nonce to signed payload |

The meta-transaction approach is cleaner — no per-user state, no drip tracking, backend only spends gas.

### Claude Code tooling used in this project

- **MCP** — `.mcp.json` connects the Sepolia blockchain tools so Claude Code can query the network directly during development
- **Skill** — `.claude/skills/letters-to-kokoye/SKILL.md` teaches Claude how to add Burmese translations and top up the sponsor wallet
- **Agent** — `.claude/agents/wall-monitor.md` reads all on-chain messages and checks sponsor wallet balance on demand

### Deploy checklist

1. Deploy `LettersToKoKoYe.sol` to Sepolia via Remix or Hardhat → save address
2. Fund the backend relay wallet with Sepolia ETH (faucet: sepoliafaucet.com)
3. Create a Privy app at privy.io → get `APP_ID` and `APP_SECRET`
4. Fill `backend/.env` from `backend/.env.example`
5. Fill `frontend/.env` from `frontend/.env.example`
6. `cd backend && npm install && npm start`
7. `cd frontend && npm install && npm run dev`
8. Run `transfer-ownership.js` to hand the reply panel to Ko Ko Ye's real wallet

---

*Built for VibeCode Tour · Cohort 1 · by howyyy111*

*The blockchain part is permanent. The letters will outlast the website.*
