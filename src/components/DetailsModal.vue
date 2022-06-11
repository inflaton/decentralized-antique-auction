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
                Description: {{ antiqueData.description }}<br />
                {{ auctionEndState() }}<br />
                Owner: <small>{{ antiqueData.owner }}</small>
              </p>

              <button
                v-if="canEndAuction()"
                class="btn btn-danger float-right"
                v-on:click="endAuction"
              >
                End Auction
              </button>
              <button
                v-else-if="
                  userData.address == antiqueData.owner &&
                  antiqueData.highestBidWei == 0
                "
                class="btn btn-danger float-right"
                v-on:click="deleteAntique"
              >
                Delete
              </button>
              <button
                v-else-if="
                  antiqueData.available &&
                  userData.address != antiqueData.owner &&
                  ((!userData.isBidder &&
                    antiqueData.highestBidder != userData.address) ||
                    antiqueData.reservePriceWei < antiqueData.highestBidWei)
                "
                v-on:click="bidAntique"
                class="btn btn-primary float-right"
              >
                Place Bid
              </button>
              <button
                v-else-if="
                  userData.address == antiqueData.owner &&
                  antiqueData.reservePriceWei == antiqueData.highestBidWei
                "
                class="btn btn-danger float-right"
                v-on:click="resellAntique"
              >
                Resell Antique
              </button>
              <button
                v-else-if="
                  userData.address != antiqueData.owner &&
                  antiqueData.auctionEnded
                "
                class="btn btn-danger float-right"
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
import { openDialog } from 'vue3-promise-dialog'
import BidDialog from '../components/BidDialog.vue'

export default {
  mixins: [mixin],
  components: {
    PulseLoader,
  },
  props: ['antiqueData', 'userData'],
  data() {
    return {
      loading: false,
      bid: 0,
      timestamp: 0,
      tmoConn: null, // contain the intervalID given by setInterval
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
        'AntiqueStore',
        'deleteAntique',
        this.getContractInfo,
      )
    },
    withdraw() {
      this.invokeSmartContract('AntiqueStore', 'withdraw', this.getContractInfo)
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
      this.bid =
        this.antiqueData.highestBidWei > 0
          ? window.bc.weiToEther(this.antiqueData.highestBidWei).toString()
          : window.bc.weiToEther(this.antiqueData.priceWei).toString()
      if (this.antiqueData.highestBidWei > 0) {
        this.bid = this.bid + (this.bid.includes('.') ? '1' : '.1')
      }
      console.log(`bid: ${JSON.stringify(this.bid)} `)
      const currencySymbol = window.bc.getInfo('currencySymbol')
      openDialog(BidDialog, {
        text: `Enter your bid (${currencySymbol}): `,
        bid: this.bid,
      }).then((result) => {
        console.log(`result: ${JSON.stringify(result)} `)
        if (result != false) {
          this.bid = window.bc.etherToWei(result)
          this.invokeSmartContract(
            'AntiqueStore',
            'bidAntique',
            this.getContractInfo,
            (error, _txnInfo) => {
              if (error) {
                console.error(error)
              }
            },
          )
        }
      })
    },
    getContractInfo(contractName, method) {
      const address = this.userData.address
      const antiqueId = this.antiqueData.id
      console.log(`getContractInfo - antiqueId: ${antiqueId} `)

      const antiqueStoreContract = window.bc.contract(contractName)
      let value = undefined

      if (
        method == 'deleteAntique' ||
        method == 'endAuction' ||
        method == 'withdraw' ||
        method == 'resellAntique'
      ) {
        method = antiqueStoreContract.methods[method](antiqueId)
      } else {
        value = this.bid
        console.log(`getContractInfo - value: ${value} `)
        const currencySymbol = window.bc.getInfo('currencySymbol')
        method = antiqueStoreContract.methods[method](antiqueId)
      }
      return {
        contract: antiqueStoreContract,
        antiqueId,
        method,
        value,
        address,
      }
    },
  },
}
</script>

<style></style>
