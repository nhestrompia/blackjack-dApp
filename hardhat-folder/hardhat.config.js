require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config({ path: ".env" })

/** @type import('hardhat/config').HardhatUserConfig */

const QUICKNODE_HTTP_URL = process.env.QUICKNODE_HTTP_URL
const account = process.env.GOERLI_PRIVATE_KEY

module.exports = {
  solidity: "0.8.6",
  networks: {
    testnet: {
      url: QUICKNODE_HTTP_URL,
      accounts: [account],
    },
  },
}
