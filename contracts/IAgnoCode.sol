// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

interface IAgnoCode is IERC721Upgradeable{
  function agnostico() external view returns(address);
  function mintTo(address to, string memory _tokenURI, uint256 tokenId) external returns(uint256);
  function exists(uint256 tokenId) view external returns(bool);
  function setAgnostico(address _agnostico) external;
  function tokenURI(uint256 _tokenId) external view returns(string memory);
  function setIPFSDomain(string memory _ipfsDomain) external;
}

