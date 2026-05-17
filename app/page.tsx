"use client";

import React, { useState } from "react";
import GameSetup from "@/components/GameSetup/GameSetup";
import GameBoard from "@/components/GameBoard/GameBoard";
import { RoundData } from "@/types/types";

export default function Home() {
  const [gameState, setGameState] = useState<"setup" | "loading" | "playing" | "error">("setup");
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const handleStartDaily = async () => {
    setGameState("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/daily");
      if (!response.ok) {
        throw new Error("Failed to fetch daily puzzle data.");
      }

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      setRounds(json);
      setGameState("playing");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An unexpected error occurred.");
      setGameState("setup");
    }
  };

  const handleStartCustom = async (subreddit: string) => {
    setGameState("loading");
    setErrorMessage("");

    try {
      const promises = [];
      const numRounds = 10;
      for (let i = 1; i <= numRounds; i++) {
        promises.push(
          fetch(`/api/round?subreddit=${encodeURIComponent(subreddit)}&round=${i}`).then(res => {
            if (!res.ok) throw new Error("Failed to fetch subreddit data. Please check the spelling.");
            return res.json();
          })
        );
      }

      const results = await Promise.all(promises);

      const generatedRounds: RoundData[] = results.map(res => {
        if (res.error) throw new Error(res.error);
        return res[0];
      });

      setRounds(generatedRounds);
      setGameState("playing");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An unexpected error occurred.");
      setGameState("error");
    }
  };

  const handlePlayAgain = () => {
    setGameState("setup");
    setRounds([]);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {gameState === "setup" && (
        <GameSetup
          onStartDaily={handleStartDaily}
          onStartCustom={handleStartCustom}
        />
      )}

      {gameState === "loading" && (
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-xl text-gray-300">Fetching Reddit Posts...</p>
        </div>
      )}
      {gameState === "playing" && (
        <GameBoard rounds={rounds} onPlayAgain={handlePlayAgain} />
      )}
    </main>
  );
}
