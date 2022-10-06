import connect from './index'
import { provider } from '../../walletConnect/provider'
import Web3 from 'web3'

export const web3Provider = () => {
  const { state } = connect()
  console.log('state', JSON.stringify(state))

  const web3ProviderInst = state && state.status ? provider() : null
  console.log('web3ProviderInst', web3ProviderInst)
  if (web3ProviderInst) {
    web3ProviderInst.enable()
  }
  return web3ProviderInst
}

const connectWalletConnect = async () => {
  try {
    const { state } = connect()

    //  Enable session (triggers QR Code modal)
    let wcProvider = provider()
    await wcProvider.enable()

    state.status = true
    const web3 = new Web3(wcProvider)
    state.address = await web3.eth.getAccounts()[0]
    state.chainId = await web3.eth.getChainId()
    console.log('chainId', state.chainId)

    wcProvider.on('disconnect', (code, reason) => {
      console.log(code, reason)
      console.log('disconnected')
      state.status = false
      state.address = ''
      localStorage.removeItem('userState')

      window.location.reload()
    })

    wcProvider.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        state.address = accounts[0]
        console.log('address', state.address)
      }
    })

    wcProvider.on('chainChanged', (chainId) => {
      state.chainId = chainId
      console.log('chainId', state.chainId)
    })

    window.location.reload()
  } catch (error) {
    provider(true)
    console.log(error)
  }
}

export default connectWalletConnect
