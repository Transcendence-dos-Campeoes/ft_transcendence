//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract tournamentResults is Ownable {

    struct tournamentDetails {
        uint256 id;
        string winner;
    }

    mapping(uint256 => tournamentDetails) public tournamentsMap;

    constructor() Ownable(msg.sender) {
        // The Ownable constructor will use msg.sender as the initialOwner automatically.
    }

    function storeTournamentDetails(uint256 id, string memory winner ) public onlyOwner {
        tournamentsMap[id].id = id;
        tournamentsMap[id].winner = winner;
    }

    function getTournamentDetails(uint256 id) external view returns (tournamentDetails memory)
    {
        return tournamentsMap[id];
    }
}