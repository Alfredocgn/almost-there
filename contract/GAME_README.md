# AlmostThere - Enhanced Treasure Hunt Game Contract

## Overview

AlmostThere is a smart contract-based treasure hunt game where players compete to guess the location of a hidden treasure on a grid. Players buy individual guesses at a set cost, and the player(s) with the closest guess to the randomly placed treasure win the prize pot.

## Game Features

### Core Mechanics
- **Grid-based gameplay**: Configurable grid size (default 10x10 for first iteration)
- **Time-limited rounds**: 24-hour game duration (configurable)
- **Individual guess purchase**: Players buy individual guesses at a set cost
- **Configurable pricing**: Game owners set the cost per guess
- **Limited guesses**: Players can buy guesses up to a configurable limit (e.g., 50% of grid spaces)
- **Fair distribution**: Guess limits prevent any single player from dominating the grid
- **Random treasure**: Treasure location randomly generated at game creation
- **Distance-based winner**: Closest guess(es) among all player guesses wins
- **Prize distribution**: Winner takes 95% of pot, 5% house fee
- **Tie handling**: Multiple winners split the prize equally

### Key Functions

#### For Game Owners
- `createGame()`: Start a new game with custom parameters (treasure placed randomly)
- `finalizeGame()`: End game and distribute prizes after time expires
- `emergencyWithdraw()`: Emergency fund recovery (owner only)

#### For Players
- `buyGuesses()`: Purchase individual guesses for a game at set cost
- `submitGuesses()`: Submit coordinate guesses (up to purchased amount)
- `getGameInfo()`: View game details (duration, pot size, guesses sold, etc.)
- `getPlayerInfo()`: Check your purchased guesses and submitted guesses
- `getMaxGuessesForGame()`: Check maximum guesses allowed per player for a game
- `getRemainingGuesses()`: Check how many more guesses you can purchase
- `getTreasureCoordinates()`: View treasure location (after game ends)
- `getPod()`: Get the total pot amount for a specific game
- `getUserInfo()`: Get user's guess count and submitted coordinates
- `mapInfo()`: Get all players and their coordinates (payable - costs 10x guess price)
- `getMapInfoCost()`: Check the cost to access map information

## Game Flow

1. **Game Creation**: Owner creates game with:
   - Duration (e.g., 24 hours)
   - Cost per guess (e.g., 0.1 ETH)
   - Grid dimensions (e.g., 10x10)
   - Guess limit percentage (e.g., 50% of grid spaces)
   - Treasure coordinates randomly generated

2. **Guess Purchase**: Players buy guesses by:
   - Paying the exact cost per guess desired
   - Can purchase multiple guesses up to the game's limit
   - Limit ensures fair distribution (e.g., max 50% of grid coverage)
   - Each purchase is for individual coordinate guesses

3. **Guess Submission**: Players submit guesses by:
   - Calling `submitGuesses()` with array of coordinates
   - Can submit up to their purchased guess count
   - Can overwrite previous guesses anytime before game ends

4. **Game End**: After time expires:
   - Anyone can call `finalizeGame()`
   - System finds best guess among all player guesses
   - Winners receive prize distribution
   - Treasure location is revealed

## Technical Details

### Random Treasure Placement
- Treasure coordinates generated using blockchain randomness
- Uses `block.timestamp`, `block.prevrandao`, `block.number`, and `gameId`
- Coordinates guaranteed to be within grid bounds
- Location hidden until game finalization

### Distance Calculation
- Uses squared Euclidean distance to avoid floating-point arithmetic
- Formula: `distance² = (x₁-x₂)² + (y₁-y₂)²`
- System checks all guesses from all players
- Best (closest) guess per player is used for comparison

### Prize Distribution
- **Winner's share**: 95% of total pot
- **House fee**: 5% to contract owner
- **Tie handling**: Winners split the 95% equally
- **Automatic transfer**: Prizes sent immediately upon finalization

### Guess Limit System
- Configurable percentage limit prevents grid domination
- Example: 50% limit on 10×10 grid = max 50 guesses per player
- Formula: `maxGuesses = gridSize × percentage ÷ 100`
- Minimum 1 guess guaranteed even for small grids
- Ensures competitive balance and fair gameplay

### Security Features
- **Individual guess system**: Clear pricing and ownership of guess rights
- **Guess limits**: Prevents any single player from monopolizing the grid
- **Time enforcement**: No guess purchases or finalizations before time
- **Coordinate validation**: All guesses must be within grid bounds
- **Double finalization protection**: Games can only be finalized once
- **Guess overwriting**: Players can update strategies before game ends
- **Emergency controls**: Owner can withdraw funds if needed

## Usage Examples

### Creating a Game
```solidity
// 24-hour game, 0.1 ETH per guess, 10x10 grid, 50% guess limit, random treasure
uint256 gameId = almostThere.createGame(
    24 hours,           // duration
    0.1 ether,         // cost per guess
    10,                // grid width
    10,                // grid height
    50                 // max guess percentage (50% of grid spaces)
    // treasure coordinates automatically randomized
);
```

### Buying Guesses
```solidity
// Buy 20 guesses for game #1 (20 individual coordinate guesses)
// Note: Must not exceed the game's maximum guesses per player
almostThere.buyGuesses{value: 2.0 ether}(1, 20); // 20 * 0.1 ETH = 2.0 ETH
```

### Submitting Guesses
```solidity
// Submit 5 guesses for game #1 (if you purchased 5+ guesses)
AlmostThere.Guess[] memory guesses = new AlmostThere.Guess[](5);
guesses[0] = AlmostThere.Guess(1, 1);
guesses[1] = AlmostThere.Guess(5, 5);
guesses[2] = AlmostThere.Guess(9, 9);
guesses[3] = AlmostThere.Guess(3, 7);
guesses[4] = AlmostThere.Guess(7, 3);

almostThere.submitGuesses(1, guesses);
```

### Checking Game Status
```solidity
(
    uint256 gameId,
    uint256 endTime,
    uint256 guessCost,
    uint256 gridWidth,
    uint256 gridHeight,
    uint256 maxGuessesPerPlayer,
    uint256 totalPot,
    bool isActive,
    bool isFinalized,
    uint256 playerCount,
    uint256 totalGuesses,
    bool treasureRevealed
) = almostThere.getGameInfo(1);
```

### Checking Player Info
```solidity
(
    uint256 guessCount,
    AlmostThere.Guess[] memory guesses
) = almostThere.getPlayerInfo(1, playerAddress);

// Check remaining guesses player can buy
uint256 remaining = almostThere.getRemainingGuesses(1, playerAddress);
```

### Checking Pot Amount
```solidity
// Get current pot amount for game #1
uint256 currentPot = almostThere.getPod(1);
```

### Getting User Information
```solidity
// Get specific user info (same as getPlayerInfo but clearer naming)
(
    uint256 guessCount,
    AlmostThere.Guess[] memory coordinates
) = almostThere.getUserInfo(1, playerAddress);
```

### Getting Map Information (All Players) - Premium Feature
```solidity
// Check the cost first (10x the guess price)
uint256 mapCost = almostThere.getMapInfoCost(1);

// Get all players and their coordinates for visualization (requires payment)
(
    address[] memory players,
    AlmostThere.Guess[][] memory playerCoordinates,
    uint256[] memory playerGuessesCount
) = almostThere.mapInfo{value: mapCost}(1);

// Example: Display all player guesses
for (uint256 i = 0; i < players.length; i++) {
    address player = players[i];
    uint256 guessCount = playerGuessesCount[i];
    AlmostThere.Guess[] memory coords = playerCoordinates[i];

    // Now you can display player's address, guess count, and coordinates
}
```

## Deployment

### Requirements
- Solidity ^0.8.13
- Foundry framework

### Deploy Contract
```bash
# Compile
forge build

# Test
forge test

# Deploy to local network
forge script script/AlmostThere.s.sol:AlmostThereScript --fork-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast

# Deploy to mainnet/testnet
forge script script/AlmostThere.s.sol:AlmostThereScript --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast --verify
```

## Game Strategy

### For Players
- **Guess strategy**: Buy maximum allowed guesses for best odds
- **Limit awareness**: Check `maxGuessesPerPlayer` before purchasing
- **Guess distribution**: Spread guesses across different grid areas
- **Timing**: Buy guesses early, submit them strategically
- **Risk assessment**: Evaluate expected returns vs guess costs
- **Pattern analysis**: Study grid probabilities and opponent behavior

### For Game Operators
- **Cost optimization**: Balance participation vs profitability per guess
- **Duration tuning**: Longer games = more guesses sold
- **Grid sizing**: Larger grids = more strategic depth, harder to win
- **Guess limits**: Set appropriate percentage limits (30-70% recommended)
- **Balance considerations**: Lower limits = more competitive, higher limits = more revenue
- **Random fairness**: Blockchain-based randomness ensures fair treasure placement

## Events

The contract emits these events for off-chain tracking:

- `GameCreated`: New game started with random treasure
- `GuessesPurchased`: Player bought individual guesses for a game
- `GuessSubmitted`: Player submitted coordinate guesses
- `TreasureRevealed`: Treasure coordinates revealed at game end
- `GameFinalized`: Game ended, winners determined and paid
- `MapInfoPurchased`: Someone purchased access to map information

## Security Considerations

### Auditing Notes
- Reentrancy protection through checks-effects-interactions pattern
- Integer overflow protection via Solidity ^0.8.13
- Access control via owner-only functions
- Input validation on all user inputs

### Known Limitations
- Blockchain randomness is pseudo-random (use Chainlink VRF for true randomness)
- No player withdrawal mechanism before game end
- Fixed 5% house fee (not configurable per game)
- Gas costs scale with number of players and guesses

## Future Enhancements

### Potential Improvements
- **True randomness**: Use Chainlink VRF for treasure placement
- **Dynamic pricing**: Ticket prices that adjust based on demand
- **Multi-round tournaments**: Sequential games with progressive difficulty
- **NFT integration**: Issue certificates, achievements, or collectible tickets
- **Leaderboards**: Track player statistics and rankings across games
- **Variable house fees**: Per-game fee configuration
- **Guess hints**: Optional clue system for additional fees
- **Team play**: Allow players to form teams and split winnings
