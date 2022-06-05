require('dotenv').config()
const pinataApiKey = process.env.VITE_PINATA_API_KEY
const pinataSecretApiKey = process.env.VITE_PINATA_SECRET_API_KEY
const axios = require('axios')
const fs = require('fs')
const FormData = require('form-data')

// console.log(`process.argv: ${JSON.stringify(process.argv)}`);

const args = process.argv.slice(2)
const filePath = args[0] || './src/assets/mc-antique.png'

console.log(`uploading file: ${filePath}`)

const pinFileToIPFS = async () => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`
  let data = new FormData()
  data.append('file', fs.createReadStream(filePath))
  const res = await axios.post(url, data, {
    maxContentLength: 'Infinity',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretApiKey,
    },
  })
  console.log(res.data)
}

pinFileToIPFS()
