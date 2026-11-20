const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const filePath = path.join(__dirname, "..", "deployed-address.json");
  if (fs.existsSync(filePath) && !process.env.FORCE_DEPLOY) {
    try {
      const { address } = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const code = await ethers.provider.getCode(address);
      if (code && code !== "0x") {
        console.log("ShipmentTracker is already deployed at:", address);
        return;
      }
    } catch (e) {
      // Proceed to deploy if check fails
    }
  }

  const ShipmentTracker = await ethers.getContractFactory("ShipmentTracker");
  const shipmentTracker = await ShipmentTracker.deploy();
  await shipmentTracker.waitForDeployment();
  const address = await shipmentTracker.getAddress();
  
  console.log("ShipmentTracker deployed to:", address);

  const data = { address };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
