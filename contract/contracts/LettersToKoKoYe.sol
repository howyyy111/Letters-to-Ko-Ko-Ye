// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LettersToKoKoYe {
    struct Message {
        uint256 ticketNumber;
        address sender;
        string text;
        uint256 timestamp;
        string reply;
        bool hasReply;
        uint256 replyTimestamp;
    }

    address public owner;
    address public deployer;
    bool public limitOnePerWallet;

    uint256 private _ticketCounter;
    Message[] private _messages;

    mapping(address => bool) private _hasSentMessage;
    mapping(address => uint256) private _walletFirstTicket; // 👈 added

    event MessageWritten(
        uint256 indexed ticketNumber,
        address indexed sender,
        string text,
        uint256 timestamp
    );

    event ReplyAdded(
        uint256 indexed ticketNumber,
        string reply,
        uint256 timestamp
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    event LimitToggled(bool limitOnePerWallet);

    modifier onlyOwnerOrDeployer() {
        require(
            msg.sender == owner || msg.sender == deployer,
            "Not authorized"
        );
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        deployer = msg.sender;
        owner = msg.sender;
        limitOnePerWallet = false;
        _ticketCounter = 0;
    }

    function writeMessage(string calldata text) external {
        require(bytes(text).length > 0, "Message cannot be empty");
        require(bytes(text).length <= 280, "Message too long");

        if (limitOnePerWallet) {
            require(!_hasSentMessage[msg.sender], "Already sent a message");
        }

        _ticketCounter++;
        uint256 ticketNum = _ticketCounter;

        _messages.push(
            Message({
                ticketNumber: ticketNum,
                sender: msg.sender,
                text: text,
                timestamp: block.timestamp,
                reply: "",
                hasReply: false,
                replyTimestamp: 0
            })
        );

        _hasSentMessage[msg.sender] = true;

        // 👈 added: only record first ticket per unique wallet
        if (_walletFirstTicket[msg.sender] == 0) {
            _walletFirstTicket[msg.sender] = ticketNum;
        }

        emit MessageWritten(ticketNum, msg.sender, text, block.timestamp);
    }

    function replyToMessage(
        uint256 ticketNumber,
        string calldata replyText
    ) external onlyOwner {
        require(
            ticketNumber >= 1 && ticketNumber <= _ticketCounter,
            "Invalid ticket number"
        );
        require(bytes(replyText).length > 0, "Reply cannot be empty");

        uint256 index = ticketNumber - 1;
        _messages[index].reply = replyText;
        _messages[index].hasReply = true;
        _messages[index].replyTimestamp = block.timestamp;

        emit ReplyAdded(ticketNumber, replyText, block.timestamp);
    }

    function toggleLimit(bool _limit) external onlyOwnerOrDeployer {
        limitOnePerWallet = _limit;
        emit LimitToggled(_limit);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    function getAllMessages() external view returns (Message[] memory) {
        return _messages;
    }

    function getMessageByTicket(
        uint256 ticketNumber
    ) external view returns (Message memory) {
        require(
            ticketNumber >= 1 && ticketNumber <= _ticketCounter,
            "Invalid ticket number"
        );
        return _messages[ticketNumber - 1];
    }

    function getTotalMessages() external view returns (uint256) {
        return _ticketCounter;
    }

    function hasSentMessage(address wallet) external view returns (bool) {
        return _hasSentMessage[wallet];
    }

    // 👈 added: NFT contract reads this later to check eligibility
    function getWalletFirstTicket(
        address wallet
    ) external view returns (uint256) {
        return _walletFirstTicket[wallet];
    }
}
