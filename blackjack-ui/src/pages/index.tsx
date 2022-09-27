import type { NextPage } from "next"
import Head from "next/head"
import { useState } from "react"
import { Wallet } from "../components/Wallet"

import { Game } from "../components/Game"
import { BigNumber, Contract, ethers, providers, utils } from "ethers"

const Home: NextPage = () => {
  const [library, setLibrary] = useState<ethers.providers.Web3Provider>()
  const [account, setAccount] = useState<string>("")
  const [provider, setProvider] = useState()

  return (
    <div className="">
      <Head>
        <title>Blackjack dApp</title>
        <meta name="description" content="blackjack dApp" />
      </Head>

      <main className="bg-[#144b1e]  pb-1 text-white">
        <nav className="px-8 md:px-2 fixed w-full z-20 top-0 left-0 py-3.5    ">
          <div className="container   flex flex-wrap justify-between items-center mx-auto">
            <h1 className="text-2xl  leading-normal font-bold  ">Blackjack</h1>
            <Wallet
              account={account}
              setAccount={setAccount}
              setProvider={setProvider}
              provider={provider}
              setLibrary={setLibrary}
              library={library!}
            />
          </div>
        </nav>
        <div className="md:mt-20 lg:mt-12">
          <Game library={library!} account={account} />
        </div>
      </main>
    </div>
  )
}

export default Home
