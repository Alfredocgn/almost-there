'use client'

import { useWriteContract, useSimulateContract, type UseWriteContractParameters } from 'wagmi'
import { ALMOST_THERE_ADDRESS, ALMOST_THERE_ABI } from '@/lib/contracts'

type WriteArgs = {
  functionName: any
  args?: any
  value?: bigint
}

export function useAlmostThereWrite() {
  const write = useWriteContract()

  function writeAsync({ functionName, args, value }: WriteArgs) {
    return write.writeContractAsync({
      abi: ALMOST_THERE_ABI,
      address: ALMOST_THERE_ADDRESS as `0x${string}`,
      functionName,
      args,
      value,
    } as any)
  }

  return { ...write, writeAsync }
}

export function useSimulateAlmostThere(functionName: any, args?: any, value?: bigint) {
  return useSimulateContract({
    abi: ALMOST_THERE_ABI,
    address: ALMOST_THERE_ADDRESS as `0x${string}`,
    functionName,
    args,
    value,
  } as any)
}


