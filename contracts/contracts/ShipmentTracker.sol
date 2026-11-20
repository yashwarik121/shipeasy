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
        bytes32 otpHash;
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
    mapping(uint256 => string) private shipmentOtps;
    uint256 public shipmentCount;

    event ShipmentCreated(uint256 indexed id, address indexed sender, address carrier, address receiver, string description, bytes32 accessKey, bytes32 otpHash, uint256 timestamp);
    event StatusUpdated(uint256 indexed id, Status status, address indexed updater, uint256 timestamp);
    event DocumentAdded(uint256 indexed id, bytes32 fileHash, string fileName, address indexed uploader, uint256 timestamp);

    function createShipment(address _carrier, address _receiver, string calldata _description) external returns (uint256) {
        return createShipmentWithOtp(_carrier, _receiver, _description, bytes32(0), "");
    }

    function createShipmentWithOtp(
        address _carrier, 
        address _receiver, 
        string memory _description, 
        bytes32 _otpHash, 
        string memory _otp
    ) public returns (uint256) {
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
            otpHash: _otpHash,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp
        });

        if (bytes(_otp).length > 0) {
            shipmentOtps[id] = _otp;
        }

        shipmentHistory[id].push(StatusEntry({
            status: Status.Created,
            updater: msg.sender,
            timestamp: block.timestamp
        }));

        shipmentCount++;

        emit ShipmentCreated(id, msg.sender, _carrier, _receiver, _description, accessKey, _otpHash, block.timestamp);
        
        return id;
    }

    function advanceStatus(uint256 _id, Status _nextStatus) external {
        require(_id < shipmentCount, "Shipment does not exist");
        
        Shipment storage shipment = shipments[_id];
        
        require(uint8(_nextStatus) == uint8(shipment.status) + 1, "Invalid status transition");

        if (_nextStatus == Status.PickedUp || _nextStatus == Status.InTransit) {
            require(msg.sender == shipment.carrier, "Only carrier can perform this action");
        } else if (_nextStatus == Status.Delivered) {
            if (shipment.otpHash != bytes32(0)) {
                revert("Delivery requires OTP verification via completeDeliveryWithOtp");
            }
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

    function completeDeliveryWithOtp(uint256 _id, string calldata _otp) external {
        require(_id < shipmentCount, "Shipment does not exist");
        Shipment storage shipment = shipments[_id];
        require(msg.sender == shipment.carrier, "Only carrier can complete delivery");
        require(shipment.status == Status.InTransit, "Shipment must be InTransit");
        
        if (shipment.otpHash != bytes32(0)) {
            require(keccak256(abi.encodePacked(_otp)) == shipment.otpHash, "Invalid delivery OTP");
        }
        
        shipment.status = Status.Delivered;
        shipment.lastUpdated = block.timestamp;

        shipmentHistory[_id].push(StatusEntry({
            status: Status.Delivered,
            updater: msg.sender,
            timestamp: block.timestamp
        }));

        emit StatusUpdated(_id, Status.Delivered, msg.sender, block.timestamp);
    }

    function getDeliveryOtp(uint256 _id) external view returns (string memory) {
        require(_id < shipmentCount, "Shipment does not exist");
        Shipment storage shipment = shipments[_id];
        require(msg.sender == shipment.receiver || msg.sender == shipment.sender, "Only receiver or sender can view OTP");
        return shipmentOtps[_id];
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
