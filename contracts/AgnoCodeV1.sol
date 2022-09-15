// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AgnoCodeFactory.sol";

contract AgnoCodeV1 is AgnoCodeFactory {

  address public agnostico;
  string ipfsDomain;

  function setAgnostico(address _agnostico) external onlyOwner {
    agnostico = _agnostico;
  }

  function mintTo(address to, string memory _tokenURI, uint256 _tokenId) external onlyAgnostico returns(uint256) {
    require(agnostico != address(0), "Not Activated Yet");
    _safeMint(to, _tokenId);
    _setTokenURI(_tokenId, string(abi.encodePacked(ipfsDomain,_tokenURI,"/")));
    return _tokenId;
  }

  function exists(uint256 tokenId) view external returns(bool) {
    return _exists(tokenId);
  }

  function setIPFSDomain(string memory _ipfsDomain) external onlyOwner {
    ipfsDomain = _ipfsDomain;
  }

  modifier onlyAgnostico {
    require(_msgSender() == agnostico, "Not Agnostico");
    _;
  }
}
