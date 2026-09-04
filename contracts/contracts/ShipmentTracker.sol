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
        bytes32 accessKey;
        uint256 createdAt;
        uint256 lastUpdated;
    }

    struct StatusEntry {
        Status status;
        address updater;
        uint256 timestamp;
    }

    struct Document {
        bytes32 fileHash;     // SHA-256 hash of the file
        string  fileName;     // Original filename  
        address uploader;     // Who attached it
        uint256 timestamp;    // When it was attached
    }

    mapping(uint256 => Shipment) public shipments;
    mapping(uint256 => StatusEntry[]) private shipmentHistory;
    mapping(uint256 => Document[]) private shipmentDocuments;
    uint256 public shipmentCount;

    event ShipmentCreated(uint256 indexed id, address indexed sender, address carrier, address receiver, string description, bytes32 accessKey, uint256 timestamp);
    event StatusUpdated(uint256 indexed id, Status status, address indexed updater, uint256 timestamp);
    event DocumentAdded(uint256 indexed id, bytes32 fileHash, string fileName, address indexed uploader, uint256 timestamp);

    function createShipment(address _carrier, address _receiver, string calldata _description) external returns (uint256) {
        uint256 id = shipmentCount;
        
        bytes32 accessKey = keccak256(abi.encodePacked(id, msg.sender, _receiver, block.timestamp, block.prevrandao));

        shipments[id] = Shipment({
            id: id,
            sender: msg.sender,
            carrier: _carrier,
            receiver: _receiver,
            description: _description,
            status: Status.Created,
            accessKey: accessKey,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp
        });

        shipmentHistory[id].push(StatusEntry({
            status: Status.Created,
            updater: msg.sender,
            timestamp: block.timestamp
        }));

        shipmentCount++;

        emit ShipmentCreated(id, msg.sender, _carrier, _receiver, _description, accessKey, block.timestamp);
        
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

    function addDocument(uint256 _id, bytes32 _fileHash, string calldata _fileName) external {
        require(_id < shipmentCount, "Shipment does not exist");
        Shipment storage shipment = shipments[_id];
        require(msg.sender == shipment.sender || msg.sender == shipment.receiver, "Only sender or receiver can attach documents");
        
        shipmentDocuments[_id].push(Document({
            fileHash: _fileHash,
            fileName: _fileName,
            uploader: msg.sender,
            timestamp: block.timestamp
        }));
        
        emit DocumentAdded(_id, _fileHash, _fileName, msg.sender, block.timestamp);
    }

    function getDocuments(uint256 _id) external view returns (Document[] memory) {
        require(_id < shipmentCount, "Shipment does not exist");
        return shipmentDocuments[_id];
    }

    function getAccessKey(uint256 _id) external view returns (bytes32) {
        require(_id < shipmentCount, "Shipment does not exist");
        Shipment storage shipment = shipments[_id];
        require(msg.sender == shipment.sender || msg.sender == shipment.receiver, "Only sender or receiver can view access key");
        return shipment.accessKey;
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
