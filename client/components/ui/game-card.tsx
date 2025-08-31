import type React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Clock } from "lucide-react";

interface GameCardProps {
  imageUrl: string;
  location: string;
  country: string;
  players: {
    current: number;
    max: number;
  };
  prizePool: string;
  finishesIn: string;
  onJoin: () => void;
  disabled?: boolean;
}

export function GameCard({
  imageUrl,
  location,
  country,
  players,
  prizePool,
  finishesIn,
  onJoin,
  disabled = false,
}: GameCardProps) {
  const isGameFull = players.current >= players.max;

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4">
        <div className="flex gap-3 mb-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={imageUrl}
              alt={location}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold  font-mono text-base">{location}</h3>
            <div className="flex items-center gap-1">
              <span className="text-base">🇦🇷</span>
              <p className="text-sm font-mono text-black">{country}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3 mb-4">
          {/* Players */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold">Players</span>
            </div>

            <span className="font-mono text-xs text-white bg-black rounded-md px-2 font-semibold">
              {players.current}
            </span>
          </div>

          {/* Prize Pool */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold">
                Prize Pool
              </span>
            </div>
            <span className="text-xs font-mono text-white bg-black rounded-md px-2  font-semibold">
              {prizePool}
            </span>
          </div>

          {/* Finishes In */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold">
                Finishes in
              </span>
            </div>
            <span className="text-xs  text-white bg-black rounded-md px-2  font-mono font-semibold">
              {finishesIn}
            </span>
          </div>
        </div>

        {/* Join Button */}
        <Button
          onClick={onJoin}
          disabled={disabled || isGameFull}
          className="w-full bg-[#ffe460] cursor-pointer hover:bg-[#ffd700] text-black border-2 border-black"
          size="lg"
        >
          {isGameFull ? "Game Full" : "Join Game"}
        </Button>
      </CardContent>
    </Card>
  );
}
