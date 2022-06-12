//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.1;

import './AnyNFT.sol';

contract AntiqueStore is AnyNFTMarket {
    struct Antique {
        uint256 id;
        uint256 tokenId;
        uint256 startingPrice;
        uint256 reservePrice; // A reserve price is a hidden minimum price—essentially, the lowest price you're willing to accept for your item. If the listing ends without any bids that meet the reserve price, you aren't required to sell the item.
        uint256 highestBid;
        address highestBidder;
        address owner; // owner of the antique
        uint256 auctionEndTime;
        bool forSale; // false if not being listed for sale
        string tokenURI;
        bool auctionEnded;
    }

    address public nftContract;
    address public contractOwner;
    uint256 public antiqueId;

    mapping(uint256 => Antique) public antiques;

    mapping(uint256 => mapping(address => uint256))
        public antiquePendingReturns;

    constructor() {
        contractOwner = msg.sender;
    }

    function NFTContractDeployed(address _nftContract)
        public
        override
        returns (bool)
    {
        nftContract = _nftContract;
        return true;
    }

    /**
     * @dev Check if the current caller is the contract owner.
     */
    function isOwner() internal view returns (bool) {
        return contractOwner == msg.sender;
    }

    function getAntiques(bool forSaleOnly)
        public
        view
        returns (Antique[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < antiqueId; i++) {
            Antique memory antique = antiques[i];
            if (!forSaleOnly || antique.forSale) {
                count++;
            }
        }

        Antique[] memory result = new Antique[](count);
        count = 0;
        for (uint256 i = 0; i < antiqueId; i++) {
            Antique memory antique = antiques[i];
            if (!forSaleOnly || antique.forSale) {
                result[count++] = antique;
            }
        }
        return result;
    }

    /**
     * @dev Add and list an Antique.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {NewAntique} event.
     */
    function sellAntique(
        string memory tokenURI,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 royaltyValue,
        uint256 auctionEndTime
    ) public returns (bool success) {
        AnyNFT anyNFT = AnyNFT(nftContract);
        uint256 tokenId = anyNFT.mintNFTWithRoyalty(
            msg.sender,
            contractOwner,
            royaltyValue,
            tokenURI
        );

        return
            _newAntique(
                tokenId,
                tokenURI,
                startingPrice,
                reservePrice,
                auctionEndTime
            );
    }

    function _newAntique(
        uint256 tokenId,
        string memory tokenURI,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 auctionEndTime
    ) internal returns (bool success) {
        Antique memory antique = Antique(
            antiqueId,
            tokenId,
            startingPrice,
            reservePrice,
            0,
            address(0),
            msg.sender,
            auctionEndTime,
            true,
            tokenURI,
            false
        );

        antiques[antiqueId] = antique;

        emit NewAntique(antiqueId++, nftContract, tokenId);

        return true;
    }

    function equals(string memory a, string memory b)
        internal
        pure
        returns (bool)
    {
        if (bytes(a).length != bytes(b).length) {
            return false;
        } else {
            return
                keccak256(abi.encodePacked(a)) ==
                keccak256(abi.encodePacked(b));
        }
    }

    function _bidAntique(uint256 _antiqueId, uint256 newBid)
        internal
        returns (bool)
    {
        Antique storage antique = antiques[_antiqueId];

        require(antique.forSale == true, 'The antique is not for sale');

        require(
            !antique.auctionEnded && block.timestamp <= antique.auctionEndTime,
            'The auction has already ended - no bids allowed'
        );

        require(
            newBid >= antique.startingPrice && newBid > antique.highestBid,
            'sorry, the bid is not high enough!'
        );

        mapping(address => uint256)
            storage pendingReturns = antiquePendingReturns[_antiqueId];

        if (pendingReturns[msg.sender] > 0) {
            uint256 amount = pendingReturns[msg.sender];
            payable(msg.sender).transfer(amount);
        }

        pendingReturns[msg.sender] = newBid;

        antique.highestBidder = msg.sender;
        antique.highestBid = newBid;

        emit NewBid(_antiqueId, antique.highestBidder, antique.highestBid);

        return true;
    }

    /**
     * @dev Bid a antique has `_antiqueId`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a `NewBid` event.
     */
    function bidAntique(uint256 _antiqueId) public payable returns (bool) {
        return _bidAntique(_antiqueId, msg.value);
    }

    function getMyBids() public view returns (Antique[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < antiqueId; i++) {
            Antique memory antique = antiques[i];
            mapping(address => uint256)
                storage pendingReturns = antiquePendingReturns[antique.id];

            if (
                antique.highestBidder == msg.sender ||
                pendingReturns[msg.sender] > 0
            ) {
                count++;
            }
        }

        Antique[] memory result = new Antique[](count);
        count = 0;
        for (uint256 i = 0; i < antiqueId; i++) {
            Antique memory antique = antiques[i];
            mapping(address => uint256)
                storage pendingReturns = antiquePendingReturns[antique.id];

            if (
                antique.highestBidder == msg.sender ||
                pendingReturns[msg.sender] > 0
            ) {
                antique.reservePrice = antique.highestBidder == msg.sender
                    ? antique.highestBid
                    : pendingReturns[msg.sender];
                result[count++] = antique;
            }
        }
        return result;
    }

    function endAuction(uint256 _antiqueId)
        public
        returns (address royaltyReceiver, uint256 royaltyAmount)
    {
        return _endAuction(_antiqueId, true);
    }

    function _endAuction(uint256 _antiqueId, bool toTransferNFT)
        internal
        returns (address royaltyReceiver, uint256 royaltyAmount)
    {
        Antique storage antique = antiques[_antiqueId];
        require(
            msg.sender == nftContract ||
                msg.sender == antique.owner ||
                isOwner(),
            'You are not authorised to end auction for this antique'
        );

        require(antique.forSale == true, 'The antique is not for sale');

        require(!antique.auctionEnded, 'The auction has already ended');

        require(antique.highestBid >= antique.reservePrice, 'Reserve not met');

        antique.forSale = false;
        antique.auctionEnded = true;

        mapping(address => uint256)
            storage pendingReturns = antiquePendingReturns[_antiqueId];

        AnyNFT anyNFT = AnyNFT(nftContract);
        if (toTransferNFT) {
            anyNFT.transferFrom(
                msg.sender,
                antique.highestBidder,
                antique.tokenId
            );
        }

        (royaltyReceiver, royaltyAmount) = anyNFT.royaltyInfo(
            antique.tokenId,
            antique.highestBid
        );

        if (royaltyAmount != 0 && royaltyReceiver != antique.owner) {
            payable(royaltyReceiver).transfer(royaltyAmount);
            payable(antique.owner).transfer(antique.highestBid - royaltyAmount);
        } else {
            payable(antique.owner).transfer(antique.highestBid);
        }

        pendingReturns[antique.highestBidder] = 0;
        antique.owner = antique.highestBidder;

        emit AuctionEnded(
            _antiqueId,
            antique.highestBidder,
            antique.highestBid,
            royaltyReceiver,
            royaltyAmount
        );

        return (royaltyReceiver, royaltyAmount);
    }

    function endAntiqueAuction(uint256 _antiqueId)
        public
        override
        returns (
            address,
            address,
            uint256,
            address,
            uint256
        )
    {
        Antique memory antique = antiques[_antiqueId];
        address royaltyReceiver;
        uint256 royaltyAmount;
        (royaltyReceiver, royaltyAmount) = _endAuction(_antiqueId, false);

        address from = antique.owner;
        return (
            from,
            antique.highestBidder,
            antique.tokenId,
            royaltyReceiver,
            royaltyAmount
        );
    }

    function withdraw(uint256 _antiqueId) public payable returns (bool) {
        Antique storage antique = antiques[_antiqueId];

        require(
            antique.auctionEnded,
            'You cannot withdraw until the auction has ended'
        );

        mapping(address => uint256)
            storage pendingReturns = antiquePendingReturns[_antiqueId];

        uint256 amount = pendingReturns[msg.sender];
        if (amount > 0) {
            pendingReturns[msg.sender] = 0;
            payable(msg.sender).transfer(amount);
        }

        emit NewWithdrawal(_antiqueId, msg.sender, amount);

        return true;
    }

    function resellAntique(
        uint256 _antiqueId,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 auctionEndTime
    ) public returns (bool success) {
        Antique storage antique = antiques[_antiqueId];
        require(
            msg.sender == antique.owner || isOwner(),
            'You are not authorised to resell this antique.'
        );

        require(antique.forSale == false, 'The antique is already for sale');

        require(antique.auctionEnded, 'The auction has not ended');

        antique.highestBidder = address(0);

        return
            _newAntique(
                antique.tokenId,
                antique.tokenURI,
                startingPrice,
                reservePrice,
                auctionEndTime
            );
    }

    /**
     * @dev Delete a antique from the antique store. Only the antique's owner or the
     * antiquestore's owner is authorised for this operation.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a `DeleteAntique` event.
     */
    function deleteAntique(uint256 _antiqueId) public returns (bool success) {
        require(
            msg.sender == antiques[_antiqueId].owner || isOwner(),
            'You are not authorised to delete this antique.'
        );

        Antique storage antique = antiques[_antiqueId];
        antique.forSale = false;

        emit DeleteAntique(_antiqueId);

        return true;
    }

    /**
     * @dev Emitted when a new antique is added to the antiquestore.
     * Note `antiqueId` starts from 0.
     */
    event NewAntique(
        uint256 indexed antiqueId,
        address indexed nftContract,
        uint256 indexed tokenId
    );

    /**
     * @dev Emitted when a new antique rental is made.
     * Note `bidId` and `antiqueId` start from 0.
     */
    event NewBid(
        uint256 indexed antiqueId,
        address indexed bidder,
        uint256 indexed amount
    );

    event AuctionEnded(
        uint256 indexed antiqueId,
        address indexed highestBidder,
        uint256 indexed highestBid,
        address royaltyReceiver,
        uint256 royaltyAmount
    );

    event NewWithdrawal(
        uint256 indexed antiqueId,
        address indexed bidder,
        uint256 indexed amount
    );

    /**
     * @dev Emitted when a antique is deleted from the antiquestore.
     */
    event DeleteAntique(uint256 indexed antiqueId);
}
