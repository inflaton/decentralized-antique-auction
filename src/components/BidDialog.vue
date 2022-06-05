<template>
  <div class="modal-mask">
    <div class="center">
      <div class="form-group">
        <label for="newBid">{{ text }}</label>
        <input type="text" class="form-control" v-model="newBid" />
      </div>
      <button @click="closeDialog(false)" class="btn">Cancel</button>
      <button @click="closeDialog(newBid)" class="btn">Confirm</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { closeDialog } from 'vue3-promise-dialog'

export default defineComponent({
  props: {
    text: String,
    bid: String,
  },
  setup(props) {
    function returnValue() {
      return true
    }
    const newBid = props.bid;
    return {
      returnValue,
      closeDialog,
      newBid
    }
  },
})
</script>

<style scoped>
.dialog {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.3);
}

.center {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
}

.btn {
  margin: 10px;
}
</style>
