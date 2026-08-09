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

  console.log("Seeding data with accounts:");
  console.log("Contract:", address);
  console.log("Sender:", sender.address);
  console.log("Carrier:", carrier.address);
  console.log("Receiver:", receiver.address);

  // Shipment 0: 'Electronics Package - Mumbai to Delhi' - advance all the way to Delivered
  let tx = await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Electronics Package - Mumbai to Delhi");
  await tx.wait();
  console.log("Created Shipment 0");
  tx = await shipmentTracker.connect(carrier).advanceStatus(0, 1);
  await tx.wait();
  console.log("Advanced Shipment 0 to PickedUp");
  tx = await shipmentTracker.connect(carrier).advanceStatus(0, 2);
  await tx.wait();
  console.log("Advanced Shipment 0 to InTransit");
  tx = await shipmentTracker.connect(receiver).advanceStatus(0, 3);
  await tx.wait();
  console.log("Advanced Shipment 0 to Delivered");

  // Shipment 1: 'Medical Supplies - Pune to Bangalore' - advance to InTransit
  tx = await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Medical Supplies - Pune to Bangalore");
  await tx.wait();
  console.log("Created Shipment 1");
  tx = await shipmentTracker.connect(carrier).advanceStatus(1, 1);
  await tx.wait();
  console.log("Advanced Shipment 1 to PickedUp");
  tx = await shipmentTracker.connect(carrier).advanceStatus(1, 2);
  await tx.wait();
  console.log("Advanced Shipment 1 to InTransit");

  // Shipment 2: 'Document Parcel - Chennai to Hyderabad' - leave at Created
  tx = await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Document Parcel - Chennai to Hyderabad");
  await tx.wait();
  console.log("Created Shipment 2");

  console.log("Seed script finished successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
