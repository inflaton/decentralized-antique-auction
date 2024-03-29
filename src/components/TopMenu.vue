<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <ul class="navbar-nav">
      <li class="nav-link">
        <strong :class="connectedClass">
          {{
          bcConnected ? `Connected to ${this.networkName}` : 'Not Connected'
          }}
        </strong>
      </li>
      <li v-if="bcConnected" class="nav-link" v-on:click="reconnectUser">
        {{
        getAddress()
        }}
      </li>
    </ul>
    <transaction-modal v-if="showModal" :transactionData="transactionObject" @completed="onCompleted" />
    <transaction-modal v-if="showModalConfirmed" :transactionData="transactionObject"
      @completed="onCompletedConfirmed" />
  </nav>
</template>

<script>
// importing common function
import connect from '../composables/connect/index'
import mixin from '../libs/mixinViews'
import TransactionModal from './TransactionModal.vue'

export default {
  mixins: [mixin],

  data() {
    return {
      tmoConn: null, // contain the intervalID given by setInterval
      tmoReg: null, // contain the intervalID given by setInterval
      connectedClass: 'text-danger', // bootstrap class for the connection status (red when not connected, green when connected)
      showModal: false,
      showModalConfirmed: false,
      transactionObject: {},
    }
  },

  components: {
    TransactionModal,
  },

  methods: {
    round(value) {
      const decimals = 3
      return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals)
    },
    shortAddress(address) {
      if (address) {
        let first = address.slice(0, 6)
        let last = address.slice(-4)
        address = first + '...' + last
      }
      return address
    },
    getAddress() {
      return window.bc.info.mainAccount ? this.shortAddress(window.bc.info.mainAccount) + '@'
        + (window.bc.info.walletConnect ? 'Wallet Connect' : 'MetaMask') : ''
    },
    async reconnectUser() {
      const { connectWalletConnect, disconnectWallet } = connect()
      if (window.bc.info.walletConnect) {
        await disconnectWallet()
      } else {
        await connectWalletConnect()
      }
      window.location.reload()
    },
    showTransactionDetails(txnInfo) {
      this.transactionObject.contract = txnInfo.contract
      this.transactionObject.txHash = txnInfo.txHash
      this.transactionObject.status = txnInfo.status
      this.transactionObject.tokenId = txnInfo.tokenId
      this.transactionObject.tokenAddress = txnInfo.tokenAddress
      this.transactionObject.value = txnInfo.value
      this.transactionObject.royaltyReceiver = txnInfo.royaltyReceiver
      this.transactionObject.royaltyAmount = txnInfo.royaltyAmount

      if (txnInfo.status == 'Confirmed') {
        this.transactionObject.submissionDuration = this.round(
          (txnInfo.perf.t1 - txnInfo.perf.t0) / 1000,
        )
        this.transactionObject.confirmationDuration = this.round(
          (txnInfo.perf.t2 - txnInfo.perf.t1) / 1000,
        )

        this.showModal = false
        const This = this
        setTimeout(() => (This.showModalConfirmed = true), 50)
      } else {
        this.showModal = true
        this.showModalConfirmed = false
      }
    },
    onCompleted() {
      this.showModal = false
    },
    onCompletedConfirmed() {
      this.showModalConfirmed = false
    },
    checkBlockchainIsConnected() {
      this.tmoConn = setInterval(() => {
        // checking first if the connection with the blockchain is established
        if (this.blockchainIsConnected()) {
          // stopping the setInterval
          clearInterval(this.tmoConn)

          // showing the connected message on the top bar and setting the class too
          this.connectedClass = 'text-success'
        }
      }, 500)
    },
  },

  created() {
    this.$Event.on('transaction_event', this.showTransactionDetails)
    this.checkBlockchainIsConnected()
  },
}
</script>

<style>

</style>
