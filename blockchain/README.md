# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

cd Aid-Flow/blockchain

Install dependencies (first time only)
npm install

Start local Hardhat node
npx hardhat node

DO NOT CLOSE THIS TERMINAL
It runs at:
http://127.0.0.1:8545

(Open new terminal)

cd Aid-Flow/blockchain
npx hardhat run scripts/deploy.js --network localhost

AidFlowAudit deployed to: 0xABC123...

RPC_URL=http://127.0.0.1:8545
AUDIT_CONTRACT_ADDRESS=0xPASTE_DEPLOYED_ADDRESS_HERE
BLOCKCHAIN_PRIVATE_KEY=0x<PRIVATE_KEY_FROM_HARDHAT_NODE>
