'use client'

import { useAlmostThereWrite, useSimulateAlmostThere } from '@/hooks/use-contract-writes'

export function useBuyGuesses() {
  const writer = useAlmostThereWrite()
  function buy({ gameId, guessCount, guessCost }: { gameId: bigint; guessCount: bigint; guessCost: bigint }) {
    const value = guessCost * guessCount
    return writer.writeAsync({ functionName: 'buyGuesses', args: [gameId, guessCount], value })
  }
  return { ...writer, buy }
}

export function useSubmitGuesses() {
  const writer = useAlmostThereWrite()
  function submit({ gameId, guesses }: { gameId: bigint; guesses: { x: bigint; y: bigint }[] }) {
    return writer.writeAsync({ functionName: 'submitGuesses', args: [gameId, guesses] })
  }
  return { ...writer, submit }
}

export function useFinalizeGame() {
  const writer = useAlmostThereWrite()
  function finalize(gameId: bigint) {
    return writer.writeAsync({ functionName: 'finalizeGame', args: [gameId] })
  }
  return { ...writer, finalize }
}

export function useMapInfoPayable() {
  const writer = useAlmostThereWrite()
  function read(gameId: bigint, value: bigint) {
    return writer.writeAsync({ functionName: 'mapInfo', args: [gameId], value })
  }
  return { ...writer, read }
}


