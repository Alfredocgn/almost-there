'use client'

import { OnchainKitProvider } from '@coinbase/onchainkit'
import { ReactNode } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

interface MiniKitProviderProps {
  children: ReactNode
}

const config = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'Treasure Hunt',
      preference: 'smartWalletOnly'
    })
  ],
  transports: {
    [base.id]: http()
  }
})

const queryClient = new QueryClient()

export function MiniKitProvider({ children }: MiniKitProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || "RapNJ0ankst9y4YwMY10XjQYlgvRUl24"}
          chain={base}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
