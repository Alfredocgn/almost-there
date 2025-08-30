"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, Users, Zap, ArrowLeft, Eye, MapPin } from "lucide-react"
import { TreasureMap } from "@/components/treasure-map"

const mockGameData = {
  playersNeeded: 6,
  currentPlayers: 3,
  playerTurns: 5,
  prizePool: "0.5 ETH",
}

export default function TreasureHuntGame() {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [gameState, setGameState] = useState<"lobby" | "playing">("lobby")
  const [playerTurns, setPlayerTurns] = useState(mockGameData.playerTurns)
  const [selectedMainSquare, setSelectedMainSquare] = useState<{ x: number; y: number } | null>(null)
  const [cartFlags, setCartFlags] = useState<Set<string>>(new Set()) // Pending flags in cart
  const [placedFlags, setPlacedFlags] = useState<Set<string>>(new Set()) // Submitted flags
  const [submittedPointsCount, setSubmittedPointsCount] = useState(0) // Total submitted across all transactions
  const maxPointsPerGame = 50
  const pointCost = 0.001 // ETH per point

  const handleTurnUsed = () => {
    setPlayerTurns((prev) => Math.max(0, prev - 1))
  }

  const handleTurnsChanged = (newTurns: number) => {
    setPlayerTurns(newTurns)
  }

  const handleJoinGame = () => {
    setGameState("playing")
  }

  const connectWallet = async () => {
    setIsConnecting(true)
    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true)
      setAddress("0x1234...5678")
      setIsConnecting(false)
    }, 1000)
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setAddress("")
  }

  const clearCart = () => {
    setCartFlags(new Set())
  }

  const submitCart = async () => {
    if (cartFlags.size === 0) return

    try {
      console.log("[v0] Submitting to contract:", Array.from(cartFlags))

      const newPlacedFlags = new Set([...placedFlags, ...cartFlags])
      setPlacedFlags(newPlacedFlags)
      setSubmittedPointsCount((prev) => prev + cartFlags.size)

      setCartFlags(new Set())

      alert(`Successfully submitted ${cartFlags.size} points to the contract!`)
    } catch (error) {
      console.error("[v0] Contract submission failed:", error)
      alert("Failed to submit to contract. Please try again.")
    }
  }

  const availablePoints = maxPointsPerGame - submittedPointsCount - cartFlags.size
  const cartSize = cartFlags.size
  const totalFlags = placedFlags.size
  const cartTotal = cartSize * pointCost

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {!isConnected ? (
        <div className="px-4 py-8">
          <div className="max-w-sm mx-auto">
            <Card className="text-center">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Connect Your Wallet</CardTitle>
                <CardDescription className="text-sm">
                  Connect your Coinbase Wallet to join the treasure hunt on Base
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={connectWallet} disabled={isConnecting} className="w-full" size="lg">
                  <Wallet className="w-5 h-5 mr-2" />
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
                <p className="text-xs text-muted-foreground">Base mini app for Coinbase Wallet</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : gameState === "playing" ? (
        <div className="flex flex-col h-screen max-w-sm mx-auto bg-white">
          {/* Compact Mobile Header */}
          <div className="bg-white border-b px-3 py-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-600 to-orange-600 rounded-md flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-white" />
                </div>
                <h1 className="text-sm font-bold text-amber-900">Buenos Aires Hunt</h1>
              </div>
              <div className="flex items-center gap-2">
                {selectedMainSquare && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMainSquare(null)}
                    className="h-6 px-2 text-xs bg-amber-100 hover:bg-amber-200"
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Back
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Full Screen Map Area */}
          <div className="flex-1 relative bg-gray-50">
            <TreasureMap
              playerTurns={playerTurns}
              onTurnUsed={handleTurnUsed}
              onTurnsChanged={handleTurnsChanged}
              selectedMainSquare={selectedMainSquare}
              setSelectedMainSquare={setSelectedMainSquare}
              cartFlags={cartFlags}
              setCartFlags={setCartFlags}
              placedFlags={placedFlags}
              setPlacedFlags={setPlacedFlags}
              submittedPointsCount={submittedPointsCount}
              setSubmittedPointsCount={setSubmittedPointsCount}
            />
          </div>

          {/* Compact Bottom Actions */}
          <div className="bg-white border-t px-3 py-2 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-amber-600 font-medium">{cartSize} in cart</span>
                <span className="text-green-600 font-medium">{totalFlags} submitted</span>
                <span className="text-gray-500">
                  {availablePoints}/{maxPointsPerGame} left
                </span>
              </div>
              <span className="font-mono text-sm font-bold">{cartTotal.toFixed(3)} ETH</span>
            </div>

            <div className="flex gap-2">
              <Button onClick={submitCart} disabled={cartSize === 0} size="sm" className="flex-1 h-8">
                Submit ({cartSize})
              </Button>
              <Button
                onClick={clearCart}
                disabled={cartFlags.size === 0}
                variant="outline"
                size="sm"
                className="h-8 px-3 bg-transparent"
              >
                Clear
              </Button>
              <Button
                onClick={() => {}}
                disabled={availablePoints === 0}
                variant="outline"
                size="sm"
                className="h-8 px-3"
              >
                <Eye className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-amber-900 mb-2">Colegiales Treasure Hunt</h2>
            <p className="text-amber-700 text-sm">Join the multiplayer adventure</p>
          </div>

          <div className="space-y-4 max-w-sm mx-auto">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5" />
                  Game Lobby
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Players</span>
                  <Badge variant="secondary">
                    {mockGameData.currentPlayers}/{mockGameData.playersNeeded}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Starts in</span>
                  <Badge variant="outline" className="font-mono">
                    {mockGameData.currentPlayers}/{mockGameData.playersNeeded} Players
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Prize Pool</span>
                  <Badge variant="secondary" className="text-accent">
                    <Zap className="w-4 h-4 mr-1" />
                    {mockGameData.prizePool}
                  </Badge>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleJoinGame}
                  disabled={mockGameData.currentPlayers >= mockGameData.playersNeeded}
                >
                  {mockGameData.currentPlayers >= mockGameData.playersNeeded ? "Game Full" : "Join Game"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}