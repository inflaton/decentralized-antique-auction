//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import './AnyNFT.sol';
import './ERC2981PerTokenRoyalties.sol';

contract AntiqueNFT is
    AnyNFT,
    ERC721URIStorage,
    Ownable,
    ERC2981PerTokenRoyalties
{
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address public marketContract;

    constructor(address _marketContract) ERC721('My Antiques', 'ANTIQUE-NFT') {
        marketContract = _marketContract;
        AnyNFTMarket market = AnyNFTMarket(marketContract);
        market.NFTContractDeployed(address(this));
    }

    /// @inheritdoc     ERC165
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(IERC165, ERC721, ERC2981Base)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
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

    /// @notice Mint one token to `to`
    /// @param to the recipient of the token
    /// @param royaltyRecipient the recipient for royalties (if royaltyValue > 0)
    /// @param royaltyValue the royalties asked for (EIP2981)
    function mintNFTWithRoyalty(
        address to,
        address royaltyRecipient,
        uint256 royaltyValue,
        string memory tokenURI
    ) public override returns (uint256) {
        uint256 tokenId = mintNFT(to, tokenURI);

        if (royaltyValue > 0) {
            _setTokenRoyalty(tokenId, royaltyRecipient, royaltyValue);
        }
        return tokenId;
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
