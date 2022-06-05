import axios from 'axios'
import pinataSDK from '@pinata/sdk'

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY
const pinata = pinataSDK(PINATA_API_KEY, PINATA_SECRET_API_KEY)

const createNFTMetaDataURI = async function (nftData, callback) {
  const nftMetaData = nftData.metaData
  console.log(nftMetaData)

  // convert file into binary
  const data = new FormData()
  data.append('title', nftMetaData.image.name)
  data.append('file', nftMetaData.image)

  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS'
  // pass binary data into post request
  const result = await axios.post(url, data, {
    maxContentLength: -1,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET_API_KEY,
      path: 'd-antique-auction',
    },
  })

  // console.log("RESULT", result);
  nftMetaData.image = `ipfs://${result.data.IpfsHash}`

  //Call Pinata to get NFT metadata uri
  const options = {
    pinataMetadata: {
      name: nftMetaData.name,
    },
    pinataOptions: {
      cidVersion: 0,
    },
  }

  pinata
    .pinJSONToIPFS(nftMetaData, options)
    .then((result) => {
      //handle results here
      console.log(`pinJSONToIPFS:\n${JSON.stringify(result, 0, 2)}`)
      const uri = 'ipfs://' + result.IpfsHash
      callback(uri)
    })
    .catch((err) => {
      //handle error here
      console.error(err)
      throw err
    })
}

export default createNFTMetaDataURI
