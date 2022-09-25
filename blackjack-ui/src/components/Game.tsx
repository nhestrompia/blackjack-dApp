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

  const effectRan = useRef(false)

  useEffect(() => {
    if (effectRan.current === false) {
      setRoundText([])
      setIsCanWithdraw(false)
      setIsGameActive(false)
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

  const deck: string[] = []

  const withdrawBet = async () => {
    try {
      const signer = library?.getSigner()

      const blackjackContract = new Contract(
        BLACKJACK_CONTRACT_ADDRESS,
        BLACKJACK_CONTRACT_ABI,
        signer
      )
      if (score! > 0) {
        const tx = await toast.promise(
          blackjackContract.withdrawBet(ethers.utils.parseEther("0.02")),

          {
            pending: "Withdrawing...",
            success: "Withdrew succesfully",
            error: "Something went wrong 🤯",
          }
        )
      } else if (score == 0) {
        const tx = await toast.promise(
          blackjackContract.withdrawBet(ethers.utils.parseEther("0.01")),

          {
            pending: "Withdrawing...",
            success: "Withdrew succesfully",
            error: "Something went wrong 🤯",
          }
        )
        toast.info("Game Over. If you want to play again press Start Game", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
        })
      }
      setIsCanWithdraw(false)
    } catch (err) {
      console.error(err)
    }
  }

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

      const blackjackContract = new Contract(
        BLACKJACK_CONTRACT_ADDRESS,
        BLACKJACK_CONTRACT_ABI,
        signer
      )
      if (score! > 0) {
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
        const endGame = await blackjackContract.endGame(
          account,
          ethers.utils.parseEther("0.00")
        )
        setIsCanWithdraw(false)
      }
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
    const checkingAce = checkAce()

    if (playerSum >= 21 && !checkingAce) {
      window.setTimeout(() => {
        getWinner()
      }, 3000)
    }
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
        unlockBet()
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
      setRoundText(["Game", "Over"])
      setIsGameActive(false)
      unlockBet()
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
      const tempDeck = constructDeck()
      setScore(0)
      setIsGameActive(true)
      setIsCanWithdraw(false)

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
          {isGameActive && (
            <h1 className="text-2xl  -mt-8">Player score : {score}</h1>
          )}
          <h1></h1>

          {!isCanWithdraw && (
            <button
              className={`${
                isGameActive ? "hidden" : "mt-4"
              } p-4 hover:scale-110 transition duration-200`}
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
          <h1 className=" p-1 text-2xl font-roboto mt-2 mb-8">Dealer</h1>
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
                        height={200}
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
                        height={200}
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
                  height={200}
                  loading="lazy"
                />

                <Image
                  src={"/back.png"}
                  layout="fixed"
                  width={160}
                  height={200}
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
          <div className="flex flex-row w-full justify-evenly items-center ">
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
              } mt-10 w-1/3 ${
                loading ? "opacity-60" : "opacity-20"
              }  flex justify-center `}
            >
              {loading ? (
                <svg
                  aria-hidden="true"
                  className="mb-2 w-16 h-16 text-gray-200 animate-spin  fill-blue-500"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
              ) : (
                <Image
                  src={"/logo.svg"}
                  width={56}
                  height={89}
                  layout={"fixed"}
                />
              )}
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
          <h1 className="mt-1 font-roboto text-2xl">Player - {playerSum}</h1>
        </div>

        <div className="col-start-2  md:row-start-3 lg:row-start-1 lg:col-start-3   mt-4 mr-4 md:mr-0   flex justify-center  items-center  lg:mr-0 lg:flex-col lg:content-end">
          {isGameActive && playerSum > 0 && playerSum < 21 && (
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
