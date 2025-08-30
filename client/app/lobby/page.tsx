"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function LobbyPage() {
  const games = [
    { id: "123", name: "Buenos Aires Hunt", status: "Active", players: 3, needed: 6 },
    { id: "122", name: "Recoleta Run", status: "Finished", players: 6, needed: 6 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 px-4 py-6">
      <div className="max-w-sm mx-auto space-y-4">
        {games.map((g) => (
          <Card key={g.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="inline-flex w-6 h-6 items-center justify-center rounded-md bg-amber-600 text-white">
                  <MapPin className="w-4 h-4" />
                </span>
                {g.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{g.players}/{g.needed} Players</span>
              <Link href={`/game/${g.id}`}>
                <Button size="sm" className="h-8">{g.status === "Active" ? "Play" : "View"}</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


