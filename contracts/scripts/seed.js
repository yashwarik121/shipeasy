const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [sender, carrier, receiver] = await ethers.getSigners();

  // Read deployed contract address
  const deployedPath = path.join(__dirname, "../deployed-address.json");
  if (!fs.existsSync(deployedPath)) {
    console.error("No deployed-address.json found. Run deploy.js first.");
    process.exit(1);
  }
  const { address } = JSON.parse(fs.readFileSync(deployedPath, "utf-8"));
  const shipmentTracker = await ethers.getContractAt("ShipmentTracker", address);

  const currentCount = await shipmentTracker.shipmentCount();
  if (Number(currentCount) > 0) {
    console.log(`Contract already seeded with ${currentCount} shipments. Skipping seed.`);
    return;
  }

  console.log("Seeding data with accounts:");
  console.log("Contract:", address);
  console.log("Sender:", sender.address);
  console.log("Carrier:", carrier.address);
  console.log("Receiver:", receiver.address);

  // Shipment 0: 'Electronics Package - Mumbai to Delhi' - advance all the way to Delivered via OTP
  const otp0 = "123456";
  const otpHash0 = ethers.keccak256(ethers.toUtf8Bytes(otp0));
  let tx = await shipmentTracker.connect(sender).createShipmentWithOtp(
    carrier.address, 
    receiver.address, 
    "Electronics Package - Mumbai to Delhi", 
    otpHash0, 
    otp0, 
    { gasLimit: 500000 }
  );
  await tx.wait();
  console.log("Created Shipment 0 (OTP: " + otp0 + ")");
  tx = await shipmentTracker.connect(carrier).advanceStatus(0, 1, { gasLimit: 200000 });
  await tx.wait();
  console.log("Advanced Shipment 0 to PickedUp");
  tx = await shipmentTracker.connect(carrier).advanceStatus(0, 2, { gasLimit: 200000 });
  await tx.wait();
  console.log("Advanced Shipment 0 to InTransit");
  tx = await shipmentTracker.connect(carrier).completeDeliveryWithOtp(0, otp0, { gasLimit: 200000 });
  await tx.wait();
  console.log("Advanced Shipment 0 to Delivered via OTP Verification");

  // Shipment 1: 'Medical Supplies - Pune to Bangalore' - advance to InTransit
  const otp1 = "789012";
  const otpHash1 = ethers.keccak256(ethers.toUtf8Bytes(otp1));
  tx = await shipmentTracker.connect(sender).createShipmentWithOtp(
    carrier.address, 
    receiver.address, 
    "Medical Supplies - Pune to Bangalore", 
    otpHash1, 
    otp1, 
    { gasLimit: 500000 }
  );
  await tx.wait();
  console.log("Created Shipment 1 (OTP: " + otp1 + ")");
  tx = await shipmentTracker.connect(carrier).advanceStatus(1, 1, { gasLimit: 200000 });
  await tx.wait();
  console.log("Advanced Shipment 1 to PickedUp");
  tx = await shipmentTracker.connect(carrier).advanceStatus(1, 2, { gasLimit: 200000 });
  await tx.wait();
  console.log("Advanced Shipment 1 to InTransit (Awaiting Receiver OTP)");

  // Shipment 2: 'Document Parcel - Chennai to Hyderabad' - leave at Created
  const otp2 = "456789";
  const otpHash2 = ethers.keccak256(ethers.toUtf8Bytes(otp2));
  tx = await shipmentTracker.connect(sender).createShipmentWithOtp(
    carrier.address, 
    receiver.address, 
    "Document Parcel - Chennai to Hyderabad", 
    otpHash2, 
    otp2, 
    { gasLimit: 500000 }
  );
  await tx.wait();
  console.log("Created Shipment 2 (OTP: " + otp2 + ")");

  console.log("Seed script finished successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
