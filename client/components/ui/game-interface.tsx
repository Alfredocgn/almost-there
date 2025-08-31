import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Eye, MapPin } from "lucide-react";
import { TreasureMap } from "@/components/treasure-map";
import { useRouter } from "next/navigation";

interface GameInterfaceProps {
  gameId: string;
}

export function GameInterface({ gameId }: GameInterfaceProps) {
  const [playerTurns, setPlayerTurns] = useState(5);
  const router = useRouter();
  const [selectedMainSquare, setSelectedMainSquare] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [userCurrentSelection, setUserCurrentSelection] = useState<
    Array<{ x: number; y: number }>
  >([]);
  const [usersSubmitted, setUsersSubmitted] = useState<
    Array<{ x: number; y: number }>
  >([]);
  const maxPointsPerGame = 50;
  const pointCost = 0.001;

  const handleTurnUsed = () => {
    setPlayerTurns((prev) => Math.max(0, prev - 1));
  };

  const handleTurnsChanged = (newTurns: number) => {
    setPlayerTurns(newTurns);
  };

  const clearCart = () => {
    setUserCurrentSelection([]);
  };

  const submitCart = async () => {
    if (userCurrentSelection.length === 0) return;

    try {
      const submittedCount = userCurrentSelection.length;
      setUsersSubmitted([...usersSubmitted, ...userCurrentSelection]);
      setUserCurrentSelection([]);
      alert(`Successfully submitted ${submittedCount} points to the contract!`);
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
    <div className="px-4 py-4">
      <div className="max-w-sm mx-auto">
        <Card className="bg-[#d9f3ff] min-h-[95vh] flex flex-col">
          {/* Header con background */}
          <CardHeader
            className="h-16 p-0 m-0 relative"
            style={{
              backgroundImage: "url('/lobby-header.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Título superpuesto */}
            <div className="absolute inset-0 flex items-center justify-between px-3">
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
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Mapa del tesoro */}
            <div className=" relative bg-gray-50">
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
            <div className="flex flex-row items-center justify-between p-4">
              <Button
                onClick={() => console.log("submit")}
                className="w-[50%] bg-[#ffe460] cursor-pointer hover:bg-[#ffd700] text-black border-2 border-black"
                size="lg"
              >
                {`Select (${totalFlags})`}
              </Button>
              <div className="flex flex-row gap-2">
                <img
                  src="/coin-png.png"
                  alt="Coin"
                  className="w-8 h-8 object-contain"
                />
                <div className="flex flex-col">
                  <p className="text-xs">0.1 USDC/guess</p>
                  <p className="text-xs">total: {cartTotal.toFixed(2)} USDC</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center pb-4">
              <Button
                onClick={() => router.push("/lobby")}
                className="cursor-pointer w-[80%] bg-[#d9d9d9] hover:bg-[#e5e5e5] text-white border-2 border-black"
                size="lg"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
