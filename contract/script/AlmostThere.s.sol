// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {AlmostThere} from "../src/AlmostThere.sol";

contract AlmostThereScript is Script {
    AlmostThere public almostThere;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // Deploy the AlmostThere contract
        almostThere = new AlmostThere();

        console2.log("AlmostThere contract deployed at:", address(almostThere));
        console2.log("Owner address:", almostThere.owner());
        console2.log("Game counter:", almostThere.gameCounter());

        // Example: Create a sample game (24 hours duration, 0.1 ETH per guess, 10x10 grid, random treasure)
        // Uncomment the lines below if you want to create a sample game during deployment

        /*
        uint256 duration = 24 hours;
        uint256 guessCost = 0.1 ether;
        uint256 gridWidth = 10;
        uint256 gridHeight = 10;
        uint256 maxGuessPercentage = 50; // 50% of grid spaces

        uint256 gameId = almostThere.createGame(
            duration,
            guessCost,
            gridWidth,
            gridHeight,
            maxGuessPercentage
        );

        console2.log("Sample game created with ID:", gameId);
        console2.log("Treasure coordinates will be randomly placed and revealed after game ends");

        (
            uint256 returnedGameId,
            uint256 endTime,
            uint256 gameGuessCost,
            uint256 gameGridWidth,
            uint256 gameGridHeight,
            uint256 maxGuessesPerPlayer,
            uint256 totalPot,
            bool isActive,
            bool isFinalized,
            uint256 playerCount,
            uint256 totalGuesses,
            bool treasureRevealed
        ) = almostThere.getGameInfo(gameId);

        console2.log("Game Info:");
        console2.log("  Game ID:", returnedGameId);
        console2.log("  End Time:", endTime);
        console2.log("  Cost per Guess:", gameGuessCost);
        console2.log("  Grid Size:", gameGridWidth, "x", gameGridHeight);
        console2.log("  Max Guesses per Player:", maxGuessesPerPlayer);
        console2.log("  Total Pot:", totalPot);
        console2.log("  Is Active:", isActive);
        console2.log("  Is Finalized:", isFinalized);
        console2.log("  Player Count:", playerCount);
        console2.log("  Total Guesses Purchased:", totalGuesses);
        console2.log("  Treasure Revealed:", treasureRevealed);
        console2.log("  NOTE: Each guess costs the specified amount!");
        */

        vm.stopBroadcast();
    }
}
