'use client'

import { useAlmostThereRead } from '@/hooks/use-contract-reads'
import type { Guess } from '@/lib/contracts'

export function useGameCounter() {
  return useAlmostThereRead<bigint>({ functionName: 'gameCounter' })
}

export function useGameInfo(gameId?: bigint) {
  return useAlmostThereRead<readonly [
    bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean
  ]>({
    functionName: 'getGameInfo',
    args: gameId !== undefined ? [gameId] : undefined,
    query: { enabled: gameId !== undefined },
  })
}

export function useGameStats(gameId?: bigint) {
  return useAlmostThereRead<readonly [bigint, bigint, bigint, boolean]>({
    functionName: 'getGameStats',
    args: gameId !== undefined ? [gameId] : undefined,
    query: { enabled: gameId !== undefined },
  })
}

export function useGamePlayers(gameId?: bigint) {
  return useAlmostThereRead<`0x${string}`[]>({
    functionName: 'getGamePlayers',
    args: gameId !== undefined ? [gameId] : undefined,
    query: { enabled: gameId !== undefined },
  })
}

export function usePlayerInfo(gameId?: bigint, player?: `0x${string}`) {
  return useAlmostThereRead<readonly [bigint, Guess[]]>({
    functionName: 'getPlayerInfo',
    args: gameId !== undefined && player ? [gameId, player] : undefined,
    query: { enabled: gameId !== undefined && !!player },
  })
}

export function useUserInfo(gameId?: bigint, user?: `0x${string}`) {
  return useAlmostThereRead<readonly [bigint, Guess[]]>({
    functionName: 'getUserInfo',
    args: gameId !== undefined && user ? [gameId, user] : undefined,
    query: { enabled: gameId !== undefined && !!user },
  })
}

export function useMaxGuesses(gameId?: bigint) {
  return useAlmostThereRead<bigint>({
    functionName: 'getMaxGuessesForGame',
    args: gameId !== undefined ? [gameId] : undefined,
    query: { enabled: gameId !== undefined },
  })
}

export function useRemainingGuesses(gameId?: bigint, user?: `0x${string}`) {
  return useAlmostThereRead<bigint>({
    functionName: 'getRemainingGuesses',
    args: gameId !== undefined && user ? [gameId, user] : undefined,
    query: { enabled: gameId !== undefined && !!user },
  })
}

export function usePod(gameId?: bigint) {
  return useAlmostThereRead<bigint>({
    functionName: 'getPod',
    args: gameId !== undefined ? [gameId] : undefined,
    query: { enabled: gameId !== undefined },
  })
}

export function useMapInfoCost(gameId?: bigint) {
  return useAlmostThereRead<bigint>({
    functionName: 'getMapInfoCost',
    args: gameId !== undefined ? [gameId] : undefined,
    query: { enabled: gameId !== undefined },
  })
}


