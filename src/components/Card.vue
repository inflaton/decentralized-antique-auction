<template>
  <div>
    <div class="card" style="width: 18rem">
      <img
        class="card-img-top"
        :src="antiqueObject.imageUrl"
        alt="Card image cap"
      />
      <div class="card-body">
        <h5 class="card-title">{{ antiqueObject.name }}</h5>
        <p class="card-text">
          Starting Price: {{ antiqueObject.price }}<br />
          Highest Bid: {{ antiqueObject.highestBid }}
        </p>
        <button class="btn btn-primary btn-lg btn-block" v-on:click="toggle">
          View
        </button>
      </div>
    </div>
    <details-modal
      v-if="showModal"
      :antiqueData="antiqueObject"
      :userData="userObject"
      @userInteractionCompleted="onUserInteractionCompleted"
    >
    </details-modal>
  </div>
</template>

<script>
import DetailsModal from './DetailsModal.vue'
import mixin from '../libs/mixinViews'

export default {
  mixins: [mixin],
  props: ['antiqueObject', 'userObject'],
  data() {
    return {
      showModal: false,
    }
  },
  components: {
    DetailsModal,
  },
  methods: {
    toggle() {
      this.showModal = !this.showModal
    },
    onUserInteractionCompleted(e) {
      console.log(`onUserInteractionCompleted: ${JSON.stringify(e)}`)
      this.toggle()
      if (e.action == 'resellAntique') {
        this.$emit('resellAntique', e.antiqueId)
      }
    },
  },
}
</script>

<style scoped>
img {
  object-fit: contain;
  max-width: 100%;
  max-height: 360px;
  width: auto;
  height: auto;
}
</style>
