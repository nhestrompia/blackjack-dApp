import React from "react"

interface IProps {
  isModalOpen: boolean
  setIsModalOpen: (val: boolean) => void
  startGame: () => void
}

export const Modal: React.FC<IProps> = ({
  isModalOpen,
  setIsModalOpen,
  startGame,
}) => {
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (event?.target instanceof Element && event.target.id === "background") {
      setIsModalOpen(false)
    }
  }

  if (!isModalOpen) {
    return null
  } else {
    return (
      <div
        onClick={handleClick}
        id="background"
        className="fixed inset-0 z-20 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center"
      >
        <div id="modal" className=" ">
          <div className="relative  p-4 w-full max-w-md h-1/2 md:h-auto">
            <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
              <div className="flex justify-center text-center items-center p-5 rounded-t border-b dark:border-gray-600">
                <h3 className="text-xl font-medium text-gray-900  dark:text-white">
                  Game Rules
                </h3>

                <button
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  data-modal-toggle="small-modal"
                >
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>

              <ul className="p-6 space-y-6">
                <li className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                  Entry fee is 0.01 Goerli ETH.
                </li>

                <li className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                  If your game score is positive then you will win the game and
                  get extra 0.01 Goerli ETH.
                </li>
                <li className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                  Game continues till one deck (52 cards) is finished. I guess
                  you can count cards easily on this game.
                </li>
              </ul>

              <div className="flex justify-center items-center p-6 space-x-2 rounded-b border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => {
                    startGame()
                    setIsModalOpen(false)
                  }}
                  data-modal-toggle="small-modal"
                  type="button"
                  className="text-white bg-[#d94d4d] hover:bg-[#b32d2d]  focus:outline-none  font-medium rounded-lg text-sm px-5 py-2.5 text-center "
                >
                  Start Game
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
