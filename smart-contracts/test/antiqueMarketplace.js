var AntiqueNFT = artifacts.require('./AntiqueNFT.sol')
var AntiqueMarketplace = artifacts.require('./AntiqueMarketplace.sol')

contract('AntiqueMarketplace', function (accounts) {
  var instance = null // store the AntiqueMarketplace contract instance
  var contractOwner = accounts[0]
  var mainAccount = accounts[1]
  var bidder1 = accounts[2]
  var bidder2 = accounts[3]
  var latestAntiqueId
  let resellingAntiqueId
  var nftInst

  // console.log(`accounts: ${accounts}`)
  it('should properly init contracts', function () {
    return AntiqueMarketplace.deployed()
      .then(function (contractInstance) {
        // storing the contract instance so it will be used later on
        instance = contractInstance
        return AntiqueNFT.deployed()
      })
      .then(function (_nftInst) {
        nftInst = _nftInst
        // console.log(`AntiqueNFT contract address: ${nftContract}`)
        return nftInst.setApprovalForAll(instance.address, true, {
          from: mainAccount,
        })
      })
      .then(function () {
        return instance.nftContract.call()
      })
      .then(function (result) {
        // storing the current number on the var antiquesBefore
        assert.equal(result, nftInst.address, 'nftContract not properly set up')
        return instance.contractOwner.call()
      })
      .then(function (_contractOwner) {
        // console.log(`contractOwner: ${contractOwner}`)
        assert.equal(
          _contractOwner,
          contractOwner,
          'nftContract not properly set up',
        )
      })
  })

  it('should add an antique', function () {
    var antiquesBefore = null

    // calling the smart contract function to get the current number of antiques
    return instance.antiqueId
      .call()
      .then(function (result) {
        // storing the current number on the var antiquesBefore
        antiquesBefore = result.toNumber()

        return instance.sellAntique(
          'ipfs://QmUwkKTgy1tYHLZLcFS8w3QagnSPzyEZfHJkQxWxLWWZik',
          2000000000000000,
          5000000000000000,
          0,
          1663991618,
          {
            from: mainAccount,
          },
        )
      })
      .then(function (_result) {
        // console.log(`sellAntique result: ${JSON.stringify(_result, 0, 2)}`)
        return instance.getAntiques.call(false)
      })
      .then(function (result) {
        // console.log(`getAntiques: ${result}`)
        const antiquesAfter = result.length
        // checking if the total number of user is increased by 1
        assert.equal(
          antiquesAfter,
          antiquesBefore + 1,
          'number of antiques must be (' + antiquesBefore + ' + 1)',
        )
        latestAntiqueId = antiquesAfter - 1
      })
  })

  it('antique details in the blockchain should be the same the one gave on sellAntique', function () {
    // NOTE: the contract instance has been instantiated before, so no need
    // to do again: return AntiqueMarketplace.deployed().then(function(contractInstance) { ...
    // like before in last test case.
    return instance.antiques.call(latestAntiqueId).then(function (result) {
      // console.log(`result: ${JSON.stringify(result)}`)

      assert.equal(result.id, 0)
      assert.equal(result.tokenId, 1)
      assert.equal(result.startingPrice, 2000000000000000) // forSale
      assert.equal(result.reservePrice, 5000000000000000)
      assert.equal(result.owner, mainAccount) // owner
      assert.equal(result.forSale, true)
      assert.equal(result.auctionEndTime, 1663991618)
    })
  }) // end testing username and email

  it('should bid an antique', function () {
    return instance
      .bidAntique(latestAntiqueId, {
        from: bidder1,
        value: 2000000000000001,
      })
      .then(function (result) {
        // console.log(`bidAntique: ${JSON.stringify(result)}`)
        assert.equal(
          result.receipt.from.toLowerCase(),
          bidder1.toLowerCase(),
          'bidAntique failed',
        )
      })
  })

  it('should bid an antique 2', function () {
    return instance
      .bidAntique(latestAntiqueId, {
        from: bidder2,
        value: 5000000000000000,
      })
      .then(function (result) {
        // console.log(`bidAntique: ${JSON.stringify(result, 0, 2)}`)
        assert.equal(
          result.receipt.from.toLowerCase(),
          bidder2.toLowerCase(),
          'bidAntique failed',
        )
      })
  })

  it('should retrieve my bids 1', function () {
    return instance
      .getMyBids({
        from: bidder1,
      })
      .then(function (result) {
        // console.log(`getMyBids: ${JSON.stringify(result, 0, 2)}`)
        assert.equal(result[0][3], 2000000000000001, 'getMyBids failed')
      })
  })

  it('should retrieve my bids 2', function () {
    return instance
      .getMyBids({
        from: bidder2,
      })
      .then(function (result) {
        // console.log(`getMyBids: ${JSON.stringify(result, 0, 2)}`)
        assert.equal(result[0][3], 5000000000000000, 'getMyBids failed')
      })
  })

  it('should end an auction', async function () {
    let result = await instance.endAuction(latestAntiqueId, {
      from: mainAccount,
    })
    assert.equal(result.receipt.status, true, 'endAuction failed')
    // console.log(`endAuction result: ${JSON.stringify(result, 0, 2)}`)

    assert.equal(
      result.receipt.logs[0].args.royaltyReceiver ||
        result.receipt.logs[2].args.royaltyReceiver,
      '0x0000000000000000000000000000000000000000',
      'should have no royalty receiver',
    )
    assert.equal(
      result.receipt.logs[0].args.royaltyAmount ||
        result.receipt.logs[2].args.royaltyAmount,
      '0',
      'should have no royalty amount',
    )
  })

  it('should retrieve my bids after winning', function () {
    return instance
      .getMyBids({
        from: bidder2,
      })
      .then(function (result) {
        // console.log(`getMyBids: ${JSON.stringify(result, 0, 2)}`)
        assert.equal(result[0][3], 5000000000000000, 'getMyBids failed')
      })
  })

  it('should resell after winning', function () {
    return instance
      .resellAntique(
        latestAntiqueId,
        5000000000000000,
        7000000000000000,
        1673991618,
        {
          from: bidder2,
        },
      )
      .then(function (result) {
        // console.log(`resellAntique: ${JSON.stringify(result, 0, 2)}`)
        assert.equal(result.receipt.status, true, 'resellAntique failed')
        resellingAntiqueId = result.receipt.logs[0].args.antiqueId
      })
  })

  it('should not retrieve my bids after reselling', function () {
    return instance
      .getMyBids({
        from: bidder2,
      })
      .then(function (result) {
        // console.log(`getMyBids: ${JSON.stringify(result, 0, 2)}`)
        assert.equal(result.length, 0, 'getMyBids after reselling failed')
      })
  })

  it('should withdraw after auction ends', function () {
    return instance
      .withdraw(latestAntiqueId, {
        from: bidder1,
      })
      .then(function (result) {
        // console.log(`withdraw: ${JSON.stringify(result, 0, 2)}`)
        assert.equal(
          result.receipt.from.toLowerCase(),
          bidder1.toLowerCase(),
          'withdraw failed',
        )
      })
  })

  it('should not retrieve my bids after withdrawal', function () {
    return instance
      .getMyBids({
        from: bidder1,
      })
      .then(function (result) {
        // console.log(`getMyBids: ${JSON.stringify(result, 0, 2)}`)
        assert.equal(result.length, 0, 'getMyBids after withdrawal failed')
      })
  })

  it('creator should not receive royalty for reselling', async function () {
    const balanceBefore = await web3.eth.getBalance(mainAccount)
    // console.log(`balanceBefore: ${balanceBefore} ${typeof balanceBefore}`)

    let result = await instance.bidAntique(resellingAntiqueId, {
      from: bidder1,
      value: 8000000000000000,
    })
    assert.equal(result.receipt.status, true, 'bidAntique failed')

    result = await nftInst.approve(instance.address, resellingAntiqueId, {
      from: bidder2,
    })
    // console.log(`approve: ${JSON.stringify(result, 0, 2)}`)
    assert.equal(result.receipt.status, true, 'approve failed')

    result = await instance.endAuction(resellingAntiqueId, {
      from: bidder2,
    })
    assert.equal(result.receipt.status, true, 'endAuction failed')

    const balanceAfter = await web3.eth.getBalance(mainAccount)
    // console.log(`balanceAfter: ${balanceBefore} ${typeof balanceAfter}`)

    assert.equal(
      web3.utils.toBN(balanceAfter) - web3.utils.toBN(balanceBefore),
      0,
      'endAuction failed',
    )
  })
}) // end AntiqueMarketplace contract
