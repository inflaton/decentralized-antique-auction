# Decentralized Antique Auction

This sample dApp is the companion project of my blog 
<a href="https://mirror.xyz/0x90f2036E332dfAD451ba9E9C82366F4ba79173d8/aNVjOguN1DyT4vzUQTd74131lAYSIGmxSZu3nR2ST9M" target="_blank">Web3 POC - Decentralized Antique Auction</a>
. It uses [Vue.js](https://vuejs.org/) for developing SPA as front-end and Truffle & Solidity for developing Smart Contract as backend.

Please refer to the following steps to deploy this DApp on EVM-compliant testnets and IPFS.

### 1. NodeJS version 16 or above
```
node -v
v16.15.0
```

### 2. Deploy smart contracts

Install dependencies
```
cd smart-contracts
yarn install
```

Set up environment variables in .env
```
cp .env.example .env
cat .env
INFURA_API_KEY=
METER_PRIVATE_KEY=
ROPSTEN_PRIVATE_KEY=
RINKEBY_PRIVATE_KEY=
RINKARBY_PRIVATE_KEY=
POLYGON_PRIVATE_KEY=
KOVAN_PRIVATE_KEY=
OPTIMISM_KOVAN_PRIVATE_KEY=
GOERLI_PRIVATE_KEY=
```

* INFURA_API_KEY can be obtained from any registered Infura developer account - just to make sure to enable L2 networks Optimism Kovan and Arbitrum Rinkeby (RinkArby), which requires a credit card to be added.

* *_PRIVATE_KEY would be the private keys used by Truffle to deploy smart contracts to different testnets - make sure the accounts have enough balances to cover the transaction fees required for deployment.

* 8 public testnets are configured in package.json and truffle-config.json. 
  * Layer 1 (L1)
    * Ropsten
    * Rinkeby
    * Kovan
    * Goerli
  * Layer 2 (L2)
    * Arbitrum Rinkeby
    * Optimism Kovan
  * Sidechain
    * Poloygon Mumbai
    * Meter

E.g., to deploy to Rinkeby, run
```
yarn deploy:rinkeby
```

To deploy to all 8 testnets, run
```
yarn deploy:all
```

### 3. Set up front-end

Install dependencies
```
cd ..
yarn install
```

Set up environment variables in .env
```
cp .env.example .env
cat .env
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
VITE_PINATA_API_KEY=
VITE_PINATA_SECRET_API_KEY=
IPFS_DEPLOY_PINATA__API_KEY=
IPFS_DEPLOY_PINATA__SECRET_API_KEY=
```

* PINATA_API_KEY and PINATA_SECRET_API_KEY can be obtained from any registered Pinata developer account - VITE* variables are used by SPA while IPFS* are used for deployment to IPFS.

Run DApp UI
```
yarn install
yarn dev
```

Navigate to http://localhost:3000/ to see the app running. 

To run at a different port, create a file .env.local and define the port there: 
```
cat .env.local
PORT=3001
```

For production build, run
```
yarn build
```

The generated folder dist/ can be deployed to any hosting environment as a static website. E.g, to run in Node express server:

```
const express = require('express')
const app = express()
const staticPath = __dirname + '/../dist'
app.use(express.static(staticPath))
```

Refer to server/index.js for more details.

For IFPS deployment, run:
```
yarn deploy
```
