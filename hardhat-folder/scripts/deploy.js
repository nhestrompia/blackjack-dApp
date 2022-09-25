const hre = require("hardhat")

async function main() {
  const [deployer] = await ethers.getSigners()
  const Blackjack = await hre.ethers.getContractFactory("Blackjack")
  const blackjack = await Blackjack.deploy()

  await blackjack.deployed()

  console.log(`Blackjack contract deployed to ${blackjack.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
