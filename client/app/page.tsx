"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
      <LandingCard
        onPlay={() => router.push("/lobby")}
        onShowInstructions={() => console.log("show instructions")}
      />
    </div>
  );
}
