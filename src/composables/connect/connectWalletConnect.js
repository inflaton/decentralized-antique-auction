import connect from './index'
import { provider } from '../../walletConnect/provider'

const connectWalletConnect = async () => {
  try {
    console.log('connect')
    const { state } = connect()

    //  Enable session (triggers QR Code modal)
    let wcProvider = provider()
    await wcProvider.enable()
    console.log('after enable')

    state.status = true
    state.address = address
    state.chainId = await wcProvider.request({ method: 'eth_chainId' })
    console.log(state.chainId)
    wcProvider.on('disconnect', (code, reason) => {
      console.log(code, reason)
      console.log('disconnected')
      state.status = false
      state.address = ''
      localStorage.removeItem('userState')
    })

    wcProvider.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        state.address = accounts[0]
      }
    })

    wcProvider.on('chainChanged', (chainId) => {
      console.log(chainId)
      state.chainId = chainId
    })

    window.web3Provider = wcProvider
    window.location.reload()
  } catch (error) {
    provider(true)
    console.log(error)
  }
}

export default connectWalletConnect
