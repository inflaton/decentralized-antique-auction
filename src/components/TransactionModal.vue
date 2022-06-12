<template>
  <div>
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
          <div class="modal-header">
            <h3>Transaction {{ transactionData.status }}</h3>
          </div>
          <div class="modal-body">
            <slot name="body">
              <h4>Method: {{ transactionData.contract.method }}</h4>
              <p>
                Transaction Details:
                <a
                  :href="transactionUrl(transactionData.txHash)"
                  target="_blank"
                >
                  {{ displayableTxHash(transactionData.txHash) }}</a
                >
              </p>
              <p v-if="transactionData.status == 'Submitted'">
                Transaction has been initiated. Waiting for confirmation ...
              </p>
              <p v-else>
                Submission:
                {{ transactionData.submissionDuration }} seconds<br />
                Confirmation:
                {{ transactionData.confirmationDuration }} seconds<br />
              </p>
              <h4 v-if="transactionData.tokenId">
                {{
                  transactionData.contract.method == 'endAuction'
                    ? 'Transferred'
                    : transactionData.contract.method == 'resellAntique'
                    ? 'Listed'
                    : 'Minted'
                }}
                Antique NFT
              </h4>
              <p v-if="transactionData.tokenId">
                Contract Address:
                <small>{{ transactionData.tokenAddress }}</small>
                <br />
                Token ID:
                {{ transactionData.tokenId }} <br />
              </p>
              <p v-if="transactionData.royaltyAmount">
                Royalty Receiver:
                <small>{{ transactionData.royaltyReceiver }}</small>
                <br />
                Royalty Amount:
                {{ displayableRoyaltyAmount() }} <br />
              </p>

              <button
                class="btn btn-outline-secondary float-right mr-3"
                v-on:click="closeModal"
              >
                Close
              </button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['transactionData'],
  methods: {
    closeModal(_e) {
      this.$emit('completed')
    },
    displayableTxHash(txHash) {
      return txHash.slice(0, 10) + '...' + txHash.slice(-6)
    },
    displayableRoyaltyAmount() {
      return `${window.bc.weiToEtherStr(this.transactionData.royaltyAmount)} `
    },
    transactionUrl(txHash) {
      return window.bc.getTransactionUrl(txHash)
    },
  },
}
</script>

<style></style>
