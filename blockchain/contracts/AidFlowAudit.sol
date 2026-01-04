// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AidFlowAudit {

    address public owner;

    struct AuditRecord {
        bytes32 auditHash;
        string campaignId;
        uint256 timestamp;
    }

    mapping(bytes32 => AuditRecord) private records;

    event AuditLogged(
        bytes32 indexed jobIdHash,
        bytes32 auditHash,
        string campaignId,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function logAudit(
        bytes32 jobIdHash,
        bytes32 auditHash,
        string calldata campaignId
    ) external onlyOwner {
        require(records[jobIdHash].timestamp == 0, "Audit already exists");

        records[jobIdHash] = AuditRecord({
            auditHash: auditHash,
            campaignId: campaignId,
            timestamp: block.timestamp
        });

        emit AuditLogged(jobIdHash, auditHash, campaignId, block.timestamp);
    }

    function verifyAudit(bytes32 jobIdHash)
        external
        view
        returns (bytes32 auditHash, string memory campaignId, uint256 timestamp)
    {
        AuditRecord memory record = records[jobIdHash];
        require(record.timestamp != 0, "Audit not found");
        return (record.auditHash, record.campaignId, record.timestamp);
    }
}
