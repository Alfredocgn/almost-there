import type React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Zap, MapPin } from "lucide-react";
import { GameCard } from "./game-card";

interface GameLobbyProps {
  onJoinGame: () => void;
  gameData?: {
    playersNeeded: number;
    currentPlayers: number;
    playerTurns: number;
    prizePool: string;
  };
  title?: string;
  subtitle?: string;
}

export function GameLobby({
  onJoinGame,
  gameData = {
    playersNeeded: 6,
    currentPlayers: 3,
    playerTurns: 5,
    prizePool: "0.5 ETH",
  },
  title = "Colegiales Treasure Hunt",
  subtitle = "Join the multiplayer adventure",
}: GameLobbyProps) {
  const isGameFull = gameData.currentPlayers >= gameData.playersNeeded;

  return (
    <div className="px-4 py-4">
      <div className=" max-w-sm mx-auto">
        <Card className="bg-[#d9f3ff] ">
          <CardHeader
            className=" h-16 p-0 m-0"
            style={{
              backgroundImage: "url('/lobby-header.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></CardHeader>
          <CardTitle className="flex items-center justify-center ">
            <span
              style={{ backgroundColor: "#3cbaf7" }}
              className="text-lg text-white font-semibold px-4 py-2 rounded-xl"
            >
              Game Lobby
            </span>
          </CardTitle>
          <CardContent className="space-y-4">
            <GameCard
              imageUrl="/mini-colegiales.jpeg"
              location="Colegiales"
              country="Buenos Aires, Argentina"
              players={{
                current: gameData.currentPlayers,
                max: gameData.playersNeeded,
              }}
              prizePool={gameData.prizePool}
              finishesIn="2h 30m"
              onJoin={onJoinGame}
            />
          </CardContent>
          <CardTitle className="flex items-center justify-center ">
            <span
              style={{ backgroundColor: "#3cbaf7" }}
              className="text-lg text-white font-semibold px-4 py-2 rounded-xl"
            >
              Previous Games
            </span>
          </CardTitle>
          <CardContent className="space-y-4">
            <GameCard
              imageUrl="/mini-colegiales.jpeg"
              location="Palermo"
              country="Buenos Aires, Argentina"
              players={{
                current: gameData.currentPlayers,
                max: gameData.playersNeeded,
              }}
              prizePool={gameData.prizePool}
              finishesIn="2h 30m"
              onJoin={onJoinGame}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
