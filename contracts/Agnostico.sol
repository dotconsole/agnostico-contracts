// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Agnostico is Initializable, UUPSUpgradeable, OwnableUpgradeable {

  struct Submitted {
    uint256 id;
    string agnoHash;
    address claimedBy;
    uint256 timesUsed;
    bool verified;
    bool minted;
  }

  event ContractCreated(address newContract, string agnoHash, address by);
  event ETHWithdrawn(address requester, uint256 amount);
  event Verified(string agnoHash, uint256 verifiedAtBlock);
  event OwnershipChanged(address previousOwner, address newOwner);
  event AgnoAdminChanged(address oldAdmin, address newAdmin);

  mapping(string => Submitted) internal agnoHashes;
  mapping(address => uint256) public pctEarnings;
  mapping(string => address) public firstDeployers;
  uint256 internal totalClaimed;
  uint256 public fees;

  uint256 public pctEarning;
  uint256 public cost;
  address public agnocode;

  function initialize() initializer public {
    __Ownable_init();
    __UUPSUpgradeable_init();
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
