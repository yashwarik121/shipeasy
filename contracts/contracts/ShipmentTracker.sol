// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ShipmentTracker {
    enum Status { Created, PickedUp, InTransit, Delivered }

    struct Shipment {
        uint256 id;
        address sender;
        address carrier;
        address receiver;
        string description;
        Status status;
        uint256 createdAt;
        uint256 lastUpdated;
    }

    struct StatusEntry {
        Status status;
        address updater;
        uint256 timestamp;
    }

    mapping(uint256 => Shipment) public shipments;
    mapping(uint256 => StatusEntry[]) private shipmentHistory;
    uint256 public shipmentCount;

    event ShipmentCreated(uint256 indexed id, address indexed sender, address carrier, address receiver, string description, uint256 timestamp);
    event StatusUpdated(uint256 indexed id, Status status, address indexed updater, uint256 timestamp);

    function createShipment(address _carrier, address _receiver, string calldata _description) external returns (uint256) {
        uint256 id = shipmentCount;
        
        shipments[id] = Shipment({
            id: id,
            sender: msg.sender,
            carrier: _carrier,
            receiver: _receiver,
            description: _description,
            status: Status.Created,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp
        });

        shipmentHistory[id].push(StatusEntry({
            status: Status.Created,
            updater: msg.sender,
            timestamp: block.timestamp
        }));

        shipmentCount++;

        emit ShipmentCreated(id, msg.sender, _carrier, _receiver, _description, block.timestamp);
        
        return id;
    }

    function advanceStatus(uint256 _id, Status _nextStatus) external {
        require(_id < shipmentCount, "Shipment does not exist");
        
        Shipment storage shipment = shipments[_id];
        
        require(uint8(_nextStatus) == uint8(shipment.status) + 1, "Invalid status transition");

        if (_nextStatus == Status.PickedUp || _nextStatus == Status.InTransit) {
            require(msg.sender == shipment.carrier, "Only carrier can perform this action");
        } else if (_nextStatus == Status.Delivered) {
            require(msg.sender == shipment.receiver, "Only receiver can confirm delivery");
        }

        shipment.status = _nextStatus;
        shipment.lastUpdated = block.timestamp;

        shipmentHistory[_id].push(StatusEntry({
            status: _nextStatus,
            updater: msg.sender,
            timestamp: block.timestamp
        }));

        emit StatusUpdated(_id, _nextStatus, msg.sender, block.timestamp);
    }

    function getShipment(uint256 _id) external view returns (Shipment memory) {
        require(_id < shipmentCount, "Shipment does not exist");
        return shipments[_id];
    }

    function getHistory(uint256 _id) external view returns (StatusEntry[] memory) {
        require(_id < shipmentCount, "Shipment does not exist");
        return shipmentHistory[_id];
    }

    function getShipmentCount() external view returns (uint256) {
        return shipmentCount;
    }
}
