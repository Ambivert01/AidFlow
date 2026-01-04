const AidFlowAuditABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "jobIdHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "auditHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "string",
        name: "campaignId",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "AuditLogged",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "jobIdHash",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "auditHash",
        type: "bytes32",
      },
      {
        internalType: "string",
        name: "campaignId",
        type: "string",
      },
    ],
    name: "logAudit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "jobIdHash",
        type: "bytes32",
      },
    ],
    name: "verifyAudit",
    outputs: [
      {
        internalType: "bytes32",
        name: "auditHash",
        type: "bytes32",
      },
      {
        internalType: "string",
        name: "campaignId",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export default AidFlowAuditABI;
