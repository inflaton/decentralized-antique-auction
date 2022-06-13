var AntiqueNFT = artifacts.require('./AntiqueNFT.sol')
var AntiqueMarketplaceContract = artifacts.require('./AntiqueMarketplace.sol')

module.exports = function (deployer) {
  // deployer.deploy(AntiqueNFT)
  // deployer.deploy(AntiqueMarketplaceContract)

  deployer.deploy(AntiqueMarketplaceContract).then(function () {
    return deployer.deploy(AntiqueNFT, AntiqueMarketplaceContract.address)
  })
}
