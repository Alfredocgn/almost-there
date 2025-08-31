'use client'

import { useReadContract, type UseReadContractParameters } from 'wagmi'
import { ALMOST_THERE_ADDRESS, ALMOST_THERE_ABI } from '@/lib/contracts'

export function useAlmostThereRead<
  const TAbi extends readonly unknown[] = typeof ALMOST_THERE_ABI,
  TFunctionName extends import('viem').ContractFunctionName<TAbi, 'pure' | 'view'> = import('viem').ContractFunctionName<TAbi, 'pure' | 'view'>,
  TArgs extends import('viem').ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = import('viem').ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName>,
  TSelected = unknown
>(args: Omit<UseReadContractParameters<TAbi, TFunctionName, TArgs, any, TSelected>, 'abi' | 'address'>) {
  const query = {
    enabled: Boolean(ALMOST_THERE_ADDRESS) && (args as any).query?.enabled !== false,
    ...(args as any).query,
  }

  return useReadContract<TAbi, TFunctionName, TArgs, any, TSelected>({
    abi: ALMOST_THERE_ABI,
    address: ALMOST_THERE_ADDRESS as `0x${string}`,
    ...(args as any),
    query,
  })
}


