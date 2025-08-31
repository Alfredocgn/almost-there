'use client'

import { useReadContract, UseReadContractParameters } from 'wagmi'
import { ALMOST_THERE_ADDRESS, ALMOST_THERE_ABI } from '@/lib/contracts'

export function useAlmostThereRead<TData = unknown>(
  args: Omit<UseReadContractParameters, 'abi' | 'address'>
) {
  return useReadContract<TData>({
    abi: ALMOST_THERE_ABI,
    address: ALMOST_THERE_ADDRESS as `0x${string}`,
    ...args,
  })
}


