import connect from './index'
import { provider } from '../../walletConnect/provider'

export const web3Provider = () => {
  const { state } = connect()
  console.log('state', JSON.stringify(state))

  const web3ProviderInst = state && state.status ? provider() : null
  console.log('web3ProviderInst', web3ProviderInst)
  return web3ProviderInst
}

const connectWalletConnect = async () => {
  try {
    const { state } = connect()

    //  Enable session (triggers QR Code modal)
    let wcProvider = provider()
    await wcProvider.enable()

    state.status = true
    state.address = ''
    state.chainId = await wcProvider.request({ method: 'eth_chainId' })
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

    // window.location.reload()
  } catch (error) {
    provider(true)
    console.log(error)
  }
}

export default connectWalletConnect
