<template>
  <div>
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
          <div class="modal-header">
            <h3>Sell Your Antique</h3>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label for="name">Antique Name</label>
              <input v-if="this.antiqueData" type="text" class="form-control input-sm" v-model="name"
                placeholder="Enter Antique Name" readonly />
              <input v-else type="text" class="form-control input-sm" v-model="name" placeholder="Enter Antique Name" />
            </div>
            <div class="form-group">
              <label for="description">Description</label>
              <input v-if="this.antiqueData" type="text" class="form-control input-sm" v-model="description" readonly
                placeholder="Description" />
              <input v-else type="text" class="form-control input-sm" v-model="description" placeholder="Description" />
            </div>
            <div class="form-group" v-if="!this.antiqueData">
              <label for="image">Image</label>
              <input type="file" class="form-control input-sm" ref="doc" @change="onFileSelected()"
                placeholder="Image" />
            </div>
            <div class="form-group">
              <label for="startingPrice">Starting/Reserve Price ({{ priceUnit }}) {{ !antiqueData ? '& Royalty (%)' :
                ''}} </label>
              <div class="input-group">
                <input type="text" class="form-control input-sm" v-model="startingPrice" placeholder="Starting" />
                <span class="input-group-btn" style="width: 0px"></span>
                <input type="text" class="form-control input-sm" v-model="reservePrice" placeholder="Reserve"
                  style="margin-left: -1px" />
                <span v-if="!this.antiqueData" class="input-group-btn" style="width: 0px"></span>
                <input v-if="!this.antiqueData" type="text" class="form-control input-sm" v-model="royalty"
                  placeholder="Royalty" style="margin-left: -1px" />
              </div>
            </div>
            <div class="form-group">
              <label for="listingEndDate">Auction End Date/Time</label>
              <Datepicker class="form-control input-sm" v-model="listingEndDate" />
            </div>
            <button v-on:click="sellAntique" class="btn btn-primary float-right">
              Submit
            </button>
            <button class="btn btn-outline-secondary float-right mr-3" v-on:click="userInteractionCompleted">
              Cancel
            </button>
            <pulse-loader :loading="loading"></pulse-loader>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import mixin from '../libs/mixinSmartContracts'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import createNFTMetaDataURIViaPinata from '../libs/createNFTMetaDataURI'
import PulseLoader from 'vue-spinner/src/PulseLoader.vue'

export default {
  mixins: [mixin],
  props: ['userData', 'antiqueData'],
  components: { Datepicker, PulseLoader },
  data() {
    let listingEndDate = new Date()
    listingEndDate.setDate(listingEndDate.getDate() + 30)
    return {
      name: this.antiqueData ? this.antiqueData.name : '',
      description: this.antiqueData ? this.antiqueData.description : '',
      startingPrice: '',
      reservePrice: '',
      royalty: '',
      file: undefined,
      listingEndDate,
      priceUnit: `${window.bc.info.currencySymbol}`,
      loading: false,
      tokenMetaDataURI: undefined,
    }
  },
  created() {
    console.log('this.antiqueData', this.antiqueData)
  },
  methods: {
    getContractInfo(contractName, method) {
      const address = this.userData.address
      const antiqueStoreContract = window.bc.contract(contractName)
      method = this.antiqueData ?
        antiqueStoreContract.methods[method](
          this.antiqueData.id,
          window.bc.etherToWei(this.startingPrice),
          window.bc.etherToWei(this.reservePrice),
          Math.round(this.listingEndDate.getTime() / 1000))
        :
        antiqueStoreContract.methods[method](
          this.tokenMetaDataURI,
          window.bc.etherToWei(this.startingPrice),
          window.bc.etherToWei(this.reservePrice),
          Math.round(parseFloat(this.royalty) * 100), // to basis point
          Math.round(this.listingEndDate.getTime() / 1000))
      return { contract: antiqueStoreContract, method, address }
    },
    onFileSelected() {
      this.file = this.$refs.doc.files[0]
      console.log(`file selected: ${JSON.stringify(this.file)}`)
    },
    createNFTMetaDataURI() {
      if (this.antiqueData) {
        return new Promise((resolve) => {
          resolve()
        })
      }
      const nftData = {
        receiverAddress: this.userData.address,
        metaData: {
          name: this.name,
          description: this.description,
          image: this.file,
          attributes: [
            {
              trait_type: 'creator',
              value: this.userData.address,
            },
            {
              trait_type: 'royalty',
              value: this.royalty + '%',
            },
            {
              trait_type: 'createdAt',
              value: new Date().toUTCString(),
            },
          ],
        },
      }
      console.log(`nftData: ${JSON.stringify(nftData)}`)
      return new Promise((resolve, reject) => {
        createNFTMetaDataURIViaPinata(nftData, (result) => {
          resolve(result)
        }).catch((error) => {
          console.error(error)
          reject(error)
        })
      })
    },
    sellAntique() {
      this.loading = true
      this.createNFTMetaDataURI().then((tokenMetaDataURI) => {
        console.log(`tokenMetaDataURI: ${JSON.stringify(tokenMetaDataURI)}`)
        this.loading = false
        this.tokenMetaDataURI = tokenMetaDataURI
        this.invokeSmartContract(
          'AntiqueStore',
          this.antiqueData ? 'resellAntique' : 'sellAntique',
          this.getContractInfo,
          (error, _txnInfo) => {
            if (error) {
              console.error(error)
            }
          },
        )
      })
    },
  },
}
</script>

<style>
</style>
