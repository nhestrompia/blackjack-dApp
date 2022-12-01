import React, { useState, useEffect, useRef } from "react"
import { BigNumber, Contract, ethers, providers, utils } from "ethers"
import {
  BLACKJACK_CONTRACT_ABI,
  BLACKJACK_CONTRACT_ADDRESS,
} from "../../constants/index"
import Image from "next/image"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { setTimeout } from "timers/promises"
import { Modal } from "./Modal"

interface IProps {
  library: ethers.providers.Web3Provider
  account: string
}

interface TransactionResponse {
  hash: string
}

export const Game: React.FC<IProps> = ({ library, account }) => {
  const [playerSum, setPlayerSum] = useState<number>(0)
  const [houseSum, setHouseSum] = useState<number>(0)
  const [playerCards, setPlayerCards] = useState<string[]>([])
  const [houseCards, setHouseCards] = useState<string[]>([])
  const [isGameActive, setIsGameActive] = useState<boolean>(false)
  const [aceNumberPlayer, setAceNumberPlayer] = useState<number>(0)
  const [aceNumberHouse, setAceNumberHouse] = useState<number>(0)
  const [currentDeck, setCurrentDeck] = useState<string[]>([])
  const [isStand, setIsStand] = useState(false)
  const [score, setScore] = useState<number>()
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [roundText, setRoundText] = useState<string[]>([])
  const [isCanWithdraw, setIsCanWithdraw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isGameEnded, setIsGameEnded] = useState<boolean>(false)

  const effectRan = useRef(false)

  useEffect(() => {
    if (effectRan.current === false) {
      setRoundText([])
      setIsCanWithdraw(false)
      setIsGameActive(false)
      setIsGameEnded(false)
      setPlayerCards([])
      setHouseCards([])
      setHouseSum(0)
      setPlayerSum(0)
      setAceNumberPlayer(0)
      setAceNumberHouse(0)
    }
    return () => {
      effectRan.current = true
    }
  }, [])

  useEffect(() => {
    if (!account) {
      setRoundText(["Connect", "Wallet"])
    } else {
      setRoundText([])
    }
  }, [account])

  const deck: string[] = []

  const withdrawBet = async () => {
    try {
      setLoading(false)
      const signer = library?.getSigner()

      const blackjackContract = new Contract(
        BLACKJACK_CONTRACT_ADDRESS,
        BLACKJACK_CONTRACT_ABI,
        signer
      )
      if (score! > 0) {
        const tx: TransactionResponse = await toast.promise(
          blackjackContract.withdrawBet(ethers.utils.parseEther("0.02")),

          {
            pending: "Withdrawing...",
            success: "Withdrew succesfully",
            error: "Something went wrong 🤯",
          }
        )
        const confirmation = await library.waitForTransaction(tx.hash)
      } else if (score == 0) {
        const tx: TransactionResponse = await toast.promise(
          blackjackContract.withdrawBet(ethers.utils.parseEther("0.01")),

          {
            pending: "Withdrawing...",
            success: "Withdrew succesfully",
            error: "Something went wrong 🤯",
          }
        )
        const confirmation = await library.waitForTransaction(tx.hash)
      }
      setRoundText(["Play", "Again"])
      setIsGameEnded(false)
      setIsCanWithdraw(false)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (isGameEnded === true) {
      unlockBet()
      window.setTimeout(() => {
        if (score! > 0) {
          toast.info(
            "You have won the game and extra 0.01 ETH! Wait for withdraw button to come",
            {
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: 0,
            }
          )
          setRoundText(["Wait for", `Evaluation`])
        } else if (score === 0) {
          toast.info(
            "It was a close game but it ended in tie. Wait for withdraw button to come to get back your initial bet",
            {
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: 0,
            }
          )
          setRoundText(["Wait for", `Evaluation`])
        } else {
          toast.info(
            "It was a close game but you have lost it. Play again to earn back your 0.01 ETH ",
            {
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: 0,
            }
          )
          setRoundText(["Wait for", `Evaluation`])
        }
        setIsGameActive(false)
        setLoading(true)
      }, 2000)
    }
  }, [isGameEnded])

  useEffect(() => {
    if (isGameActive === false) {
      setPlayerCards([])
      setHouseCards([])
    }
  }, [isGameActive])

  const unlockBet = async () => {
    try {
      const signer = new ethers.Wallet(
        process.env.NEXT_PUBLIC_PRIVATE_KEY!,
        library
      )

      const signerAddress = signer.getAddress()

      const blackjackContract = new Contract(
        BLACKJACK_CONTRACT_ADDRESS,
        BLACKJACK_CONTRACT_ABI,
        signer
      )
      if (score! > 0) {
        const data = {
          from: signerAddress,
          to: BLACKJACK_CONTRACT_ADDRESS,
          value: ethers.utils.parseEther("0.01"),
        }

        const tx: TransactionResponse = await signer.sendTransaction(data)

        const confirmation = await library.waitForTransaction(tx.hash)

        const endGame: TransactionResponse = await blackjackContract.endGame(
          account,
          ethers.utils.parseEther("0.02")
        )
        const endGameReceipt = await library.waitForTransaction(endGame.hash)

        setIsCanWithdraw(true)
      } else if (score === 0) {
        const endGame: TransactionResponse = await blackjackContract.endGame(
          account,
          ethers.utils.parseEther("0.01")
        )
        const endGameReceipt = await library.waitForTransaction(endGame.hash)

        setIsCanWithdraw(true)
      } else {
        const endGame: TransactionResponse = await blackjackContract.endGame(
          account,
          ethers.utils.parseEther("0.00")
        )
        const endGameReceipt = await library.waitForTransaction(endGame.hash)

        setIsCanWithdraw(false)
      }
      setRoundText(["Play", "Again"])
    } catch (err) {
      console.error(err)
    }
  }

  const constructDeck = () => {
    const cardValues: string[] = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ]
    const cardTypes: string[] = ["D", "C", "H", "S"]

    for (let i = 0; i < cardTypes.length; i++) {
      for (let j = 0; j < cardValues.length; j++) {
        deck.push(cardValues[j] + "-" + cardTypes[i])
      }
    }

    for (let i = 0; i < deck.length; i++) {
      const randomNumber = Math.floor(Math.random() * deck.length)
      const currentCard = deck[i]
      deck[i] = deck[randomNumber] ?? ""
      deck[randomNumber] = currentCard ?? ""
    }
    setCurrentDeck(deck)
    return deck
  }

  const getCard = (deckData: string[]) => {
    if (playerSum >= 21) {
      toast.error("You can't get more cards", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
      })
    } else {
      const tempDeck = deckData
      let playerValue = 0
      const playerCard = tempDeck.pop()
      const cardImage = `/${playerCard}.png`
      const value = getValue(playerCard!)
      playerValue += value!
      if (value == 11) {
        setAceNumberPlayer((prevState) => prevState + 1)
      }
      setPlayerCards((prevState) => [...prevState!, cardImage])
      setPlayerSum((prevState) => prevState + playerValue)
      setCurrentDeck(tempDeck)
    }
  }

  useEffect(() => {
    checkAce()
  }, [playerSum])

  const dealCards = (deckData: string[]) => {
    if (deckData.length >= 4) {
      setRoundText([])

      setAceNumberHouse(0)
      setAceNumberPlayer(0)

      setIsStand(false)
      let houseValue = 0
      const housecurrentCards: string[] = []
      for (let i = 0; i < 2; i++) {
        const dealerCard = deckData?.pop()

        const cardImage = `/${dealerCard}.png`

        const value = getValue(dealerCard!)
        houseValue += value!
        housecurrentCards.push(cardImage)
        if (value == 11) {
          setAceNumberHouse((prevState) => prevState + 1)
        }
      }

      while (houseValue < 17) {
        if (deckData.length === 2) {
          break
        }
        const dealerCard = deckData.pop()
        const cardImage = `/${dealerCard}.png`
        housecurrentCards.push(cardImage)

        const value = getValue(dealerCard!)
        if (value == 11) {
          setAceNumberHouse((prevState) => prevState + 1)
        }

        houseValue += value!
      }

      setHouseSum((prevState) => prevState + houseValue)
      setHouseCards(housecurrentCards)

      let playerValue = 0
      const playerCurrentCards: string[] = []

      for (let i = 0; i < 2; i++) {
        const playerCard = deckData.pop()
        const cardImage = `/${playerCard}.png`
        playerCurrentCards.push(cardImage)
        const value = getValue(playerCard!)
        playerValue += value!
        if (value == 11) {
          setAceNumberPlayer((prevState) => prevState + 1)
        }
      }

      setPlayerCards(playerCurrentCards)
      setPlayerSum(playerValue)
      setCurrentDeck(deckData)

      if (deckData.length <= 4 && playerCards.length < 2) {
        setIsGameActive(false)
        setIsStand(true)
        toast.error("No more cards left. This is the final round!", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
        })
      }
    } else {
      setIsGameActive(false)
    }
  }

  const checkAce = () => {
    if (playerSum > 21 && aceNumberPlayer !== 0) {
      setPlayerSum((prevState) => prevState - 10)

      setAceNumberPlayer((prevState) => prevState - 1)

      return true
    }
    if (houseSum > 21 && aceNumberHouse !== 0) {
      setHouseSum((prevState) => prevState - 10)

      setAceNumberHouse((prevState) => prevState - 1)
      return true
    }
  }

  const getWinner = () => {
    setIsStand(true)
    if (playerSum > 21) {
      setRoundText(["You", "Lost!"])
      setScore((prevState) => prevState! - 1)
    } else if (houseSum > 21) {
      setRoundText(["You", "Won!"])

      setScore((prevState) => prevState! + 1)
    } else if (playerSum == houseSum) {
      setRoundText(["It's a", "Tie!"])
    } else if (playerSum > houseSum) {
      setRoundText(["You", "Won"])

      setScore((prevState) => prevState! + 1)
    } else if (playerSum < houseSum) {
      setRoundText(["You", "Lost!"])

      setScore((prevState) => prevState! - 1)
    }
    setPlayerSum(0)
    setHouseSum(0)
    const tempDeck = currentDeck

    if (tempDeck.length >= 4) {
      window.setTimeout(() => {
        dealCards(tempDeck)
      }, 2000)
    } else {
      setIsGameEnded(true)
    }
  }

  useEffect(() => {
    if (currentDeck.length <= 4) {
      setIsGameActive(false)
    }
  }, [currentDeck])

  const getValue = (card: string) => {
    const data = card?.split("-")
    const value = data[0]

    const check = /\d/.test(value!)

    if (check == false) {
      if (value == "A") {
        return 11
      }
      return 10
    } else {
      return parseInt(value!)
    }
  }

  const startGame = async () => {
    try {
      const signer = library?.getSigner()

      const blackjackContract = new Contract(
        BLACKJACK_CONTRACT_ADDRESS,
        BLACKJACK_CONTRACT_ABI,
        signer
      )

      const tx: TransactionResponse = await toast.promise(
        blackjackContract.startGame({
          value: ethers.utils.parseEther("0.01"),
        }),

        {
          pending: "Sending transaction...",
          success: "Starting the game",
          error: "Something went wrong 🤯",
        }
      )

      setLoading(true)

      const confirmation = await library.waitForTransaction(tx.hash)

      setLoading(false)
      const tempDeck = constructDeck()
      setScore(0)
      setIsGameActive(true)
      setIsCanWithdraw(false)

      dealCards(tempDeck)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <div
        className=" md:grid  mt-20   md:grid-cols-3 md:-mt-12 justify-center items-center "
        id="page"
      >
        <div className=" lg:col-start-1 pt-5 md:mt-0 items-center flex flex-col ">
          {isGameActive ? (
            <h1 className="text-3xl pb-4 ">Player score : {score}</h1>
          ) : isGameEnded ? (
            <h1 className="text-3xl pb-5 ">Player score : {score}</h1>
          ) : (
            ""
          )}
          <h1></h1>

          {!isCanWithdraw && roundText[0] !== "Wait for" && account && (
            <button
              className={`${
                isGameActive ? "hidden" : "md:mt-4"
              } p-4 mb-4 hover:scale-110 transition duration-200`}
              onClick={() => setIsModalOpen((prevState) => !prevState)}
            >
              <Image
                src={"/start.svg"}
                width={120}
                height={120}
                layout={"fixed"}
              />
            </button>
          )}
          {isCanWithdraw && score! >= 0 && (
            <button
              className={`${
                isGameActive ? "mt-8" : ""
              } hover:scale-110 transition duration-200`}
              onClick={withdrawBet}
            >
              <Image
                className=" "
                src={"/withdraw.svg"}
                width={120}
                height={120}
                layout={"fixed"}
              />
            </button>
          )}
        </div>
        <div className=" md:col-start-2 flex flex-col justify-center items-center">
          <h1 className=" p-1 text-2xl font-roboto mt-2 mb-6">Dealer</h1>
          <div className="flex flex-wrap lg:flex-nowrap justify-evenly lg:row-start-1 md:flex-row md:justify-center items-center md:gap-10 ">
            {houseCards?.length !== 0 ? (
              houseCards?.map((card, index) => {
                if (index == 0) {
                  return (
                    <div
                      className={`${
                        isStand ? "transition translate-x-1 duration-300" : ""
                      }`}
                      key={index}
                    >
                      <Image
                        src={isStand ? card : "/back.png"}
                        layout="fixed"
                        width={160}
                        height={220}
                        priority
                      />
                    </div>
                  )
                } else {
                  return (
                    <div
                      key={index}
                      className={`${
                        index !== 0 ? "-ml-[8rem] md:-ml-[10.5rem]" : ""
                      }  `}
                    >
                      <Image
                        src={card}
                        layout="fixed"
                        width={160}
                        height={220}
                        priority
                      />
                    </div>
                  )
                }
              })
            ) : (
              <div className="flex gap-10">
                <Image
                  src={"/back.png"}
                  layout="fixed"
                  width={160}
                  height={220}
                  loading="lazy"
                />

                <Image
                  src={"/back.png"}
                  layout="fixed"
                  width={160}
                  height={220}
                  loading="lazy"
                />
              </div>
            )}
          </div>

          <Modal
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            startGame={startGame}
          />
          <div className="flex flex-row w-full -my-2 justify-evenly items-center ">
            {roundText && !loading && (
              <span
                className={` text-3xl w-1/3 text-right ${
                  roundText[0] === "It's a" ? "" : ""
                }  mt-4 font-sans  `}
              >
                {roundText[0]}
              </span>
            )}
            <div
              className={`${roundText ? "" : " "} ${
                roundText && roundText[0] === "It's a" ? "" : ""
              } mt-4 md:mt-10 w-1/3 ${
                loading ? "opacity-60" : "opacity-20"
              } mb-5 md:mb-0 flex justify-center `}
            >
              <Image
                className={`${loading ? "animate-spin " : ""}`}
                src={"/logo.svg"}
                width={loading ? 90 : 56}
                height={89}
                layout={"fixed"}
              />
            </div>
            {roundText && !loading && (
              <span className={` text-3xl w-1/3 font-sans mt-4`}>
                {roundText![1]}
              </span>
            )}
          </div>
          <div className="flex justify-evenly md:flex-row md:justify-center items-center  md:gap-10 md:mt-10 md:mb-4">
            {playerCards.length !== 0 ? (
              playerCards.map((card, index) => {
                return (
                  <div
                    key={index}
                    className={` ${
                      index !== 0 ? "-ml-[8rem] md:-ml-[10.5rem]" : ""
                    }  flex gap-10  `}
                  >
                    <Image
                      src={card}
                      layout="fixed"
                      width={160}
                      height={220}
                      priority
                    />
                  </div>
                )
              })
            ) : (
              <div className="flex gap-10">
                <Image
                  src={"/back.png"}
                  layout="fixed"
                  width={160}
                  height={220}
                  loading="lazy"
                />

                <Image
                  src={"/back.png"}
                  layout="fixed"
                  width={160}
                  height={220}
                  loading="lazy"
                />
              </div>
            )}
          </div>
          <h1 className="mt-2 font-roboto text-2xl">Player - {playerSum}</h1>
        </div>

        <div className="col-start-2  md:row-start-3 lg:row-start-1 lg:col-start-3   mt-4 md:mt-8 mr-4 md:mr-0 gap-4  flex justify-center  items-center  lg:mr-0 lg:flex-col lg:content-end">
          {isGameActive && playerSum > 0 && (
            <button
              className="lg:px-8 hover:scale-110 mx-2 transition duration-200"
              onClick={getWinner}
            >
              <Image
                src={"/stand.svg"}
                width={120}
                height={120}
                layout={"fixed"}
              />
            </button>
          )}
          {isGameActive && playerSum > 0 && currentDeck.length > 0 && (
            <button
              className={`${
                playerSum >= 21 ? "cursor-not-allowed " : "cursor-pointer"
              } hover:scale-110 transition duration-200`}
              onClick={() => getCard(currentDeck)}
            >
              <Image
                src={"/hit.svg"}
                width={120}
                height={120}
                layout={"fixed"}
              />
            </button>
          )}
        </div>
      </div>
      <ToastContainer
        position="top-center"
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
      />
    </>
  )
}
