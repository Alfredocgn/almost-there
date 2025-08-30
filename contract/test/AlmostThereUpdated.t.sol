// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {AlmostThere} from "../src/AlmostThere.sol";

contract AlmostThereUpdatedTest is Test {
    AlmostThere public almostThere;
    address public owner;
    address public player1;
    address public player2;
    address public player3;

    uint256 constant GUESS_COST = 0.1 ether;
    uint256 constant GAME_DURATION = 24 hours;
    uint256 constant GRID_WIDTH = 10;
    uint256 constant GRID_HEIGHT = 10;

        event GameCreated(
        uint256 indexed gameId,
        uint256 endTime,
        uint256 guessCost,
        uint256 gridWidth,
        uint256 gridHeight,
        uint256 maxGuessesPerPlayer
    );

    event GuessesPurchased(
        uint256 indexed gameId,
        address indexed player,
        uint256 guessCount,
        uint256 totalPlayerGuesses
    );

    event GuessSubmitted(
        uint256 indexed gameId,
        address indexed player,
        uint256 guessIndex,
        uint256 guessX,
        uint256 guessY
    );

    event TreasureRevealed(
        uint256 indexed gameId,
        uint256 treasureX,
        uint256 treasureY
    );

    event GameFinalized(
        uint256 indexed gameId,
        uint256 treasureX,
        uint256 treasureY,
        address[] winners,
        uint256[] rewards
    );

    event MapInfoPurchased(
        uint256 indexed gameId,
        address indexed buyer,
        uint256 cost
    );

    function setUp() public {
        owner = address(this);
        player1 = address(0x1);
        player2 = address(0x2);
        player3 = address(0x3);

        almostThere = new AlmostThere();

        // Fund test accounts
        vm.deal(player1, 10 ether);
        vm.deal(player2, 10 ether);
        vm.deal(player3, 10 ether);
    }

        function testCreateGameWithRandomTreasure() public {
        uint256 maxGuessPercentage = 50; // 50% of grid
        uint256 expectedMaxGuesses = (GRID_WIDTH * GRID_HEIGHT * maxGuessPercentage) / 100;

        vm.expectEmit(true, false, false, true);
        emit GameCreated(1, block.timestamp + GAME_DURATION, GUESS_COST, GRID_WIDTH, GRID_HEIGHT, expectedMaxGuesses);

        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            maxGuessPercentage
        );

        assertEq(gameId, 1);
        assertEq(almostThere.gameCounter(), 1);

        (
            uint256 returnedGameId,
            uint256 endTime,
            uint256 guessCost,
            uint256 gridWidth,
            uint256 gridHeight,
            uint256 totalPot,
            bool isActive,
            bool isFinalized
        ) = almostThere.getGameInfo(gameId);

        (
            uint256 playerCount,
            uint256 totalGuesses,
            uint256 maxGuessesPerPlayer,
            bool treasureRevealed
        ) = almostThere.getGameStats(gameId);

        assertEq(returnedGameId, gameId);
        assertEq(endTime, block.timestamp + GAME_DURATION);
        assertEq(guessCost, GUESS_COST);
        assertEq(gridWidth, GRID_WIDTH);
        assertEq(gridHeight, GRID_HEIGHT);
        assertEq(maxGuessesPerPlayer, expectedMaxGuesses);
        assertEq(totalPot, 0);
        assertTrue(isActive);
        assertFalse(isFinalized);
        assertEq(playerCount, 0);
        assertEq(totalGuesses, 0);
        assertFalse(treasureRevealed);
    }

    function testBuyGuesses() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        vm.prank(player1);
        vm.expectEmit(true, true, false, true);
        emit GuessesPurchased(gameId, player1, 20, 20);

        almostThere.buyGuesses{value: GUESS_COST * 20}(gameId, 20);

        (uint256 guessCount, ) = almostThere.getPlayerInfo(gameId, player1);
        assertEq(guessCount, 20);

        uint256 maxGuesses = almostThere.getMaxGuessesForGame(gameId);
        uint256 remainingGuesses = almostThere.getRemainingGuesses(gameId, player1);
        assertEq(remainingGuesses, maxGuesses - 20);

        address[] memory players = almostThere.getGamePlayers(gameId);
        assertEq(players.length, 1);
        assertEq(players[0], player1);

        (, , , , , uint256 totalPot, , ) = almostThere.getGameInfo(gameId);
        (, uint256 totalGuesses, , ) = almostThere.getGameStats(gameId);
        assertEq(totalPot, GUESS_COST * 20);
        assertEq(totalGuesses, 20);
    }

    function testBuyMultipleGuessBatches() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        // First purchase
        vm.prank(player1);
        almostThere.buyGuesses{value: GUESS_COST * 10}(gameId, 10);

        // Second purchase
        vm.prank(player1);
        almostThere.buyGuesses{value: GUESS_COST * 15}(gameId, 15);

        (uint256 guessCount, ) = almostThere.getPlayerInfo(gameId, player1);
        assertEq(guessCount, 25);

        // Player should only appear once in players array
        address[] memory players = almostThere.getGamePlayers(gameId);
        assertEq(players.length, 1);
    }

    function testSubmitGuesses() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        vm.prank(player1);
        almostThere.buyGuesses{value: GUESS_COST * 10}(gameId, 10);

        // Create guesses array - submit 4 out of 10 purchased
        AlmostThere.Guess[] memory guesses = new AlmostThere.Guess[](4);
        guesses[0] = AlmostThere.Guess(1, 1);
        guesses[1] = AlmostThere.Guess(2, 2);
        guesses[2] = AlmostThere.Guess(3, 3);
        guesses[3] = AlmostThere.Guess(4, 4);

        vm.prank(player1);
        vm.expectEmit(true, true, false, true);
        emit GuessSubmitted(gameId, player1, 0, 1, 1);

        almostThere.submitGuesses(gameId, guesses);

        (, AlmostThere.Guess[] memory retrievedGuesses) = almostThere.getPlayerInfo(gameId, player1);
        assertEq(retrievedGuesses.length, 4);
        assertEq(retrievedGuesses[0].x, 1);
        assertEq(retrievedGuesses[0].y, 1);
        assertEq(retrievedGuesses[3].x, 4);
        assertEq(retrievedGuesses[3].y, 4);
    }

    function testSubmitGuessesTooManyForPurchased() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        vm.prank(player1);
        almostThere.buyGuesses{value: GUESS_COST * 3}(gameId, 3); // Only 3 guesses purchased

        // Try to submit 4 guesses
        AlmostThere.Guess[] memory guesses = new AlmostThere.Guess[](4);
        guesses[0] = AlmostThere.Guess(1, 1);
        guesses[1] = AlmostThere.Guess(2, 2);
        guesses[2] = AlmostThere.Guess(3, 3);
        guesses[3] = AlmostThere.Guess(4, 4);

        vm.prank(player1);
        vm.expectRevert("Too many guesses for purchased slots");
        almostThere.submitGuesses(gameId, guesses);
    }

    function testSubmitGuessesWithoutPurchasing() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        AlmostThere.Guess[] memory guesses = new AlmostThere.Guess[](1);
        guesses[0] = AlmostThere.Guess(1, 1);

        vm.prank(player1);
        vm.expectRevert("Player has no purchased guesses");
        almostThere.submitGuesses(gameId, guesses);
    }

    function testFinalizeGameWithMultipleGuesses() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        // Player 1: Buy 20 guesses, submit 6
        vm.prank(player1);
        almostThere.buyGuesses{value: GUESS_COST * 20}(gameId, 20);

        AlmostThere.Guess[] memory guesses1 = new AlmostThere.Guess[](6);
        guesses1[0] = AlmostThere.Guess(0, 0);  // Corner
        guesses1[1] = AlmostThere.Guess(5, 5);  // Center
        guesses1[2] = AlmostThere.Guess(9, 9);  // Opposite corner
        guesses1[3] = AlmostThere.Guess(1, 1);
        guesses1[4] = AlmostThere.Guess(2, 2);
        guesses1[5] = AlmostThere.Guess(3, 3);

        vm.prank(player1);
        almostThere.submitGuesses(gameId, guesses1);

        // Player 2: Buy 5 guesses, submit 2
        vm.prank(player2);
        almostThere.buyGuesses{value: GUESS_COST * 5}(gameId, 5);

        AlmostThere.Guess[] memory guesses2 = new AlmostThere.Guess[](2);
        guesses2[0] = AlmostThere.Guess(7, 7);
        guesses2[1] = AlmostThere.Guess(8, 8);

        vm.prank(player2);
        almostThere.submitGuesses(gameId, guesses2);

        // Fast forward past game end time
        vm.warp(block.timestamp + GAME_DURATION + 1);

        uint256 player1BalanceBefore = player1.balance;
        uint256 ownerBalanceBefore = owner.balance;

        // First check that treasure is not revealed
        vm.expectRevert("Treasure not revealed yet");
        almostThere.getTreasureCoordinates(gameId);

        almostThere.finalizeGame(gameId);

        // Now treasure should be revealed
        (uint256 treasureX, uint256 treasureY) = almostThere.getTreasureCoordinates(gameId);
        assertTrue(treasureX < GRID_WIDTH);
        assertTrue(treasureY < GRID_HEIGHT);

        // Check that some player got rewarded (we don't know which guess will be closest to random treasure)
        uint256 totalPot = 25 * GUESS_COST; // 20 + 5 guesses
        uint256 expectedHouseFee = (totalPot * 5) / 100;
        uint256 expectedWinnersPot = (totalPot * 95) / 100;

        assertEq(owner.balance, ownerBalanceBefore + expectedHouseFee);

        // Either player1 or player2 should have won (or both in case of tie)
        uint256 totalDistributed = (player1.balance - player1BalanceBefore);
        assertGe(totalDistributed, 0);
        assertLe(totalDistributed, expectedWinnersPot);

        // Check game state
        (, , , , , , bool isActive, bool isFinalized) = almostThere.getGameInfo(gameId);
        (, , , bool treasureRevealed) = almostThere.getGameStats(gameId);
        assertFalse(isActive);
        assertTrue(isFinalized);
        assertTrue(treasureRevealed);
    }

        function testOverwriteGuesses() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        vm.prank(player1);
        almostThere.buyGuesses{value: GUESS_COST * 10}(gameId, 10);

        // First set of guesses
        AlmostThere.Guess[] memory guesses1 = new AlmostThere.Guess[](2);
        guesses1[0] = AlmostThere.Guess(1, 1);
        guesses1[1] = AlmostThere.Guess(2, 2);

        vm.prank(player1);
        almostThere.submitGuesses(gameId, guesses1);

        // Second set of guesses (should overwrite)
        AlmostThere.Guess[] memory guesses2 = new AlmostThere.Guess[](3);
        guesses2[0] = AlmostThere.Guess(7, 7);
        guesses2[1] = AlmostThere.Guess(8, 8);
        guesses2[2] = AlmostThere.Guess(9, 9);

        vm.prank(player1);
        almostThere.submitGuesses(gameId, guesses2);

        (, AlmostThere.Guess[] memory finalGuesses) = almostThere.getPlayerInfo(gameId, player1);
        assertEq(finalGuesses.length, 3);
        assertEq(finalGuesses[0].x, 7);
        assertEq(finalGuesses[0].y, 7);
    }

    function testBuyGuessesInvalidAmount() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        vm.prank(player1);
        vm.expectRevert("Incorrect payment amount");
        almostThere.buyGuesses{value: GUESS_COST / 2}(gameId, 1);

        vm.prank(player1);
        vm.expectRevert("Must buy at least one guess");
        almostThere.buyGuesses{value: 0}(gameId, 0);
    }

    function testGuessLimitEnforcement() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        // Get the maximum guesses allowed per player
        (, , uint256 maxGuessesPerPlayer, ) = almostThere.getGameStats(gameId);

        // For 10x10 grid with 50% limit: (100 * 50 / 100) = 50 guesses max
        uint256 expectedMax = (GRID_WIDTH * GRID_HEIGHT * 50) / 100;
        assertEq(maxGuessesPerPlayer, expectedMax);

        // Buy maximum allowed guesses
        vm.prank(player1);
        almostThere.buyGuesses{value: GUESS_COST * maxGuessesPerPlayer}(gameId, maxGuessesPerPlayer);

        // Try to buy one more guess (should fail)
        vm.prank(player1);
        vm.expectRevert("Exceeds maximum guesses per player");
        almostThere.buyGuesses{value: GUESS_COST}(gameId, 1);
    }

        function testDifferentGuessLimits() public {
        // Test with 30% limit
        uint256 gameId1 = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            30 // 30% limit
        );

        // Test with 80% limit
        uint256 gameId2 = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            80 // 80% limit
        );

        (, , uint256 maxGuesses30, ) = almostThere.getGameStats(gameId1);
        (, , uint256 maxGuesses80, ) = almostThere.getGameStats(gameId2);

        // 30% should allow fewer guesses than 80%
        assertLt(maxGuesses30, maxGuesses80);

        // For 30%: (100 * 30 / 100) = 30 guesses
        uint256 expected30 = (GRID_WIDTH * GRID_HEIGHT * 30) / 100;
        assertEq(maxGuesses30, expected30);

        // For 80%: (100 * 80 / 100) = 80 guesses
        uint256 expected80 = (GRID_WIDTH * GRID_HEIGHT * 80) / 100;
        assertEq(maxGuesses80, expected80);
    }

    function testInvalidGuessPercentage() public {
        // Test 0% (should fail)
        vm.expectRevert("Invalid guess percentage");
        almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            0
        );

        // Test > 100% (should fail)
        vm.expectRevert("Invalid guess percentage");
        almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            101
        );
    }

        function testSmallGridGuessLimit() public {
        // Test with very small grid (2x2) and 50% limit
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            2, // 2x2 grid
            2,
            50 // 50% limit
        );

        (, , uint256 maxGuessesPerPlayer, ) = almostThere.getGameStats(gameId);

        // For 2x2 grid with 50%: (4 * 50 / 100) = 2 guesses (minimum 1 enforced)
        assertGe(maxGuessesPerPlayer, 1); // Should be at least 1
        assertEq(maxGuessesPerPlayer, 2); // Should be exactly 2
    }

    function testSubmitGuessesInvalidCoordinates() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        vm.prank(player1);
        almostThere.buyGuesses{value: GUESS_COST * 5}(gameId, 5);

        AlmostThere.Guess[] memory guesses = new AlmostThere.Guess[](1);
        guesses[0] = AlmostThere.Guess(10, 5); // X coordinate out of bounds

        vm.prank(player1);
        vm.expectRevert("Guess coordinates out of bounds");
        almostThere.submitGuesses(gameId, guesses);
    }

        function testRandomTreasurePlacement() public {
        // Create multiple games and verify treasure coordinates are within bounds
        for (uint256 i = 0; i < 5; i++) {
            // Set a consistent base time for each game
            uint256 baseTime = 1000000 + (i * GAME_DURATION * 3);
            vm.warp(baseTime);

            uint256 gameId = almostThere.createGame(
                GAME_DURATION,
                GUESS_COST,
                GRID_WIDTH,
                GRID_HEIGHT,
                50 // 50% limit
            );

            // Buy a guess and submit it to enable finalization
            vm.prank(player1);
            vm.deal(player1, GUESS_COST);
            almostThere.buyGuesses{value: GUESS_COST}(gameId, 1);

            AlmostThere.Guess[] memory guesses = new AlmostThere.Guess[](1);
            guesses[0] = AlmostThere.Guess(0, 0);

            vm.prank(player1);
            almostThere.submitGuesses(gameId, guesses);

            // Fast forward to after this game's end time
            vm.warp(baseTime + GAME_DURATION + 1);
            almostThere.finalizeGame(gameId);

            // Check treasure coordinates are valid
            (uint256 treasureX, uint256 treasureY) = almostThere.getTreasureCoordinates(gameId);
            assertLt(treasureX, GRID_WIDTH);
            assertLt(treasureY, GRID_HEIGHT);
        }
    }

    function testEmergencyWithdraw() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        vm.prank(player1);
        almostThere.buyGuesses{value: GUESS_COST * 30}(gameId, 30);

        uint256 ownerBalanceBefore = owner.balance;
        uint256 contractBalance = almostThere.getContractBalance();

        almostThere.emergencyWithdraw();

        assertEq(owner.balance, ownerBalanceBefore + contractBalance);
        assertEq(almostThere.getContractBalance(), 0);
    }

        function testMultiplePlayersComplexScenario() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        // Player 1: 30 guesses
        vm.prank(player1);
        almostThere.buyGuesses{value: GUESS_COST * 30}(gameId, 30);

        // Player 2: 10 guesses
        vm.prank(player2);
        almostThere.buyGuesses{value: GUESS_COST * 10}(gameId, 10);

        // Player 3: 20 guesses
        vm.prank(player3);
        almostThere.buyGuesses{value: GUESS_COST * 20}(gameId, 20);

        // Submit guesses for all players
        AlmostThere.Guess[] memory guesses1 = new AlmostThere.Guess[](9);
        for (uint256 i = 0; i < 9; i++) {
            guesses1[i] = AlmostThere.Guess(i, i);
        }
        vm.prank(player1);
        almostThere.submitGuesses(gameId, guesses1);

        AlmostThere.Guess[] memory guesses2 = new AlmostThere.Guess[](1);
        guesses2[0] = AlmostThere.Guess(5, 5);
        vm.prank(player2);
        almostThere.submitGuesses(gameId, guesses2);

        AlmostThere.Guess[] memory guesses3 = new AlmostThere.Guess[](6);
        for (uint256 i = 0; i < 6; i++) {
            guesses3[i] = AlmostThere.Guess(9-i, 9-i);
        }
        vm.prank(player3);
        almostThere.submitGuesses(gameId, guesses3);

        // Verify total guesses and pot
        (, , , , , uint256 totalPot, , ) = almostThere.getGameInfo(gameId);
        (uint256 playerCount, uint256 totalGuesses, , ) = almostThere.getGameStats(gameId);
        assertEq(totalGuesses, 60); // 30 + 10 + 20
        assertEq(playerCount, 3);
        assertEq(totalPot, GUESS_COST * 60);

        // Fast forward and finalize
        vm.warp(block.timestamp + GAME_DURATION + 1);
        almostThere.finalizeGame(gameId);

        // Verify game is properly finalized
        (, , , , , , bool isActive, bool isFinalized) = almostThere.getGameInfo(gameId);
        (, , , bool treasureRevealed) = almostThere.getGameStats(gameId);
        assertFalse(isActive);
        assertTrue(isFinalized);
        assertTrue(treasureRevealed);
    }

    function testGetPod() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        // Initially pot should be 0
        uint256 initialPot = almostThere.getPod(gameId);
        assertEq(initialPot, 0);

        // Player 1 buys 10 guesses
        vm.prank(player1);
        almostThere.buyGuesses{value: GUESS_COST * 10}(gameId, 10);

        uint256 potAfterPlayer1 = almostThere.getPod(gameId);
        assertEq(potAfterPlayer1, GUESS_COST * 10);

        // Player 2 buys 5 guesses
        vm.prank(player2);
        almostThere.buyGuesses{value: GUESS_COST * 5}(gameId, 5);

        uint256 finalPot = almostThere.getPod(gameId);
        assertEq(finalPot, GUESS_COST * 15);
    }

    function testGetUserInfo() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        // Initially user should have no guesses
        (uint256 initialGuessCount, AlmostThere.Guess[] memory initialCoords) = almostThere.getUserInfo(gameId, player1);
        assertEq(initialGuessCount, 0);
        assertEq(initialCoords.length, 0);

        // Player buys 5 guesses
        vm.prank(player1);
        almostThere.buyGuesses{value: GUESS_COST * 5}(gameId, 5);

        // Check guess count after purchase
        (uint256 guessCount, AlmostThere.Guess[] memory coords) = almostThere.getUserInfo(gameId, player1);
        assertEq(guessCount, 5);
        assertEq(coords.length, 0); // No coordinates submitted yet

        // Submit 3 guesses
        AlmostThere.Guess[] memory guesses = new AlmostThere.Guess[](3);
        guesses[0] = AlmostThere.Guess(1, 1);
        guesses[1] = AlmostThere.Guess(2, 2);
        guesses[2] = AlmostThere.Guess(3, 3);

        vm.prank(player1);
        almostThere.submitGuesses(gameId, guesses);

        // Check after submitting guesses
        (uint256 finalGuessCount, AlmostThere.Guess[] memory finalCoords) = almostThere.getUserInfo(gameId, player1);
        assertEq(finalGuessCount, 5); // Still have 5 purchased guesses
        assertEq(finalCoords.length, 3); // But submitted 3 coordinates
        assertEq(finalCoords[0].x, 1);
        assertEq(finalCoords[0].y, 1);
        assertEq(finalCoords[1].x, 2);
        assertEq(finalCoords[1].y, 2);
        assertEq(finalCoords[2].x, 3);
        assertEq(finalCoords[2].y, 3);
    }

    function testMapInfo() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        // Initially should have no players
        uint256 mapCost = almostThere.getMapInfoCost(gameId);
        (address[] memory initialPlayers, AlmostThere.Guess[][] memory initialCoords, uint256[] memory initialCounts) = almostThere.mapInfo{value: mapCost}(gameId);
        assertEq(initialPlayers.length, 0);
        assertEq(initialCoords.length, 0);
        assertEq(initialCounts.length, 0);

        // Player 1 joins and submits guesses
        vm.prank(player1);
        almostThere.buyGuesses{value: GUESS_COST * 10}(gameId, 10);

        AlmostThere.Guess[] memory guesses1 = new AlmostThere.Guess[](2);
        guesses1[0] = AlmostThere.Guess(1, 1);
        guesses1[1] = AlmostThere.Guess(2, 2);

        vm.prank(player1);
        almostThere.submitGuesses(gameId, guesses1);

        // Player 2 joins and submits guesses
        vm.prank(player2);
        almostThere.buyGuesses{value: GUESS_COST * 5}(gameId, 5);

        AlmostThere.Guess[] memory guesses2 = new AlmostThere.Guess[](3);
        guesses2[0] = AlmostThere.Guess(7, 7);
        guesses2[1] = AlmostThere.Guess(8, 8);
        guesses2[2] = AlmostThere.Guess(9, 9);

        vm.prank(player2);
        almostThere.submitGuesses(gameId, guesses2);

        // Player 3 joins but doesn't submit guesses
        vm.prank(player3);
        almostThere.buyGuesses{value: GUESS_COST * 3}(gameId, 3);

        // Check map info
        uint256 mapCost2 = almostThere.getMapInfoCost(gameId);
        (address[] memory players, AlmostThere.Guess[][] memory playerCoords, uint256[] memory guessCounts) = almostThere.mapInfo{value: mapCost2}(gameId);

        assertEq(players.length, 3);
        assertEq(playerCoords.length, 3);
        assertEq(guessCounts.length, 3);

        // Check player 1
        assertEq(players[0], player1);
        assertEq(guessCounts[0], 10);
        assertEq(playerCoords[0].length, 2);
        assertEq(playerCoords[0][0].x, 1);
        assertEq(playerCoords[0][0].y, 1);
        assertEq(playerCoords[0][1].x, 2);
        assertEq(playerCoords[0][1].y, 2);

        // Check player 2
        assertEq(players[1], player2);
        assertEq(guessCounts[1], 5);
        assertEq(playerCoords[1].length, 3);
        assertEq(playerCoords[1][0].x, 7);
        assertEq(playerCoords[1][0].y, 7);
        assertEq(playerCoords[1][2].x, 9);
        assertEq(playerCoords[1][2].y, 9);

        // Check player 3 (no submitted guesses)
        assertEq(players[2], player3);
        assertEq(guessCounts[2], 3);
        assertEq(playerCoords[2].length, 0);
    }

    function testGetPodInvalidGame() public {
        vm.expectRevert("Game does not exist");
        almostThere.getPod(999);
    }

    function testGetUserInfoInvalidGame() public {
        vm.expectRevert("Game does not exist");
        almostThere.getUserInfo(999, player1);
    }

    function testMapInfoInvalidGame() public {
        vm.expectRevert("Game does not exist");
        almostThere.mapInfo{value: 0.1 ether}(999);
    }

        function testMapInfoPayment() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        // Add a player with guesses
        vm.prank(player1);
        almostThere.buyGuesses{value: GUESS_COST * 5}(gameId, 5);

        AlmostThere.Guess[] memory guesses = new AlmostThere.Guess[](2);
        guesses[0] = AlmostThere.Guess(1, 1);
        guesses[1] = AlmostThere.Guess(2, 2);

        vm.prank(player1);
        almostThere.submitGuesses(gameId, guesses);

        // Test correct payment
        uint256 mapCost = almostThere.getMapInfoCost(gameId);
        assertEq(mapCost, GUESS_COST * 10); // Should be 10x the guess cost

        uint256 ownerBalanceBefore = owner.balance;

        vm.expectEmit(true, true, false, true);
        emit MapInfoPurchased(gameId, player2, mapCost);

        // Use player2 to buy map info so we don't have owner/buyer conflicts
        vm.prank(player2);
        vm.deal(player2, mapCost);
        almostThere.mapInfo{value: mapCost}(gameId);

        // Owner should receive the payment
        assertEq(owner.balance, ownerBalanceBefore + mapCost);
    }

    function testMapInfoInsufficientPayment() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        uint256 mapCost = almostThere.getMapInfoCost(gameId);
        uint256 insufficientPayment = mapCost - 1;

        vm.expectRevert("Insufficient payment for map info");
        almostThere.mapInfo{value: insufficientPayment}(gameId);
    }

        function testMapInfoOverpaymentRefund() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        uint256 mapCost = almostThere.getMapInfoCost(gameId);
        uint256 overpayment = mapCost + 0.05 ether;

        uint256 ownerBalanceBefore = owner.balance;

        // Use player2 to buy map info with overpayment
        vm.prank(player2);
        vm.deal(player2, overpayment);
        uint256 buyerBalanceBefore = player2.balance;

        almostThere.mapInfo{value: overpayment}(gameId);

        // Buyer should get refund for excess
        assertEq(player2.balance, buyerBalanceBefore - mapCost);

        // Owner should only receive the map cost
        assertEq(owner.balance, ownerBalanceBefore + mapCost);
    }

    function testGetMapInfoCost() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        uint256 mapCost = almostThere.getMapInfoCost(gameId);
        assertEq(mapCost, GUESS_COST * 10);
    }

    function testGameStatsFunction() public {
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50 // 50% limit
        );

        // Initially should have 0 players and guesses
        (uint256 playerCount, uint256 totalGuesses, uint256 maxGuessesPerPlayer, bool treasureRevealed) = almostThere.getGameStats(gameId);
        assertEq(playerCount, 0);
        assertEq(totalGuesses, 0);
        assertEq(maxGuessesPerPlayer, 50); // 50% of 100 grid spaces
        assertFalse(treasureRevealed);

        // Add players and guesses
        vm.prank(player1);
        almostThere.buyGuesses{value: GUESS_COST * 5}(gameId, 5);

        vm.prank(player2);
        almostThere.buyGuesses{value: GUESS_COST * 3}(gameId, 3);

        // Check updated stats
        (playerCount, totalGuesses, maxGuessesPerPlayer, treasureRevealed) = almostThere.getGameStats(gameId);
        assertEq(playerCount, 2);
        assertEq(totalGuesses, 8);
        assertEq(maxGuessesPerPlayer, 50);
        assertFalse(treasureRevealed);
    }

    function testContractBalance() public {
        uint256 initialBalance = almostThere.getContractBalance();
        assertEq(initialBalance, 0);

        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            GRID_WIDTH,
            GRID_HEIGHT,
            50
        );

        // Buy some guesses
        vm.prank(player1);
        almostThere.buyGuesses{value: GUESS_COST * 10}(gameId, 10);

        uint256 balanceAfterGuesses = almostThere.getContractBalance();
        assertEq(balanceAfterGuesses, GUESS_COST * 10);

        // Buy map info
        uint256 mapCost = almostThere.getMapInfoCost(gameId);
        vm.prank(player2);
        vm.deal(player2, mapCost);
        almostThere.mapInfo{value: mapCost}(gameId);

        // Contract balance should remain the same since map fees go to owner
        uint256 balanceAfterMapInfo = almostThere.getContractBalance();
        assertEq(balanceAfterMapInfo, GUESS_COST * 10);
    }

    function testOwnerOnlyFunctions() public {
        // Test non-owner can't create games
        vm.prank(player1);
        vm.expectRevert("Only owner can call this function");
        almostThere.createGame(GAME_DURATION, GUESS_COST, GRID_WIDTH, GRID_HEIGHT, 50);

        // Test non-owner can't emergency withdraw
        vm.prank(player1);
        vm.expectRevert("Only owner can call this function");
        almostThere.emergencyWithdraw();
    }

    function testZeroGuessLimitEdgeCase() public {
        // Test with a very small percentage that would result in 0 guesses
        // Contract should set it to minimum 1
        uint256 gameId = almostThere.createGame(
            GAME_DURATION,
            GUESS_COST,
            3, // 3x3 grid = 9 spaces
            3,
            1 // 1% of 9 = 0.09, should round up to 1
        );

        (, , uint256 maxGuessesPerPlayer, ) = almostThere.getGameStats(gameId);
        assertEq(maxGuessesPerPlayer, 1); // Should be minimum 1
    }

    function testMultipleGamesIndependence() public {
        // Create two games with different parameters
        uint256 gameId1 = almostThere.createGame(
            GAME_DURATION,
            0.1 ether,
            5,
            5,
            40
        );

        uint256 gameId2 = almostThere.createGame(
            GAME_DURATION * 2,
            0.2 ether,
            8,
            8,
            60
        );

        // Verify games are independent
        (uint256 gameId1_, uint256 endTime1, uint256 guessCost1, uint256 gridWidth1, uint256 gridHeight1, , , ) = almostThere.getGameInfo(gameId1);
        (uint256 gameId2_, uint256 endTime2, uint256 guessCost2, uint256 gridWidth2, uint256 gridHeight2, , , ) = almostThere.getGameInfo(gameId2);

        assertEq(gameId1_, 1);
        assertEq(gameId2_, 2);
        assertEq(guessCost1, 0.1 ether);
        assertEq(guessCost2, 0.2 ether);
        assertEq(gridWidth1, 5);
        assertEq(gridWidth2, 8);
        assertNotEq(endTime1, endTime2);

        // Verify independent guess limits
        (, , uint256 maxGuesses1, ) = almostThere.getGameStats(gameId1);
        (, , uint256 maxGuesses2, ) = almostThere.getGameStats(gameId2);

        assertEq(maxGuesses1, 10); // (5 * 5 * 40) / 100 = 10 guesses
        assertEq(maxGuesses2, 38); // (8 * 8 * 60) / 100 = 38.4, truncated to 38 guesses
    }

    // Fallback function to receive ETH
    receive() external payable {}
}
