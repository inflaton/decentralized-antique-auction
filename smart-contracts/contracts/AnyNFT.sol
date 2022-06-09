//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.1;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import './IERC2981Royalties.sol';

abstract contract AnyNFT is IERC721, IERC2981Royalties {
    function mintNFT(address recipient, string memory tokenURI)
        public
        virtual
        returns (uint256);

    function mintNFTWithRoyalty(
        address to,
        address royaltyRecipient,
        uint256 royaltyValue,
        string memory tokenURI
    ) public virtual returns (uint256);
}

abstract contract AnyNFTMarket {
    function NFTContractDeployed(address _nftContract)
        public
        virtual
        returns (bool);

    function endAntiqueAuction(uint256 _antiqueId)
        public
        virtual
        returns (
            address,
            address,
            uint256
        );
}
