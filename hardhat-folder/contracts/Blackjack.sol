// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;


import "@openzeppelin/contracts/access/Ownable.sol";


// Contract address : 0x040B4620C0889C438cFbAbe3971DB831B12629e5

contract Blackjack is Ownable {

    struct Player {
        uint256 bet;
        bool isGameActive;
        address playerAddress;
    }

    event GameStarted(
        address player,
        uint256 bet
    );


    event GameEnded(
        address player,
        uint256 totalPrize
    );

    address public casinoAddress = payable(0x664C66ece173898ea923cFA8060e9b0C6EF599aB);

    uint256 public betAmount = 0.01 ether;



    mapping (address => Player) public players;

    function changeAddress(address _casinoAddress) public onlyOwner{
      casinoAddress = _casinoAddress;
    }

    function changeBetAmount(uint256 _bet) public onlyOwner{
      betAmount = _bet;
    }


  



    function startGame() external  payable {
      require(msg.value >= betAmount, "Not enough ETH sent");
      players[msg.sender] = Player(betAmount,true,msg.sender);
      emit GameStarted(msg.sender, betAmount);

    }

    function endGame(address _player, uint256 _finalBet) public onlyOwner {
        players[_player].isGameActive = false;
        players[_player].bet = _finalBet;
    }



    receive() external payable {}
    fallback() external payable {}



    function withdrawBet(uint256 _amount) public  {
        require(players[msg.sender].playerAddress == msg.sender, "No active game has been found"  );
        require(_amount <= players[msg.sender].bet  ,"You dont have enough credit in your account");
        require(players[msg.sender].isGameActive == false, "Game is ongoing");

        (bool sent, bytes memory data) = msg.sender.call{value: _amount}("");
        require(sent, "Failed to send Ether");
        delete players[msg.sender]; 
    
        emit GameEnded(msg.sender, _amount);
    }

}