"use client";

import type React from "react";
import { useParams } from "next/navigation";
import { GameInterface } from "@/components/ui/game-interface";

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <GameInterface gameId={gameId} />
    </div>
  );
}
