// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title AlmostThere
 * @dev A treasure hunt game where players guess coordinates on a grid
 * Players have a limited time to place their guesses, and the closest to the treasure wins the pot
 */
contract AlmostThere {
    struct Guess {
        uint256 x;
        uint256 y;
    }

    struct Game {
        uint256 gameId;
        uint256 endTime;
        uint256 guessCost;
        uint256 gridWidth;
        uint256 gridHeight;
        uint256 maxGuessesPerPlayer;
        uint256 treasureX;
        uint256 treasureY;
        uint256 totalPot;
        bool isActive;
        bool isFinalized;
        bool treasureRevealed;
        address[] players;
        mapping(address => uint256) playerGuessCount;
        mapping(address => Guess[]) playerGuesses;
        uint256 totalGuesses;
    }

    struct Winner {
        address player;
        uint256 distance;
        uint256 reward;
    }

    uint256 public gameCounter;
    mapping(uint256 => Game) public games;

    address public owner;
    uint256 public constant HOUSE_FEE_PERCENTAGE = 5; // 5% house fee

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

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier gameExists(uint256 _gameId) {
        require(_gameId <= gameCounter && _gameId > 0, "Game does not exist");
        _;
    }

    modifier gameActive(uint256 _gameId) {
        require(games[_gameId].isActive, "Game is not active");
        require(block.timestamp < games[_gameId].endTime, "Game has ended");
        _;
    }

    modifier gameEnded(uint256 _gameId) {
        require(block.timestamp >= games[_gameId].endTime, "Game has not ended yet");
        _;
    }

    constructor() {
        owner = msg.sender;
        gameCounter = 0;
    }

            /**
     * @dev Create a new game with specified parameters - treasure will be randomly placed
     * @param _duration Duration of the game in seconds
     * @param _guessCost Cost per guess
     * @param _gridWidth Width of the game grid
     * @param _gridHeight Height of the game grid
     * @param _maxGuessPercentage Maximum percentage of grid spaces a player can guess (e.g., 50 for 50%)
     */
    function createGame(
        uint256 _duration,
        uint256 _guessCost,
        uint256 _gridWidth,
        uint256 _gridHeight,
        uint256 _maxGuessPercentage
    ) external onlyOwner returns (uint256) {
        require(_duration > 0, "Duration must be greater than 0");
        require(_guessCost > 0, "Guess cost must be greater than 0");
        require(_gridWidth > 0 && _gridHeight > 0, "Grid dimensions must be greater than 0");
        require(_maxGuessPercentage > 0 && _maxGuessPercentage <= 100, "Invalid guess percentage");

        gameCounter++;
        uint256 gameId = gameCounter;
        uint256 endTime = block.timestamp + _duration;

        // Calculate maximum guesses per player based on percentage of grid spaces
        uint256 totalGridSpaces = _gridWidth * _gridHeight;
        uint256 maxGuessesPerPlayer = (totalGridSpaces * _maxGuessPercentage) / 100;

        // Ensure at least 1 guess can be bought
        if (maxGuessesPerPlayer == 0) {
            maxGuessesPerPlayer = 1;
        }

        // Generate random treasure coordinates using block hash
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            block.number,
            gameId
        )));

        uint256 treasureX = randomSeed % _gridWidth;
        uint256 treasureY = (randomSeed / _gridWidth) % _gridHeight;

        Game storage newGame = games[gameId];
        newGame.gameId = gameId;
        newGame.endTime = endTime;
        newGame.guessCost = _guessCost;
        newGame.gridWidth = _gridWidth;
        newGame.gridHeight = _gridHeight;
        newGame.maxGuessesPerPlayer = maxGuessesPerPlayer;
        newGame.treasureX = treasureX;
        newGame.treasureY = treasureY;
        newGame.totalPot = 0;
        newGame.isActive = true;
        newGame.isFinalized = false;
        newGame.treasureRevealed = false;
        newGame.totalGuesses = 0;

        emit GameCreated(gameId, endTime, _guessCost, _gridWidth, _gridHeight, maxGuessesPerPlayer);
        return gameId;
    }

                /**
     * @dev Buy guesses for a game - each purchase is for individual guesses
     * @param _gameId ID of the game to join
     * @param _guessCount Number of guesses to purchase
     */
    function buyGuesses(
        uint256 _gameId,
        uint256 _guessCount
    ) external payable gameExists(_gameId) gameActive(_gameId) {
        Game storage game = games[_gameId];

        require(_guessCount > 0, "Must buy at least one guess");
        require(msg.value == game.guessCost * _guessCount, "Incorrect payment amount");

        // Check if player would exceed maximum guesses allowed
        uint256 newGuessCount = game.playerGuessCount[msg.sender] + _guessCount;
        require(newGuessCount <= game.maxGuessesPerPlayer, "Exceeds maximum guesses per player");

        // Add player to players array if first time playing
        if (game.playerGuessCount[msg.sender] == 0) {
            game.players.push(msg.sender);
        }

        game.playerGuessCount[msg.sender] = newGuessCount;
        game.totalGuesses += _guessCount;
        game.totalPot += msg.value;

        emit GuessesPurchased(_gameId, msg.sender, _guessCount, newGuessCount);
    }

        /**
     * @dev Submit guesses for your purchased guess slots
     * @param _gameId ID of the game
     * @param _guesses Array of guesses (max equal to purchased guesses)
     */
    function submitGuesses(
        uint256 _gameId,
        Guess[] memory _guesses
    ) external gameExists(_gameId) gameActive(_gameId) {
        Game storage game = games[_gameId];

        require(game.playerGuessCount[msg.sender] > 0, "Player has no purchased guesses");
        require(_guesses.length <= game.playerGuessCount[msg.sender], "Too many guesses for purchased slots");
        require(_guesses.length > 0, "Must submit at least one guess");

        // Validate all coordinates are within bounds
        for (uint256 i = 0; i < _guesses.length; i++) {
            require(_guesses[i].x < game.gridWidth && _guesses[i].y < game.gridHeight, "Guess coordinates out of bounds");
        }

        // Clear existing guesses and add new ones
        delete game.playerGuesses[msg.sender];
        for (uint256 i = 0; i < _guesses.length; i++) {
            game.playerGuesses[msg.sender].push(_guesses[i]);
            emit GuessSubmitted(_gameId, msg.sender, i, _guesses[i].x, _guesses[i].y);
        }
    }

    /**
     * @dev Calculate the squared distance between two points to avoid floating point arithmetic
     * @param x1 First point X coordinate
     * @param y1 First point Y coordinate
     * @param x2 Second point X coordinate
     * @param y2 Second point Y coordinate
     * @return The squared distance between the points
     */
    function calculateSquaredDistance(
        uint256 x1,
        uint256 y1,
        uint256 x2,
        uint256 y2
    ) internal pure returns (uint256) {
        uint256 dx = x1 > x2 ? x1 - x2 : x2 - x1;
        uint256 dy = y1 > y2 ? y1 - y2 : y2 - y1;
        return dx * dx + dy * dy;
    }

    /**
     * @dev Finalize a game and distribute rewards to winners
     * @param _gameId ID of the game to finalize
     */
    function finalizeGame(uint256 _gameId)
        external
        gameExists(_gameId)
        gameEnded(_gameId)
    {
        Game storage game = games[_gameId];
        require(!game.isFinalized, "Game already finalized");
        require(game.players.length > 0, "No players in the game");

        game.isActive = false;
        game.isFinalized = true;

                // Reveal treasure coordinates
        game.treasureRevealed = true;
        emit TreasureRevealed(_gameId, game.treasureX, game.treasureY);

        // Find the minimum distance and count winners
        uint256 minDistance = type(uint256).max;
        address[] memory potentialWinners = new address[](game.players.length);
        uint256 winnerCount = 0;

        // First pass: find minimum distance among all guesses
        for (uint256 i = 0; i < game.players.length; i++) {
            address player = game.players[i];
            Guess[] storage playerGuesses = game.playerGuesses[player];

            // Check all guesses for this player
            uint256 playerBestDistance = type(uint256).max;
            for (uint256 j = 0; j < playerGuesses.length; j++) {
                uint256 distance = calculateSquaredDistance(
                    playerGuesses[j].x,
                    playerGuesses[j].y,
                    game.treasureX,
                    game.treasureY
                );

                if (distance < playerBestDistance) {
                    playerBestDistance = distance;
                }
            }

            // Update global minimum and winner tracking
            if (playerBestDistance < minDistance) {
                minDistance = playerBestDistance;
                // Reset winners array
                potentialWinners[0] = player;
                winnerCount = 1;
            } else if (playerBestDistance == minDistance) {
                potentialWinners[winnerCount] = player;
                winnerCount++;
            }
        }

        // Calculate rewards
        uint256 houseFee = (game.totalPot * HOUSE_FEE_PERCENTAGE) / 100;
        uint256 winnersPot = game.totalPot - houseFee;
        uint256 rewardPerWinner = winnersPot / winnerCount;

                // Prepare arrays for event emission
        address[] memory winners = new address[](winnerCount);
        uint256[] memory rewards = new uint256[](winnerCount);

        // Copy winners and distribute rewards
        for (uint256 i = 0; i < winnerCount; i++) {
            address winner = potentialWinners[i];
            winners[i] = winner;
            rewards[i] = rewardPerWinner;

            // Transfer reward to winner
            (bool success, ) = payable(winner).call{value: rewardPerWinner}("");
            require(success, "Failed to transfer reward to winner");
        }

        // Transfer house fee to owner
        if (houseFee > 0) {
            (bool success, ) = payable(owner).call{value: houseFee}("");
            require(success, "Failed to transfer house fee");
        }

        emit GameFinalized(_gameId, game.treasureX, game.treasureY, winners, rewards);
    }

    /**
     * @dev Get basic game information
     * @param _gameId ID of the game
     * @return gameId Game ID
     * @return endTime End time of the game
     * @return guessCost Cost per guess
     * @return gridWidth Width of the game grid
     * @return gridHeight Height of the game grid
     * @return totalPot Total pot amount
     * @return isActive Whether the game is active
     * @return isFinalized Whether the game is finalized
     */
    function getGameInfo(uint256 _gameId)
        external
        view
        gameExists(_gameId)
        returns (
            uint256 gameId,
            uint256 endTime,
            uint256 guessCost,
            uint256 gridWidth,
            uint256 gridHeight,
            uint256 totalPot,
            bool isActive,
            bool isFinalized
        )
    {
        Game storage game = games[_gameId];
        return (
            game.gameId,
            game.endTime,
            game.guessCost,
            game.gridWidth,
            game.gridHeight,
            game.totalPot,
            game.isActive,
            game.isFinalized
        );
    }

    /**
     * @dev Get game statistics
     * @param _gameId ID of the game
     * @return playerCount Number of players
     * @return totalGuesses Total guesses purchased
     * @return maxGuessesPerPlayer Maximum guesses allowed per player
     * @return treasureRevealed Whether treasure coordinates are revealed
     */
    function getGameStats(uint256 _gameId)
        external
        view
        gameExists(_gameId)
        returns (
            uint256 playerCount,
            uint256 totalGuesses,
            uint256 maxGuessesPerPlayer,
            bool treasureRevealed
        )
    {
        Game storage game = games[_gameId];
        return (
            game.players.length,
            game.totalGuesses,
            game.maxGuessesPerPlayer,
            game.treasureRevealed
        );
    }

    /**
     * @dev Get player's purchased guesses and submitted guesses for a specific game
     * @param _gameId ID of the game
     * @param _player Address of the player
     * @return guessCount Number of guesses purchased
     * @return guesses Array of player's submitted guesses
     */
    function getPlayerInfo(uint256 _gameId, address _player)
        external
        view
        gameExists(_gameId)
        returns (uint256 guessCount, Guess[] memory guesses)
    {
        Game storage game = games[_gameId];
        return (
            game.playerGuessCount[_player],
            game.playerGuesses[_player]
        );
    }

    /**
     * @dev Get all players for a specific game
     * @param _gameId ID of the game
     * @return players Array of player addresses
     */
    function getGamePlayers(uint256 _gameId)
        external
        view
        gameExists(_gameId)
        returns (address[] memory players)
    {
        return games[_gameId].players;
    }

    /**
     * @dev Get treasure coordinates (only after treasure is revealed)
     * @param _gameId ID of the game
     * @return treasureX X coordinate of the treasure
     * @return treasureY Y coordinate of the treasure
     */
    function getTreasureCoordinates(uint256 _gameId)
        external
        view
        gameExists(_gameId)
        returns (uint256 treasureX, uint256 treasureY)
    {
        Game storage game = games[_gameId];
        require(game.treasureRevealed, "Treasure not revealed yet");
        return (game.treasureX, game.treasureY);
    }

    /**
     * @dev Get the maximum number of guesses a player can purchase for a game
     * @param _gameId ID of the game
     * @return maxGuesses Maximum guesses allowed per player
     */
    function getMaxGuessesForGame(uint256 _gameId)
        external
        view
        gameExists(_gameId)
        returns (uint256 maxGuesses)
    {
        Game storage game = games[_gameId];
        return game.maxGuessesPerPlayer;
    }

    /**
     * @dev Get the remaining guesses a player can purchase
     * @param _gameId ID of the game
     * @param _player Address of the player
     * @return remainingGuesses Remaining guesses the player can buy
     */
    function getRemainingGuesses(uint256 _gameId, address _player)
        external
        view
        gameExists(_gameId)
        returns (uint256 remainingGuesses)
    {
        Game storage game = games[_gameId];
        return game.maxGuessesPerPlayer - game.playerGuessCount[_player];
    }

    /**
     * @dev Emergency function to withdraw funds (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Failed to withdraw funds");
    }

    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get the total pot amount for a specific game
     * @param _gameId ID of the game
     * @return pot Total pot amount in the game
     */
    function getPod(uint256 _gameId)
        external
        view
        gameExists(_gameId)
        returns (uint256 pot)
    {
        return games[_gameId].totalPot;
    }

    /**
     * @dev Get user information for a specific game
     * @param _gameId ID of the game
     * @param _user Address of the user
     * @return guessCount Number of guesses the user has purchased
     * @return coordinates Array of coordinates the user has submitted
     */
    function getUserInfo(uint256 _gameId, address _user)
        external
        view
        gameExists(_gameId)
        returns (uint256 guessCount, Guess[] memory coordinates)
    {
        Game storage game = games[_gameId];
        return (
            game.playerGuessCount[_user],
            game.playerGuesses[_user]
        );
    }

    /**
     * @dev Get map information showing all players and their coordinates for a specific game
     * @dev This is a premium function that costs 10x the guess price to access
     * @param _gameId ID of the game
     * @return players Array of player addresses
     * @return playerCoordinates Array of coordinate arrays (each player's guesses)
     * @return playerGuessesCount Array of guess counts per player
     */
    function mapInfo(uint256 _gameId)
        external
        payable
        gameExists(_gameId)
        returns (
            address[] memory players,
            Guess[][] memory playerCoordinates,
            uint256[] memory playerGuessesCount
        )
    {
        Game storage game = games[_gameId];

        // Calculate the cost to access map info (10x the guess cost)
        uint256 mapInfoCost = game.guessCost * 10;
        require(msg.value >= mapInfoCost, "Insufficient payment for map info");

        // If overpaid, refund the excess
        if (msg.value > mapInfoCost) {
            uint256 refund = msg.value - mapInfoCost;
            (bool success, ) = payable(msg.sender).call{value: refund}("");
            require(success, "Failed to refund excess payment");
        }

        // Transfer the map info fee to the owner
        if (mapInfoCost > 0) {
            (bool success, ) = payable(owner).call{value: mapInfoCost}("");
            require(success, "Failed to transfer map info fee");
        }

        uint256 playerCount = game.players.length;

        players = new address[](playerCount);
        playerCoordinates = new Guess[][](playerCount);
        playerGuessesCount = new uint256[](playerCount);

        for (uint256 i = 0; i < playerCount; i++) {
            address player = game.players[i];
            players[i] = player;
            playerCoordinates[i] = game.playerGuesses[player];
            playerGuessesCount[i] = game.playerGuessCount[player];
        }

        emit MapInfoPurchased(_gameId, msg.sender, mapInfoCost);
        return (players, playerCoordinates, playerGuessesCount);
    }

    /**
     * @dev Get the cost to access map information for a specific game
     * @param _gameId ID of the game
     * @return cost Cost to access map info (10x the guess cost)
     */
    function getMapInfoCost(uint256 _gameId)
        external
        view
        gameExists(_gameId)
        returns (uint256 cost)
    {
        return games[_gameId].guessCost * 10;
    }
}
