<template>
  <div>
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
          <div class="modal-header">
            <h3>Antique Details</h3>
          </div>
          <div class="modal-body">
            <slot name="body">
              <h3>{{ antiqueData.name }}</h3>
              <h4>Starting Price: {{ antiqueData.price }}</h4>
              <h4
                v-if="
                  userData.isBidder || userData.address == antiqueData.owner
                "
              >
                {{ displayReserveOrBid() }}
              </h4>
              <h4>{{ displayHighestBid() }}</h4>

              <p>
                Description: {{ antiqueData.bidEther }}<br />
                {{ auctionEndState() }}<br />
                Owner: <small>{{ antiqueData.owner }}</small>
              </p>

              <div v-if="enteringBidValue" class="form-group">
                <label for="bidEther"
                  >Enter new bid ({{ currencySymbol }}):</label
                >
                <input
                  type="text"
                  class="form-control input-sm"
                  v-model="bidEther"
                />
              </div>

              <button
                v-if="canDeleteAntique()"
                class="btn btn-danger float-right mr-3"
                v-on:click="deleteAntique"
              >
                Delete
              </button>
              <button
                v-if="canEndAuction()"
                class="btn btn-primary float-right mr-3"
                v-on:click="endAuction"
              >
                End Auction
              </button>
              <button
                v-else-if="
                  antiqueData.available &&
                  userData.address != antiqueData.owner &&
                  (!userData.isBidder ||
                    antiqueData.reservePriceWei < antiqueData.highestBidWei)
                "
                v-on:click="bidAntique"
                class="btn btn-primary float-right mr-3"
              >
                {{ enteringBidValue ? 'Confirm' : 'Place Bid' }}
              </button>
              <button
                v-else-if="
                  userData.address == antiqueData.owner &&
                  antiqueData.reservePriceWei == antiqueData.highestBidWei
                "
                class="btn btn-primary float-right mr-3"
                v-on:click="resellAntique"
              >
                Resell Antique
              </button>
              <button
                v-else-if="
                  userData.address != antiqueData.owner &&
                  antiqueData.auctionEnded
                "
                class="btn btn-danger float-right mr-3"
                v-on:click="withdraw"
              >
                Withdraw
              </button>

              <button
                class="btn btn-outline-secondary float-right mr-3"
                v-on:click="userInteractionCompleted"
              >
                Cancel
              </button>
            </slot>

            <pulse-loader :loading="loading"></pulse-loader>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import mixin from '../libs/mixinSmartContracts'
import PulseLoader from 'vue-spinner/src/PulseLoader.vue'

export default {
  mixins: [mixin],
  components: {
    PulseLoader,
  },
  props: ['antiqueData', 'userData'],
  data() {
    return {
      loading: false,
      bidEther: 0,
      timestamp: 0,
      tmoConn: null, // contain the intervalID given by setInterval
      enteringBidValue: false,
      currencySymbol: window.bc.getInfo('currencySymbol'),
    }
  },
  created() {
    console.log(`this.antiqueData: ${JSON.stringify(this.antiqueData)}`)
  },
  methods: {
    displayReserveOrBid() {
      return `${this.userData.isBidder ? 'My Bid' : 'Reserve Price'}: ${
        this.antiqueData.reservePrice
      }`
    },
    displayHighestBid() {
      return `Highest Bid: ${this.antiqueData.highestBid}${
        this.antiqueData.highestBidder == this.userData.address
          ? ' (by me)'
          : ''
      }`
    },
    auctionEndState() {
      return this.antiqueData.auctionEnded
        ? 'Auction Ended'
        : `Auction Ending at:${this.antiqueData.auctionEndTime.toLocaleString()}`
    },
    canDeleteAntique() {
      return (
        this.userData.address == this.antiqueData.owner &&
        (this.antiqueData.highestBidWei == 0 ||
          import.meta.env.VITE_DELETE_ANTIQUE_ON_SALE)
      )
    },
    canEndAuction() {
      return (
        !this.userData.isBidder &&
        this.userData.address == this.antiqueData.owner &&
        window.bc.weiToEther(this.antiqueData.highestBidWei) >=
          window.bc.weiToEther(this.antiqueData.reservePriceWei)
      )
    },
    deleteAntique() {
      this.invokeSmartContract(
        'AntiqueMarketplace',
        'deleteAntique',
        this.getContractInfo,
      )
    },
    withdraw() {
      this.invokeSmartContract(
        'AntiqueMarketplace',
        'withdraw',
        this.getContractInfo,
      )
    },
    endAuction() {
      this.invokeSmartContract('AntiqueNFT', 'endAuction', this.getContractInfo)
    },
    resellAntique() {
      this.userInteractionCompleted({
        action: 'resellAntique',
        antiqueId: this.antiqueData.id,
      })
    },
    bidAntique() {
      if (!this.enteringBidValue) {
        this.bidEther =
          this.antiqueData.highestBidWei > 0
            ? window.bc.weiToEther(this.antiqueData.highestBidWei).toString()
            : window.bc.weiToEther(this.antiqueData.priceWei).toString()
        if (this.antiqueData.highestBidWei > 0) {
          this.bidEther =
            this.bidEther + (this.bidEther.includes('.') ? '1' : '.1')
        }
        console.log(`bidEther: ${JSON.stringify(this.bidEther)} `)
        this.enteringBidValue = true
      } else {
        console.log(`bidEther: ${JSON.stringify(this.bidEther)} `)
        this.bidValue = window.bc.etherToWei(this.bidEther)
        this.invokeSmartContract(
          'AntiqueMarketplace',
          'bidAntique',
          this.getContractInfo,
          (error, _txnInfo) => {
            if (error) {
              console.error(error)
            }
          },
        )
      }
    },
    getContractInfo(contractName, method) {
      const address = this.userData.address
      const antiqueId = this.antiqueData.id
      console.log(`getContractInfo - antiqueId: ${antiqueId} `)

      const antiqueMarketplaceContract = window.bc.contract(contractName)
      let value = undefined
      let bidValue = undefined
      if (
        method == 'deleteAntique' ||
        method == 'endAuction' ||
        method == 'withdraw' ||
        method == 'resellAntique'
      ) {
        method = antiqueMarketplaceContract.methods[method](antiqueId)
      } else {
        value = this.bidValue
        bidValue = value
        console.log(`getContractInfo - value: ${value} `)
        method = antiqueMarketplaceContract.methods[method](antiqueId)
      }
      return {
        contract: antiqueMarketplaceContract,
        antiqueId,
        method,
        value,
        address,
        bidValue,
      }
    },
  },
}
</script>

<style></style>
