const { expect } = require('chai');
const { ethers } = require('hardhat');
const { time } = require('@nomicfoundation/hardhat-network-helpers');

describe('LettersToKoKoYe', function () {
  async function deploy() {
    const [deployer, user1, user2, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('LettersToKoKoYe');
    const contract = await Factory.deploy();
    return { contract, deployer, user1, user2, stranger };
  }

  // ──────────────────────────────────────────
  // writeMessage
  // ──────────────────────────────────────────
  describe('writeMessage', function () {
    it('stores the message with correct fields', async function () {
      const { contract, user1 } = await deploy();

      const before = await time.latest();
      await contract.connect(user1).writeMessage('Hello Ko Ko Ye!');
      const after = await time.latest();

      const msgs = await contract.getAllMessages();
      expect(msgs).to.have.length(1);

      const m = msgs[0];
      expect(m.ticketNumber).to.equal(1n);
      expect(m.sender).to.equal(user1.address);
      expect(m.text).to.equal('Hello Ko Ko Ye!');
      expect(m.timestamp).to.be.within(BigInt(before), BigInt(after));
      expect(m.hasReply).to.be.false;
      expect(m.reply).to.equal('');
      expect(m.replyTimestamp).to.equal(0n);
    });

    it('emits MessageWritten event', async function () {
      const { contract, user1 } = await deploy();

      await expect(contract.connect(user1).writeMessage('Testing events'))
        .to.emit(contract, 'MessageWritten')
        .withArgs(1n, user1.address, 'Testing events', await time.latest() + 1);
    });

    it('rejects empty messages', async function () {
      const { contract, user1 } = await deploy();
      await expect(contract.connect(user1).writeMessage('')).to.be.revertedWith(
        'Message cannot be empty'
      );
    });

    it('rejects messages over 280 characters', async function () {
      const { contract, user1 } = await deploy();
      const tooLong = 'a'.repeat(281);
      await expect(contract.connect(user1).writeMessage(tooLong)).to.be.revertedWith(
        'Message too long'
      );
    });

    it('accepts exactly 280 characters', async function () {
      const { contract, user1 } = await deploy();
      const maxLen = 'a'.repeat(280);
      await expect(contract.connect(user1).writeMessage(maxLen)).to.not.be.reverted;
    });
  });

  // ──────────────────────────────────────────
  // Ticket numbers
  // ──────────────────────────────────────────
  describe('ticket numbers', function () {
    it('increments correctly across multiple senders', async function () {
      const { contract, user1, user2, stranger } = await deploy();

      await contract.connect(user1).writeMessage('First letter');
      await contract.connect(user2).writeMessage('Second letter');
      await contract.connect(stranger).writeMessage('Third letter');

      const msgs = await contract.getAllMessages();
      expect(msgs[0].ticketNumber).to.equal(1n);
      expect(msgs[1].ticketNumber).to.equal(2n);
      expect(msgs[2].ticketNumber).to.equal(3n);
    });

    it('getTotalMessages returns correct count', async function () {
      const { contract, user1, user2 } = await deploy();

      expect(await contract.getTotalMessages()).to.equal(0n);

      await contract.connect(user1).writeMessage('One');
      expect(await contract.getTotalMessages()).to.equal(1n);

      await contract.connect(user2).writeMessage('Two');
      expect(await contract.getTotalMessages()).to.equal(2n);
    });

    it('getMessageByTicket retrieves correct message', async function () {
      const { contract, user1, user2 } = await deploy();

      await contract.connect(user1).writeMessage('First');
      await contract.connect(user2).writeMessage('Second');

      const first = await contract.getMessageByTicket(1);
      const second = await contract.getMessageByTicket(2);

      expect(first.text).to.equal('First');
      expect(second.text).to.equal('Second');
    });

    it('getMessageByTicket reverts on invalid ticket', async function () {
      const { contract, user1 } = await deploy();
      await contract.connect(user1).writeMessage('Only message');

      await expect(contract.getMessageByTicket(0)).to.be.revertedWith(
        'Invalid ticket number'
      );
      await expect(contract.getMessageByTicket(2)).to.be.revertedWith(
        'Invalid ticket number'
      );
    });
  });

  // ──────────────────────────────────────────
  // Limit toggle
  // ──────────────────────────────────────────
  describe('toggleLimit', function () {
    it('starts with limit disabled', async function () {
      const { contract } = await deploy();
      expect(await contract.limitOnePerWallet()).to.be.false;
    });

    it('owner can enable the limit', async function () {
      const { contract, deployer } = await deploy();
      await contract.connect(deployer).toggleLimit(true);
      expect(await contract.limitOnePerWallet()).to.be.true;
    });

    it('deployer can enable the limit', async function () {
      const { contract, deployer } = await deploy();
      await contract.connect(deployer).toggleLimit(true);
      expect(await contract.limitOnePerWallet()).to.be.true;
    });

    it('emits LimitToggled event', async function () {
      const { contract, deployer } = await deploy();
      await expect(contract.connect(deployer).toggleLimit(true))
        .to.emit(contract, 'LimitToggled')
        .withArgs(true);
    });

    it('blocks second message from same wallet when limit is on', async function () {
      const { contract, deployer, user1 } = await deploy();

      await contract.connect(deployer).toggleLimit(true);
      await contract.connect(user1).writeMessage('First');

      await expect(contract.connect(user1).writeMessage('Second')).to.be.revertedWith(
        'Already sent a message'
      );
    });

    it('allows second message from same wallet when limit is off', async function () {
      const { contract, user1 } = await deploy();

      await contract.connect(user1).writeMessage('First');
      await expect(contract.connect(user1).writeMessage('Second')).to.not.be.reverted;

      expect(await contract.getTotalMessages()).to.equal(2n);
    });

    it('different wallets can each send one when limit is on', async function () {
      const { contract, deployer, user1, user2 } = await deploy();

      await contract.connect(deployer).toggleLimit(true);
      await contract.connect(user1).writeMessage('From user1');
      await contract.connect(user2).writeMessage('From user2');

      expect(await contract.getTotalMessages()).to.equal(2n);
    });

    it('stranger cannot toggle limit', async function () {
      const { contract, stranger } = await deploy();
      await expect(contract.connect(stranger).toggleLimit(true)).to.be.revertedWith(
        'Not authorized'
      );
    });

    it('hasSentMessage tracks correctly', async function () {
      const { contract, user1 } = await deploy();

      expect(await contract.hasSentMessage(user1.address)).to.be.false;
      await contract.connect(user1).writeMessage('Hello');
      expect(await contract.hasSentMessage(user1.address)).to.be.true;
    });
  });

  // ──────────────────────────────────────────
  // replyToMessage
  // ──────────────────────────────────────────
  describe('replyToMessage', function () {
    it('owner can reply to a message', async function () {
      const { contract, deployer, user1 } = await deploy();

      await contract.connect(user1).writeMessage('Please reply!');
      await contract.connect(deployer).replyToMessage(1, 'With love, Ko Ko Ye');

      const msg = await contract.getMessageByTicket(1);
      expect(msg.hasReply).to.be.true;
      expect(msg.reply).to.equal('With love, Ko Ko Ye');
    });

    it('emits ReplyAdded event', async function () {
      const { contract, deployer, user1 } = await deploy();

      await contract.connect(user1).writeMessage('Hello');
      await expect(contract.connect(deployer).replyToMessage(1, 'Thank you'))
        .to.emit(contract, 'ReplyAdded')
        .withArgs(1n, 'Thank you', await time.latest() + 1);
    });

    it('non-owner cannot reply', async function () {
      const { contract, user1, stranger } = await deploy();

      await contract.connect(user1).writeMessage('Message');
      await expect(
        contract.connect(stranger).replyToMessage(1, 'Fake reply')
      ).to.be.revertedWith('Not the owner');
    });

    it('reverts on invalid ticket number', async function () {
      const { contract, deployer, user1 } = await deploy();

      await contract.connect(user1).writeMessage('Message');
      await expect(
        contract.connect(deployer).replyToMessage(0, 'Reply')
      ).to.be.revertedWith('Invalid ticket number');
      await expect(
        contract.connect(deployer).replyToMessage(2, 'Reply')
      ).to.be.revertedWith('Invalid ticket number');
    });

    it('reverts on empty reply', async function () {
      const { contract, deployer, user1 } = await deploy();

      await contract.connect(user1).writeMessage('Message');
      await expect(
        contract.connect(deployer).replyToMessage(1, '')
      ).to.be.revertedWith('Reply cannot be empty');
    });
  });

  // ──────────────────────────────────────────
  // replyTimestamp
  // ──────────────────────────────────────────
  describe('replyTimestamp', function () {
    it('saves replyTimestamp when owner replies', async function () {
      const { contract, deployer, user1 } = await deploy();

      await contract.connect(user1).writeMessage('Letter');

      const before = await time.latest();
      await contract.connect(deployer).replyToMessage(1, 'Reply');
      const after = await time.latest();

      const msg = await contract.getMessageByTicket(1);
      expect(msg.replyTimestamp).to.be.within(BigInt(before), BigInt(after));
    });

    it('replyTimestamp is 0 before reply is added', async function () {
      const { contract, user1 } = await deploy();

      await contract.connect(user1).writeMessage('Letter');
      const msg = await contract.getMessageByTicket(1);
      expect(msg.replyTimestamp).to.equal(0n);
    });

    it('replyTimestamp is later than message timestamp', async function () {
      const { contract, deployer, user1 } = await deploy();

      await contract.connect(user1).writeMessage('Letter');
      await time.increase(60);
      await contract.connect(deployer).replyToMessage(1, 'Reply after 60s');

      const msg = await contract.getMessageByTicket(1);
      expect(msg.replyTimestamp).to.be.greaterThan(msg.timestamp);
    });
  });

  // ──────────────────────────────────────────
  // transferOwnership
  // ──────────────────────────────────────────
  describe('transferOwnership', function () {
    it('owner can transfer to a new address', async function () {
      const { contract, deployer, user1 } = await deploy();

      await contract.connect(deployer).transferOwnership(user1.address);
      expect(await contract.owner()).to.equal(user1.address);
    });

    it('emits OwnershipTransferred event', async function () {
      const { contract, deployer, user1 } = await deploy();

      await expect(contract.connect(deployer).transferOwnership(user1.address))
        .to.emit(contract, 'OwnershipTransferred')
        .withArgs(deployer.address, user1.address);
    });

    it('new owner can reply, old owner cannot', async function () {
      const { contract, deployer, user1, user2 } = await deploy();

      await contract.connect(user2).writeMessage('A letter');
      await contract.connect(deployer).transferOwnership(user1.address);

      await expect(contract.connect(deployer).replyToMessage(1, 'Old owner reply')).to.be.revertedWith(
        'Not the owner'
      );
      await expect(contract.connect(user1).replyToMessage(1, 'New owner reply')).to.not.be.reverted;
    });

    it('reverts transfer to zero address', async function () {
      const { contract, deployer } = await deploy();
      await expect(
        contract.connect(deployer).transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith('New owner cannot be zero address');
    });

    it('non-owner cannot transfer ownership', async function () {
      const { contract, stranger, user1 } = await deploy();
      await expect(
        contract.connect(stranger).transferOwnership(user1.address)
      ).to.be.revertedWith('Not the owner');
    });

    it('deployer and owner are independent — deployer retains toggle rights after ownership transfer', async function () {
      const { contract, deployer, user1 } = await deploy();

      await contract.connect(deployer).transferOwnership(user1.address);

      // deployer is no longer owner but is still deployer — can still toggle
      await expect(contract.connect(deployer).toggleLimit(true)).to.not.be.reverted;
    });
  });
});
