import WalletConnectProvider from '@walletconnect/web3-provider'

let providerInst = undefined

export const provider = (forceRecreate = true) => {
  if (forceRecreate || !providerInst) {
    providerInst = new WalletConnectProvider({
      infuraId: import.meta.env['VITE_INFURA_ID'],
    })
  }
  return providerInst
}

let web3ProviderInst = undefined

export const web3Provider = (newProvider = undefined) => {
  if (newProvider != undefined) {
    web3ProviderInst = newProvider
  }
  console.log('web3ProviderInst', web3ProviderInst)
  return web3ProviderInst
}
