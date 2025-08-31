import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameCard } from "./game-card";

interface Game {
  id: string;
  name: string;
  location: string;
  country: string;
  status: string;
  currentPlayers: number;
  playersNeeded: number;
  prizePool: string;
  finishesIn: string;
  imageUrl: string;
}

interface GameLobbyProps {
  games: Game[];
  onJoinGame: (gameId: string) => void;
}

export function GameLobby({ games, onJoinGame }: GameLobbyProps) {
  return (
    <div className="px-4 py-4">
      <div className="max-w-sm mx-auto">
        <Card className="bg-[#d9f3ff]">
          <CardHeader
            className="h-16 p-0 m-0"
            style={{
              backgroundImage: "url('/lobby-header.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></CardHeader>

          <CardContent className="space-y-4 pt-4">
            {games.map((game) => (
              <GameCard
                key={game.id}
                imageUrl={game.imageUrl}
                location={game.location}
                country={game.country}
                players={{
                  current: game.currentPlayers,
                  max: game.playersNeeded,
                }}
                prizePool={game.prizePool}
                finishesIn={game.finishesIn}
                onJoin={() => onJoinGame(game.id)}
                disabled={game.status === "Finished"}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
