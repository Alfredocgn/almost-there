import { parseAbi } from 'viem'

// Env: set NEXT_PUBLIC_ALMOST_THERE_ADDRESS in .env.local
export const ALMOST_THERE_ADDRESS = (process.env.NEXT_PUBLIC_ALMOST_THERE_ADDRESS || '').trim()

// Minimal ABI (read methods only for now)
export const ALMOST_THERE_ABI = parseAbi([
  // views
  'function gameCounter() view returns (uint256)',
  'function owner() view returns (address)',
  'function getGameInfo(uint256 _gameId) view returns (uint256 gameId,uint256 endTime,uint256 guessCost,uint256 gridWidth,uint256 gridHeight,uint256 totalPot,bool isActive,bool isFinalized)',
  'function getGameStats(uint256 _gameId) view returns (uint256 playerCount,uint256 totalGuesses,uint256 maxGuessesPerPlayer,bool treasureRevealed)',
  'function getPlayerInfo(uint256 _gameId,address _player) view returns (uint256 guessCount,(uint256 x,uint256 y)[] guesses)',
  'function getGamePlayers(uint256 _gameId) view returns (address[] players)',
  'function getTreasureCoordinates(uint256 _gameId) view returns (uint256 treasureX,uint256 treasureY)',
  'function getMaxGuessesForGame(uint256 _gameId) view returns (uint256 maxGuesses)',
  'function getRemainingGuesses(uint256 _gameId,address _player) view returns (uint256 remainingGuesses)',
  'function getContractBalance() view returns (uint256)',
  'function getPod(uint256 _gameId) view returns (uint256 pot)',
  'function getUserInfo(uint256 _gameId,address _user) view returns (uint256 guessCount,(uint256 x,uint256 y)[] coordinates)',
  'function getMapInfoCost(uint256 _gameId) view returns (uint256 cost)',
  // writes
  'function buyGuesses(uint256 _gameId,uint256 _guessCount) payable',
  'function submitGuesses(uint256 _gameId,(uint256 x,uint256 y)[] _guesses)',
  'function finalizeGame(uint256 _gameId)',
  'function mapInfo(uint256 _gameId) payable returns (address[] players,(uint256 x,uint256 y)[][] playerCoordinates,uint256[] playerGuessesCount)'
])

export type Guess = { x: bigint; y: bigint }


