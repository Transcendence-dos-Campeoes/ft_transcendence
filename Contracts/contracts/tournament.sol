pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract tournamentResults is Ownable {

    struct tournamentDetails {
        uint256 id;
        string player1;
        string player2;
        uint256 pointsPlayer1;
        uint256 pointsPlayer2;
    }

    mapping(uint256 => tournamentDetails) public tournamentsMap;

    constructor() Ownable(msg.sender) {
        // The Ownable constructor will use msg.sender as the initialOwner automatically.
    }

    function storeTournamentDetails(uint256 id, string memory player1, string memory player2 , uint256 pointsTeamA, uint256 pointsTeamB ) public onlyOwner {
        tournamentsMap[id].id = id;
        tournamentsMap[id].player1 = player1;
        tournamentsMap[id].player2 = player2;
        tournamentsMap[id].pointsPlayer1 = pointsTeamA;
        tournamentsMap[id].pointsPlayer2 = pointsTeamB;
    }

    function getTournamentDetails(uint256 id) external view returns (tournamentDetails memory)
    {
        return tournamentsMap[id];
    }
}