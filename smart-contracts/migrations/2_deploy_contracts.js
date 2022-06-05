var AntiqueNFT = artifacts.require('./AntiqueNFT.sol')
var AntiqueStoreContract = artifacts.require('./AntiqueStore.sol')

module.exports = function (deployer) {
  // deployer.deploy(AntiqueNFT)
  // deployer.deploy(AntiqueStoreContract)

  deployer.deploy(AntiqueStoreContract).then(function () {
    return deployer.deploy(AntiqueNFT, AntiqueStoreContract.address)
  })
}
