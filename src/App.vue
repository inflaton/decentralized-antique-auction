<template>
  <div>
    <top-menu></top-menu>

    <h2 class="p-4" v-show="!bcConnected && !bcConnectionError">
      Connecting...
    </h2>

    <div class="p-4" v-show="bcConnected && !bcConnectionError">
      <router-view></router-view>
    </div>

    <div v-show="bcConnectionError" class="m-4 alert alert-danger">
      <h2 class="pb-4">Error connecting to the blockchain!</h2>

      <p v-if="errorConnectionMessage">
        <b>{{ errorConnectionMessage }}</b>
      </p>

      <p v-show="bcSmartContractAddressError">
        <b
          >It seems like the address of the smart contract is wrong, or the
          smart contract has not been deployed to this network!</b
        >
      </p>

      <hr />

      <p>Other common causes of error:</p>
      <ul>
        <li>The blockchain is running.</li>
        <li>
          The port in your settings match with the blockchain configuration.
        </li>
      </ul>
      <div v-if="state.status">
        <button @click="connectUserWallet" class="button">Connected</button>
        <h3>Address: {{ state.address }}</h3>
        <h3>ChainId: {{ state.chainId }}</h3>
        <button @click="disconnectUser" class="disconnect__button">
          Disconnect
        </button>
      </div>

      <button v-else @click="connectUserWallet" class="button">
        Connect Wallet
      </button>
    </div>
  </div>
  <DialogWrapper />
</template>

<script>
// importing common function
import connect from './composables/connect/index'
import mixin from './libs/mixinViews'
import TopMenu from './components/TopMenu.vue'
import { DialogWrapper } from 'vue3-promise-dialog'

export default {
  components: { TopMenu, DialogWrapper },
  mixins: [mixin],

  name: 'App',

  setup: () => {
    const { connectWalletConnect, disconnectWallet, state } = connect()
    const connectUserWallet = async () => {
      console.log('connectUserWallet')
      await connectWalletConnect()
    }

    const disconnectUser = async () => {
      await disconnectWallet()
    }

    return {
      connectUserWallet,
      disconnectUser,
      state,
    }
  },

  methods: {
    onSmartContractError(e) {
      console.log(`onSmartContractError: ${JSON.stringify(e)}`)
      this.bcSmartContractAddressError = true
      this.showConnectionErrorMessage(e)
    },
  },

  created() {
    this.$Event.on('smart_contract_error', this.onSmartContractError)
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1.title {
  margin-bottom: 50px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ccc;
}
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
