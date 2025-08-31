"use client";
import { GameLobby } from "@/components/ui/game-lobby";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LobbyPage() {
  const router = useRouter();
  const games = [
    {
      id: "123",
      name: "Colegiales Hunt",
      location: "Colegiales",
      country: "Buenos Aires, Argentina",
      status: "Active",
      currentPlayers: 3,
      playersNeeded: 6,
      prizePool: "0.5 ETH",
      finishesIn: "2h 30m",
      imageUrl: "/mini-colegiales.jpeg",
    },
    {
      id: "124",
      name: "Recoleta Run",
      location: "Recoleta",
      country: "Buenos Aires, Argentina",
      status: "Active",
      currentPlayers: 2,
      playersNeeded: 6,
      prizePool: "0.3 ETH",
      finishesIn: "1h 45m",
      imageUrl: "/mini-recoleta.jpeg",
    },
    {
      id: "125",
      name: "Palermo Adventure",
      location: "Palermo",
      country: "Buenos Aires, Argentina",
      status: "Starting Soon",
      currentPlayers: 1,
      playersNeeded: 6,
      prizePool: "0.7 ETH",
      finishesIn: "45m",
      imageUrl: "/mini-palermo.jpeg",
    },
  ];

  const [gameState, setGameState] = useState<"lobby" | "playing">("lobby");

  const handleJoinGame = (gameId: string) => {
    router.push(`/game/${gameId}`);
  };

  return <GameLobby games={games} onJoinGame={() => handleJoinGame("123")} />;
}
