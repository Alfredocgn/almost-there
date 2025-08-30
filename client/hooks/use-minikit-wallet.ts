'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { coinbaseWallet } from 'wagmi/connectors'

export function useMiniKitWallet() {
  const { address, isConnected } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [isConnecting, setIsConnecting] = useState(false)

  const connectWallet = async () => {
    setIsConnecting(true)
    try {
      await connect({
        connector: coinbaseWallet({
          appName: 'Treasure Hunt',
          preference: 'smartWalletOnly'
        })
      })
    } catch (error) {
      console.error('Wallet connection error:', error)
      alert('Failed to connect wallet. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    disconnect()
  }

  const sendTransaction = async (to: string, value: string, data?: string) => {
    if (!isConnected) {
      throw new Error('Wallet not connected')
    }

    // This would use wagmi's transaction hooks in a real implementation
    console.log('Sending transaction:', { to, value, data })
    return { success: true }
  }

  // Check if we're in a frame/miniapp context
  const isMiniKitAvailable = typeof window !== 'undefined' &&
    (window.top !== window.self ||
     window.location !== window.parent.location)

  return {
    isConnected,
    address,
    isConnecting: isConnecting || isPending,
    connectWallet,
    disconnectWallet,
    sendTransaction,
    isMiniKitAvailable
  }
}
