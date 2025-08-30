"use client";


import type React from "react";


import { useRouter } from "next/navigation";


import { LandingCard } from "@/components/ui/landing-card";


export default function TreasureHuntGame() {
  const router = useRouter();


  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <LandingCard
        onPlay={() => router.push("/lobby")}
        onShowInstructions={() => console.log("show instructions")}
      />

    </div>
  );
}

