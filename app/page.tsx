"use client";

import React, { useCallback, useEffect, useState } from "react";
import GameSetup from "@/components/GameSetup/GameSetup";
import GameBoard from "@/components/GameBoard/GameBoard";
import {
  DEFAULT_MAX_UPVOTES,
  DEFAULT_MIN_UPVOTES,
} from "@/lib/reddit/constants";
import {
  loadUpvoteLimits,
  saveUpvoteLimits,
  type UpvoteLimits,
} from "@/lib/settings";
import { RoundData } from "@/types/types";

const DEFAULT_LIMITS: UpvoteLimits = {
  minUpvotes: DEFAULT_MIN_UPVOTES,
  maxUpvotes: DEFAULT_MAX_UPVOTES,
};

function buildUpvoteLimitsQuery(limits: UpvoteLimits): string {
  const params = new URLSearchParams({
    minUpvotes: String(limits.minUpvotes),
    maxUpvotes: String(limits.maxUpvotes),
  });
  return params.toString();
}

export default function Home() {
  const [gameState, setGameState] = useState<"setup" | "loading" | "playing" | "error">("setup");
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [upvoteLimits, setUpvoteLimits] = useState<UpvoteLimits>(DEFAULT_LIMITS);

  useEffect(() => {
    setUpvoteLimits(loadUpvoteLimits());
  }, []);

  const handleUpvoteLimitsChange = useCallback((limits: UpvoteLimits) => {
    setUpvoteLimits(limits);
    saveUpvoteLimits(limits);
  }, []);

  const handleStartDaily = async () => {
    setGameState("loading");
    setErrorMessage("");

    const limits = loadUpvoteLimits();
    setUpvoteLimits(limits);

    try {
      const response = await fetch(`/api/daily?${buildUpvoteLimitsQuery(limits)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch daily puzzle data.");
      }

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      setRounds(json);
      setGameState("playing");
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
      setGameState("setup");
    }
  };

  const handleStartCustom = async (subreddit: string) => {
    setGameState("loading");
    setErrorMessage("");

    const limits = loadUpvoteLimits();
    setUpvoteLimits(limits);

    try {
      const numRounds = 10;
      const query = buildUpvoteLimitsQuery(limits);
      const promises = Array.from({ length: numRounds }, (_, index) =>
        fetch(
          `/api/round?subreddit=${encodeURIComponent(subreddit)}&round=${index + 1}&${query}`,
        ).then((res) => {
          if (!res.ok) {
            throw new Error(
              "Failed to fetch subreddit data. Please check the spelling.",
            );
          }
          return res.json();
        }),
      );

      const results = await Promise.all(promises);

      const generatedRounds: RoundData[] = results.map((res) => {
        if (res.error) throw new Error(res.error);
        return res[0];
      });

      setRounds(generatedRounds);
      setGameState("playing");
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
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
          upvoteLimits={upvoteLimits}
          onStartDaily={handleStartDaily}
          onStartCustom={handleStartCustom}
          onUpvoteLimitsChange={handleUpvoteLimitsChange}
          error={errorMessage}
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

      {gameState === "error" && (
        <GameSetup
          upvoteLimits={upvoteLimits}
          onStartDaily={handleStartDaily}
          onStartCustom={handleStartCustom}
          onUpvoteLimitsChange={handleUpvoteLimitsChange}
          error={errorMessage}
        />
      )}
    </main>
  );
}
