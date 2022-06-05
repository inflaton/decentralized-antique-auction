<template>
  <div>
    <button class="btn btn-warning float-right mt-2" @click="reloadList">
      Reload
    </button>

    <h2 class="title">
      My Bids
      <button class="title btn btn-link" @click="goToHome">
        Antique Auctions
      </button>
    </h2>
    <hr />

    <h2 v-show="!bcConnected">Not connect to the blockchain: please wait.</h2>

    <h2 v-show="isLoading && bcConnected">Loading...</h2>
    <div class="row" v-show="!isLoading">
      <div
        class="m-3"
        v-for="(antique, i) in antiques"
        v-bind:key="'antique' + antique.id + i"
      >
        <Card
          :antiqueObject="antique"
          :userObject="getUserObject()"
          @resellAntique="resellAntique"
        />
      </div>
    </div>
    <antique-form
      v-if="showModal"
      :userData="getUserObject()"
      :antiqueData="getAntiqueObject()"
      @userInteractionCompleted="onUserInteractionCompleted"
    />
  </div>
</template>

<script>
// importing common function
import mixin from '../libs/mixinViews'
import Card from '../components/Card.vue'
import AntiqueForm from '../components/AntiqueForm.vue'
import axios from 'axios'

/**
 * List view component: this component shows list of the registered antiques
 * and their statuses.
 */
export default {
  mixins: [mixin],

  components: {
    Card,
    AntiqueForm,
  },

  data() {
    return {
      showModal: false,
      address: null,
      lastTotal: 0,
      antiques: [], // array that stores all the registered antiques
      isLoading: true, // true when the Antique Auctions is loading form the blockchain
      bcConnected: false, // blockchain is connected ()
      tmoConn: null, // contain the intervalID given by setInterval
      antiqueId: -1,
    }
  },

  methods: {
    goToHome() {
      this.$router.push('/')
    },
    resellAntique(antiqueId) {
      console.log(`resellAntique: ${antiqueId}`)
      this.antiqueId = antiqueId
      this.toggle()
    },
    onTransactionEvent(txnInfo) {
      console.log(`onTransactionEvent: ${JSON.stringify(txnInfo)}`)
      if (txnInfo.status == 'Confirmed') {
        const antiqueId =
          txnInfo.contract.method == 'resellAntique'
            ? this.antiqueId
            : txnInfo.antiqueId
        for (let i = 0; i < this.antiques.length; i++) {
          const antique = this.antiques[i]
          if (antique.id == antiqueId) {
            this.antiques.splice(i, 1)
            break
          }
        }
      }
    },
    getUserObject() {
      return {
        address: this.address,
        isBidder: true,
      }
    },
    getAntiqueObject() {
      for (let i = 0; i < this.antiques.length; i++) {
        const antique = this.antiques[i]
        if (antique.id == this.antiqueId) {
          return antique
        }
      }
      return undefined
    },

    /**
     * Get the list of the registered antiques once the connection to the
     * blockchain is established.
     */
    getAntiqueList() {
      if (this.blockchainIsConnected()) {
        // it shows the loading message
        this.isLoading = true

        // stopping the interval
        clearInterval(this.tmoConn)

        window.bc.getMainAccount().then((address) => {
          this.address = address
          this.getMyBids(this.onAntiqueLoaded)
        })
      }
    },
    async onAntiqueLoaded(antique) {
      console.log(`antique loaded: ${JSON.stringify(antique)}`)

      const tokenURI = antique.tokenURI
      const url = tokenURI.replace('ipfs://', import.meta.env.VITE_IPFS_GATEWAY)

      console.log(`fetching ${url}`)
      const response = await axios.get(url)
      console.log(response)
      const tokenMetaData = response.data

      antique = {
        id: antique.id,
        name: tokenMetaData.name,
        description: tokenMetaData.description,
        available: antique.forSale,
        priceWei: antique.startingPrice,
        price: window.bc.weiToEtherStr(antique.startingPrice),
        reservePriceWei: antique.reservePrice,
        reservePrice: window.bc.weiToEtherStr(antique.reservePrice),
        highestBidWei: antique.highestBid,
        highestBid: window.bc.weiToEtherStr(antique.highestBid),
        auctionEndTime: new Date(antique.auctionEndTime * 1000),
        owner: antique.owner,
        highestBidder: antique.highestBidder,
        auctionEnded: antique.auctionEnded,
        imageUrl: tokenMetaData.image.replace(
          'ipfs://',
          import.meta.env.VITE_IPFS_GATEWAY,
        ),
      }
      let i
      for (i = 0; i < this.antiques.length; i++) {
        const element = this.antiques[i]
        if (antique.id <= element.id) {
          this.antiques.splice(i, antique.id == element.id ? 1 : 0, antique)
          break
        }
      }
      if (i == this.antiques.length) {
        this.antiques.push(antique)
      }
    },
    /**
     * It reloads the Antique Auctions.
     */
    reloadList() {
      this.antiques = []
      this.getAntiqueList()
    },

    toggle() {
      this.showModal = !this.showModal
    },

    onUserInteractionCompleted(e) {
      console.log(`onUserInteractionCompleted: ${JSON.stringify(e)}`)
      this.toggle()
    },

    /**
     * Get all my bids.
     */
    getMyBids(callback) {
      const antiquestoreContract = window.bc.contract('AntiqueStore')
      // getting the total number of antiques stored in the blockchain
      // calling the method getAntiques from the smart contract
      antiquestoreContract.methods
        .getMyBids()
        .call({
          from: this.address,
        })
        .then(async (antiques) => {
          const total = antiques.length
          console.log('total bids:', total)
          this.lastTotal = total
          this.isLoading = false

          if (total > 0) {
            // getting the antique one by one
            for (var i = 0; i < total; i++) {
              const antique = antiques[i]
              callback(antique)
            } // end for
          }
        })
        .catch((err) => {
          console.log('getAntiques error:', err)
          this.$Event.emit('smart_contract_error', err)
        })
    },
  }, // end methods

  created() {
    this.$Event.on('transaction_event', this.onTransactionEvent)

    // it tries to get the Antique Auctions from the blockchain once
    // the connection is established
    this.tmoConn = setInterval(() => {
      this.getAntiqueList()
    }, 500)
  },
}
</script>

<style></style>
