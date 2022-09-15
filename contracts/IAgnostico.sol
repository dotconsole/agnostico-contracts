// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct Submitted {
  uint256 id;
  string agnoHash;
  address claimedBy;
  uint256 timesUsed;
  bool verified;
  bool minted;
}

interface IAgnostico {
  event ContractCreated(address newContract, string agnoHash, address by);
  event ETHWithdrawn(address requester, uint256 amount);
  event Verified(string agnoHash, uint256 verifiedAtBlock);
  event OwnershipChanged(address previousOwner, address newOwner);
  event AgnoAdminChanged(address oldAdmin, address newAdmin);

  function pctEarnings(address _user) external view returns(uint256);
  function firstDeployers(string memory _hash) external view returns(address);
  function getHash(string memory agnoHash) view external returns(Submitted memory);
  function verifyHash(string memory _agnoHash) external;
  function withdrawToken(address _token, uint256 _amount, address _to) external;
  function withdrawEarning(uint256 tokenId, address _to) external;
  function withdrawFees(address to) external;
  function mintCode(string memory _agnoHash) external returns(uint256);
  function claimHash(string memory agnoHash) external;
  function deployContract(bytes memory _code, string memory _agnoHash) payable external;
  function setCost(uint256 _cost) external;
  function setPctEarning(uint256 _pctEarning) external;
  function setAgnocode(address _agnocode) external;
  function version() external view returns(string memory);
  function cost() external view returns(uint256);
  function agnocode() external view returns(address);
  function pctEarning() external view returns(uint256);
  function fees() external view returns(uint256);
}