//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.1;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

abstract contract AnyNFT is IERC721 {
    function mintNFT(address recipient, string memory tokenURI)
        public
        virtual
        returns (uint256);
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
