// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Agnostico.sol";
import "./IAgnoCode.sol";

contract AgnosticoV1 is Agnostico {
  mapping(address => string) claimsWhitelist;

  function getHash(string memory agnoHash) external view returns(Submitted memory) {
    return agnoHashes[agnoHash];
  }

  function verifyHash(string memory _agnoHash) external onlyOwner {
    agnoHashes[_agnoHash].verified = true;
    emit Verified(_agnoHash, block.timestamp);
  }

  function withdrawToken(address _token, uint256 _amount, address _to) external onlyOwner {
    ERC20(_token).transfer(_to, _amount);
  }

  function withdrawEarning(uint256 tokenId, address _to) external {
    address requester = _msgSender();
    uint256 amount;
    bool isValid = IAgnoCode(agnocode).exists(tokenId);
    if(isValid) {
      address codeOwner = IAgnoCode(agnocode).ownerOf(tokenId);
      require(requester == codeOwner, "Not Yours");
      amount = pctEarnings[codeOwner];
      pctEarnings[codeOwner] = 0;
      (bool sent,) = payable(_to).call{value: amount}("");
      require(sent, "Unable To Withdraw");
    }
  }

  function withdrawFees(address to) external onlyOwner {
    (bool sent,) = payable(to).call{value: fees}("");
    require(sent, "Unable To Withdraw");
    fees = 0;
  }

  function mintCode(string memory _agnoHash) external returns(uint256 tokenId){
    Submitted storage _hash = agnoHashes[_agnoHash];
    address sender = _msgSender();
    if(_hash.claimedBy == address(0)) {
       _claimHash(_agnoHash, sender);
    }
    require(_hash.claimedBy == sender, "Not Your Choice");
    IAgnoCode(agnocode).mintTo(sender, _hash.agnoHash, _hash.id);
    _hash.minted = true;
    return _hash.id;
  }

  function _claimHash(string memory _agnoHash, address _sender) internal {
    Submitted memory _hash = agnoHashes[_agnoHash];
    require(_hash.claimedBy == address(0), "Previously Claimed");
    totalClaimed += 1;
    agnoHashes[_agnoHash].agnoHash = _agnoHash;
    agnoHashes[_agnoHash].id = totalClaimed;
    agnoHashes[_agnoHash].claimedBy = _sender;
  }

  function claimHash(string memory _agnoHash) external {
    address sender = _msgSender();
    Submitted memory _hash = agnoHashes[_agnoHash];
    require(_hash.claimedBy == address(0), string(abi.encodePacked("Previously Claimed By ", _hash.claimedBy)));
    _claimHash(_agnoHash, sender);
  }

  function _deployContract(bytes memory code, string memory _agnoHash, address _sender) internal {
    address addr;
    assembly {
      addr := create(0, add(code, 0x20), mload(code))
      if iszero(extcodesize(addr)) {
        revert(0, 0)
      }
    }
    emit ContractCreated(addr, _agnoHash, _sender);
  }

  function deployContract(bytes memory _code, string memory _agnoHash) external payable {
    require(msg.value == cost , "Send Correct Amount");
    address _sender = _msgSender();
    Submitted storage submitted = agnoHashes[_agnoHash];

    if(submitted.id == 0) {
      // Unclaimed gives everything to platform fees
      fees += cost;
    } else {
      uint256 toReceive;
      bool isMinted = IAgnoCode(agnocode).exists(submitted.id);
      if(isMinted) {
        toReceive = (cost * pctEarning) / 1 ether;
        address codeOwner = IAgnoCode(agnocode).ownerOf(submitted.id);
        pctEarnings[codeOwner] += toReceive;
        fees += cost - toReceive;
      } else {
        // You are encouraged to mint CODE or you earn 1/3rd of what you are supposed to earn
        toReceive = (cost * pctEarning) / 1 ether / 3;
        pctEarnings[submitted.claimedBy] += toReceive;
        fees += cost - toReceive;
      }
    }
    _deployContract(_code, _agnoHash, _sender);
    if(firstDeployers[_agnoHash] == address(0)) {
      firstDeployers[_agnoHash] = _sender;
    }
    submitted.timesUsed += 1;
    submitted.agnoHash = _agnoHash;
  }

  function setCost(uint256 _cost) external onlyOwner {
    cost = _cost;
  }

  function setPctEarning(uint256 _pctEarning) external onlyOwner {
    pctEarning = _pctEarning;
  }

  function setAgnocode(address _agnocode) external onlyOwner {
    agnocode = _agnocode;
  }

  function version() public pure returns(string memory) {
    return 'v1';
  }
}