import React, { useEffect } from "react"
import Web3Modal from "web3modal"
import truncateEthAddress from "truncate-eth-address"
import { BigNumber, Contract, ethers, providers, utils } from "ethers"
import { NextRouter, useRouter } from "next/router"

import WalletConnect from "@walletconnect/web3-provider"

interface IProps {
  account: string
  setAccount: (val: string) => void

  setProvider: any
  provider: any
  library: ethers.providers.Web3Provider
  setLibrary: (val: ethers.providers.Web3Provider) => void
}

const providerOptions = {
  walletconnect: {
    package: WalletConnect, // required
    options: {
      infuraId: process.env.NEXT_PUBLIC_INFURA_ID, // required
    },
  },
}

export const Wallet: React.FC<IProps> = ({
  account,
  setAccount,

  setProvider,
  provider,
  setLibrary,
  library,
}) => {
  const router = useRouter()

  let web3Modal: Web3Modal | null
  if (typeof window !== "undefined") {
    web3Modal = new Web3Modal({
      providerOptions, // required
      cacheProvider: true, //optional
    })
  }

  const changeNetwork = async () => {
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: "0x5",
          },
        ],
      })
      router.reload()
    } catch (err: any) {
      console.error(err.message)
    }
  }

  const handleNetworkSwitch = async () => {
    await changeNetwork()
  }

  const refreshState = () => {
    setAccount("")
  }

  useEffect(() => {
    if (web3Modal?.cachedProvider) {
      connectWallet()
    }
  }, [])

  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts) {
          setAccount(accounts[0]!)

          connectWallet()
        }
      }

      const handleDisconnect = () => {
        disconnect()
      }

      provider.on("accountsChanged", handleAccountsChanged)

      provider.on("disconnect", handleDisconnect)

      provider.on("chainChanged", handleNetworkSwitch)

      return () => {
        if (provider.removeListener) {
          provider.removeListener("accountsChanged", handleAccountsChanged)

          provider.removeListener("disconnect", handleDisconnect)

          provider.removeListener("chainChanged", handleNetworkSwitch)
        }
      }
    }
  }, [provider])

  const disconnect = async () => {
    await web3Modal?.clearCachedProvider()
    refreshState()
  }

  const connectWallet = async () => {
    try {
      const provider = await web3Modal?.connect()

      const library = new ethers.providers.Web3Provider(provider)
      const accounts: string[] = await library.listAccounts()

      const { chainId } = await library.getNetwork()

      setProvider(provider)
      setLibrary(library)

      const signer = library.getSigner()

      if (accounts) {
        setAccount(accounts[0]!)

        if (chainId !== 5) {
          await changeNetwork()
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      {account ? (
        <button
          className="focus:outline-none font-roboto  text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-3 md:mr-0 bg-[#ea5959] hover:bg-[#de4646] focus:ring-blue-800"
          onClick={disconnect}
        >
          {truncateEthAddress(account)}
        </button>
      ) : (
        <button
          className="focus:outline-none font-roboto  text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-3 md:mr-0 bg-[#ea5959] hover:bg-[#de4646] focus:ring-blue-800"
          onClick={connectWallet}
        >
          Connect Wallet
        </button>
      )}
    </div>
  )
}
