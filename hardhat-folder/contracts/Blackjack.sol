// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;


import "@openzeppelin/contracts/access/Ownable.sol";



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

    address public casinoAddress = payable(0xB402f112a2C8BF41739129F69c52bb97Eb95119a);

    uint256 public betAmount = 0.01 ether;



    mapping (address => Player) public players;

    function changeAddress(address _casinoAddress) public onlyOwner{
      casinoAddress = _casinoAddress;
    }

    function changeBetAmount(uint256 _bet) public onlyOwner{
      betAmount = _bet;
    }


     function withdrawSafe(uint256 _amount) public onlyOwner{
      require(address(this).balance >= _amount,"Not enough in the safe");
      (bool sent, bytes memory data) = msg.sender.call{value: _amount}("");
        require(sent, "Failed to send Ether");

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