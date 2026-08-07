const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ShipmentTracker", function () {
  let ShipmentTracker, shipmentTracker;
  let sender, carrier, receiver, other;

  beforeEach(async function () {
    [sender, carrier, receiver, other] = await ethers.getSigners();
    ShipmentTracker = await ethers.getContractFactory("ShipmentTracker");
    shipmentTracker = await ShipmentTracker.deploy();
  });

  it("should create a shipment with correct initial state", async function () {
    await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test Shipment");
    const shipment = await shipmentTracker.getShipment(0);
    expect(shipment.id).to.equal(0);
    expect(shipment.sender).to.equal(sender.address);
    expect(shipment.carrier).to.equal(carrier.address);
    expect(shipment.receiver).to.equal(receiver.address);
    expect(shipment.description).to.equal("Test Shipment");
    expect(shipment.status).to.equal(0); // Created
    expect(shipment.createdAt).to.be.above(0);
    expect(shipment.lastUpdated).to.equal(shipment.createdAt);
  });

  it("should emit ShipmentCreated event with correct data", async function () {
    await expect(shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test Shipment"))
      .to.emit(shipmentTracker, "ShipmentCreated")
      .withArgs(0, sender.address, carrier.address, receiver.address, "Test Shipment", (val) => val > 0);
  });

  it("should increment shipment count", async function () {
    expect(await shipmentTracker.getShipmentCount()).to.equal(0);
    await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test 1");
    expect(await shipmentTracker.getShipmentCount()).to.equal(1);
    await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test 2");
    expect(await shipmentTracker.getShipmentCount()).to.equal(2);
  });

  it("should store initial status entry in history", async function () {
    await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test");
    const history = await shipmentTracker.getHistory(0);
    expect(history.length).to.equal(1);
    expect(history[0].status).to.equal(0);
    expect(history[0].updater).to.equal(sender.address);
  });

  it("should allow carrier to advance to PickedUp", async function () {
    await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test");
    await shipmentTracker.connect(carrier).advanceStatus(0, 1);
    const shipment = await shipmentTracker.getShipment(0);
    expect(shipment.status).to.equal(1);
  });

  it("should allow carrier to advance to InTransit", async function () {
    await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test");
    await shipmentTracker.connect(carrier).advanceStatus(0, 1);
    await shipmentTracker.connect(carrier).advanceStatus(0, 2);
    const shipment = await shipmentTracker.getShipment(0);
    expect(shipment.status).to.equal(2);
  });

  it("should allow receiver to advance to Delivered", async function () {
    await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test");
    await shipmentTracker.connect(carrier).advanceStatus(0, 1);
    await shipmentTracker.connect(carrier).advanceStatus(0, 2);
    await shipmentTracker.connect(receiver).advanceStatus(0, 3);
    const shipment = await shipmentTracker.getShipment(0);
    expect(shipment.status).to.equal(3);
  });

  it("should emit StatusUpdated event on advance", async function () {
    await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test");
    await expect(shipmentTracker.connect(carrier).advanceStatus(0, 1))
      .to.emit(shipmentTracker, "StatusUpdated")
      .withArgs(0, 1, carrier.address, (val) => val > 0);
  });

  it("should revert if non-carrier tries to advance to PickedUp", async function () {
    await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test");
    await expect(shipmentTracker.connect(other).advanceStatus(0, 1)).to.be.revertedWith("Only carrier can perform this action");
  });

  it("should revert if non-carrier tries to advance to InTransit", async function () {
    await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test");
    await shipmentTracker.connect(carrier).advanceStatus(0, 1);
    await expect(shipmentTracker.connect(other).advanceStatus(0, 2)).to.be.revertedWith("Only carrier can perform this action");
  });

  it("should revert if non-receiver tries to advance to Delivered", async function () {
    await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test");
    await shipmentTracker.connect(carrier).advanceStatus(0, 1);
    await shipmentTracker.connect(carrier).advanceStatus(0, 2);
    await expect(shipmentTracker.connect(other).advanceStatus(0, 3)).to.be.revertedWith("Only receiver can confirm delivery");
  });

  it("should revert if trying to skip a stage", async function () {
    await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test");
    await expect(shipmentTracker.connect(carrier).advanceStatus(0, 2)).to.be.revertedWith("Invalid status transition");
  });

  it("should revert if trying to go backwards", async function () {
    await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test");
    await shipmentTracker.connect(carrier).advanceStatus(0, 1);
    await expect(shipmentTracker.connect(carrier).advanceStatus(0, 0)).to.be.revertedWith("Invalid status transition");
  });

  it("should revert if trying to advance past Delivered", async function () {
    await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test");
    await shipmentTracker.connect(carrier).advanceStatus(0, 1);
    await shipmentTracker.connect(carrier).advanceStatus(0, 2);
    await shipmentTracker.connect(receiver).advanceStatus(0, 3);
    await expect(shipmentTracker.connect(receiver).advanceStatus(0, 4)).to.be.reverted;
  });

  it("should revert for invalid shipment ID", async function () {
    await expect(shipmentTracker.connect(carrier).advanceStatus(999, 1)).to.be.revertedWith("Shipment does not exist");
  });

  it("should return full ordered history after all transitions", async function () {
    await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test");
    await shipmentTracker.connect(carrier).advanceStatus(0, 1);
    await shipmentTracker.connect(carrier).advanceStatus(0, 2);
    await shipmentTracker.connect(receiver).advanceStatus(0, 3);
    const history = await shipmentTracker.getHistory(0);
    expect(history.length).to.equal(4);
    expect(history[0].status).to.equal(0);
    expect(history[1].status).to.equal(1);
    expect(history[2].status).to.equal(2);
    expect(history[3].status).to.equal(3);
  });

  it("should keep multiple shipments independent", async function () {
    await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test 1");
    await shipmentTracker.connect(sender).createShipment(carrier.address, receiver.address, "Test 2");
    await shipmentTracker.connect(carrier).advanceStatus(0, 1);
    const s1 = await shipmentTracker.getShipment(0);
    const s2 = await shipmentTracker.getShipment(1);
    expect(s1.status).to.equal(1);
    expect(s2.status).to.equal(0);
  });
});
