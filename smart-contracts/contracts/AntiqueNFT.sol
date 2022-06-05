//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import './AnyNFT.sol';

contract AntiqueNFT is AnyNFT, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address public marketContract;

    constructor(address _marketContract) ERC721('My Antiques', 'ANTIQUE-NFT') {
        marketContract = _marketContract;
        AnyNFTMarket market = AnyNFTMarket(marketContract);
        market.NFTContractDeployed(address(this));
    }

    function mintNFT(address recipient, string memory tokenURI)
        public
        override
        returns (uint256)
    {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    function endAuction(uint256 antiqueId) public returns (bool success) {
        address from;
        address to;
        uint256 tokenId;
        AnyNFTMarket market = AnyNFTMarket(marketContract);
        (from, to, tokenId) = market.endAntiqueAuction(antiqueId);
        transferFrom(msg.sender, to, tokenId);
        return true;
    }
}
