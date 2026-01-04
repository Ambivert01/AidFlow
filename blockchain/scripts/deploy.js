const hre = require("hardhat");

async function main() {
  console.log("Deploying AidFlowAudit contract...");

  const AidFlowAudit = await hre.ethers.getContractFactory("AidFlowAudit");
  const auditContract = await AidFlowAudit.deploy();

  await auditContract.waitForDeployment();

  const address = await auditContract.getAddress();
  console.log("AidFlowAudit deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
