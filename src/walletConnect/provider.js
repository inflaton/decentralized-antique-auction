import WalletConnectProvider from '@walletconnect/web3-provider'

let providerInst = undefined

export const provider = (forceRecreate = true) => {
  if (forceRecreate || !providerInst) {
    const infuraId = import.meta.env['VITE_INFURA_ID']
    providerInst = new WalletConnectProvider({
      infuraId,
      rpc: {
        5: `https://goerli.infura.io/v3/${infuraId}`, // goerli
        80001: `https://polygon-mumbai.infura.io/v3/${infuraId}`, // mumbai
      },
    })
  }
  return providerInst
}
