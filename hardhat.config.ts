import dotenv from 'dotenv'
import '@nomiclabs/hardhat-ethers'
import '@typechain/hardhat'
import { HardhatUserConfig } from 'hardhat/types'
import'hardhat-spdx-license-identifier'
import '@openzeppelin/hardhat-upgrades'
import "@nomiclabs/hardhat-waffle";
dotenv.config()

const privateKey = process.env.PRIVATE_KEY || '0x0123456789012345678901234567890123456789012345678901234567890123'
const nodeURL = process.env.NODE_URL

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      chainId: 1337,
    },
    local: {
      chainId: 1337,
      url: `http://127.0.0.1:8545`,
    },
    goerli: {
      url: `https://speedy-nodes-nyc.moralis.io/${nodeURL}/eth/goerli`,
      accounts: [privateKey],
    },
    avax: {
      url: `https://speedy-nodes-nyc.moralis.io/${nodeURL}/avalanche/mainnet`,
      accounts: [privateKey],
    },
  },
  defaultNetwork: 'local',
  solidity: {
    compilers: [{ version: '0.8.2', settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }}]
  }
}

export default config

'https://speedy-nodes-nyc.moralis.io/c319b6f6ccc09dcb73aadd0e/avalanche/mainnet'