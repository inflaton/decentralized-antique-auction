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
