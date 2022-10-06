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

export const web3Provider = (newProvider = undefined) => {
  console.log('newProvider', newProvider)
  if (newProvider == null) {
    localStorage.removeItem('web3ProviderInst')
  } else if (newProvider) {
    localStorage.setItem('web3ProviderInst', newProvider)
  }
  let web3ProviderInst = localStorage.getItem('web3ProviderInst')
  console.log('web3ProviderInst', web3ProviderInst)
  return web3ProviderInst
}
