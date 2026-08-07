const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const ShipmentTracker = await ethers.getContractFactory("ShipmentTracker");
  const shipmentTracker = await ShipmentTracker.deploy();
  await shipmentTracker.waitForDeployment();
  const address = await shipmentTracker.getAddress();
  
  console.log("ShipmentTracker deployed to:", address);

  const data = { address };
  const filePath = path.join(__dirname, "..", "deployed-address.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
