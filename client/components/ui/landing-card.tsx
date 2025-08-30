import type React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, HelpCircle } from "lucide-react";

interface LandingCardProps {
  onPlay?: () => void;
  onShowInstructions?: () => void;
}

export function LandingCard({ onPlay, onShowInstructions }: LandingCardProps) {
  return (
    <div className="px-4 py-8">
      <div className="max-w-sm mx-auto">
        <Card
          className="text-center relative overflow-hidden min-h-[95vh] flex flex-col"
          style={{
            backgroundImage: "url('/landing-page-logo.png')",
            backgroundSize: "100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-[25%] z-0"
            style={{
              backgroundImage: "url('/landing-top.png')",
              backgroundSize: "100%",
              backgroundPosition: "center bottom",
              backgroundRepeat: "no-repeat",
            }}
          />

          <div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-[25%] z-0"
            style={{
              backgroundImage: "url('/landing-bottom.png')",
              backgroundSize: "100%",
              backgroundPosition: "center top",
              backgroundRepeat: "no-repeat",
            }}
          />
          <div className="flex-1"></div>
          <CardContent className="space-y-4 relative z-10">
            {onPlay && (
              <Button
                onClick={onPlay}
                className="cursor-pointer w-full bg-[#ffe460] hover:bg-[#ffd700] text-black border-2 border-black"
                size="lg"
              >
                PLAY
              </Button>
            )}
            {onShowInstructions && (
              <Button
                onClick={onShowInstructions}
                className="cursor-pointer w-full bg-[#d9d9d9] hover:[#e5e5e5]  text-black border-2 border-black"
                size="lg"
              >
                INSTRUCTIONS
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
