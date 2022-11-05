require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config({ path: ".env" })

/** @type import('hardhat/config').HardhatUserConfig */

const QUICKNODE_HTTP_URL = process.env.QUICKNODE_HTTP_URL
const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY

module.exports = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      // url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      url: QUICKNODE_HTTP_URL,
      accounts: [GOERLI_PRIVATE_KEY],
    },
  },
}
