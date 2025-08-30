"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Users, Zap, ArrowLeft, Eye, MapPin } from "lucide-react";
import { TreasureMap } from "@/components/treasure-map";
import { LandingCard } from "@/components/ui/landing-card";
import { GameLobby } from "@/components/ui/game-lobby";

const mockGameData = {
  playersNeeded: 6,
  currentPlayers: 3,
  playerTurns: 5,
  prizePool: "0.5 ETH",
};

export default function TreasureHuntGame() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [gameState, setGameState] = useState<"lobby" | "playing">("lobby");
  const [playerTurns, setPlayerTurns] = useState(mockGameData.playerTurns);
  const [selectedMainSquare, setSelectedMainSquare] = useState<{
    x: number;
    y: number;
  } | null>(null);
  // Absolute coordinate model for points
  const [userCurrentSelection, setUserCurrentSelection] = useState<
    Array<{ x: number; y: number }>
  >([]); // in cart
  const [usersSubmitted, setUsersSubmitted] = useState<
    Array<{ x: number; y: number }>
  >([]); // submitted
  const maxPointsPerGame = 50;
  const pointCost = 0.001; // ETH per point

  const handleTurnUsed = () => {
    setPlayerTurns((prev) => Math.max(0, prev - 1));
  };

  const handleTurnsChanged = (newTurns: number) => {
    setPlayerTurns(newTurns);
  };

  const handleJoinGame = () => {
    setGameState("playing");
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true);
      setAddress("0x1234...5678");
      setIsConnecting(false);
    }, 1000);
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress("");
  };

  const clearCart = () => {
    setUserCurrentSelection([]);
  };

  const submitCart = async () => {
    if (userCurrentSelection.length === 0) return;

    try {
      const toSubmit = userCurrentSelection.length;
      setUsersSubmitted([...usersSubmitted, ...userCurrentSelection]);
      setUserCurrentSelection([]);
      alert(`Successfully submitted ${toSubmit} points to the contract!`);
    } catch (error) {
      console.error("[v0] Contract submission failed:", error);
      alert("Failed to submit to contract. Please try again.");
    }
  };

  const availablePoints =
    maxPointsPerGame - usersSubmitted.length - userCurrentSelection.length;
  const cartSize = userCurrentSelection.length;
  const totalFlags = usersSubmitted.length;
  const cartTotal = cartSize * pointCost;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {!isConnected ? (
        <LandingCard
          onPlay={connectWallet}
          onShowInstructions={() => console.log("show instructions")}
        />
      ) : gameState === "playing" ? (
        <div className="flex flex-col h-screen max-w-sm mx-auto bg-white">
          {/* Compact Mobile Header */}
          <div className="bg-white border-b px-3 py-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-600 to-orange-600 rounded-md flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-white" />
                </div>
                <h1 className="text-sm font-bold text-amber-900">
                  Buenos Aires Hunt
                </h1>
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
              userCurrentSelection={userCurrentSelection}
              setUserCurrentSelection={setUserCurrentSelection}
              usersSubmitted={usersSubmitted}
              setUsersSubmitted={setUsersSubmitted}
            />
          </div>

          {/* Compact Bottom Actions */}
          <div className="bg-white border-t px-3 py-2 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-amber-600 font-medium">
                  {cartSize} in cart
                </span>
                <span className="text-green-600 font-medium">
                  {totalFlags} submitted
                </span>
                <span className="text-gray-500">
                  {availablePoints}/{maxPointsPerGame} left
                </span>
              </div>
              <span className="font-mono text-sm font-bold">
                {cartTotal.toFixed(3)} ETH
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={submitCart}
                disabled={cartSize === 0}
                size="sm"
                className="flex-1 h-8"
              >
                Submit ({cartSize})
              </Button>
              <Button
                onClick={clearCart}
                disabled={userCurrentSelection.length === 0}
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
        <GameLobby
          onJoinGame={handleJoinGame}
          gameData={mockGameData}
          title="Colegiales Treasure Hunt"
          subtitle="Join the multiplayer adventure"
        />
      )}
    </div>
  );
}
