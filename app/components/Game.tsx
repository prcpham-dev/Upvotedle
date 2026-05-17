"use client";

import { useGameLogic } from "@/src/hooks/useGameLogic";

export function Game() {
  const {
    gameState,
    currentRound,
    score,
    guessHistory,
    hasPlayedToday,
    isLoading,
    loadError,
    activeRound,
    totalRounds,
    startGame,
    handleGuess,
    loadDailyData,
    generateShareText,
  } = useGameLogic();

  const copyShareText = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      alert("Results copied to clipboard!");
    } catch {
      alert(text);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
        <p className="text-lg text-zinc-600">Loading today&apos;s puzzle…</p>
        <p className="mt-2 text-sm text-zinc-400">Fetching posts from Reddit</p>
      </main>
    );
  }

  if (loadError && !hasPlayedToday) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 bg-zinc-100 p-6">
        <h1 className="text-2xl font-bold text-orange-600">Redditdle</h1>
        <p className="text-center text-zinc-700">{loadError}</p>
        <button
          type="button"
          onClick={loadDailyData}
          className="rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white hover:bg-orange-600"
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 bg-zinc-100 p-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-orange-600">Redditdle</h1>
        <p className="text-sm text-zinc-500">
          Which post has more upvotes — Post B vs Post A?
        </p>
      </header>

      {gameState === "START" && (
        <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow">
          {hasPlayedToday ? (
            <>
              <p className="text-center text-zinc-700">
                You&apos;ve already played today. Come back tomorrow!
              </p>
              <p className="text-center text-sm text-zinc-500">
                Clear{" "}
                <code className="rounded bg-zinc-100 px-1">redditdle_lastPlayed</code>{" "}
                in devtools to replay.
              </p>
            </>
          ) : totalRounds > 0 ? (
            <>
              <p className="text-center text-zinc-700">
                {totalRounds} rounds. Guess whether Post B has more upvotes than Post A.
              </p>
              <button
                type="button"
                onClick={startGame}
                className="rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white hover:bg-orange-600"
              >
                Start Game
              </button>
            </>
          ) : null}
        </section>
      )}

      {gameState === "PLAYING" && activeRound && (
        <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow">
          <p className="text-center text-sm font-medium text-zinc-500">
            Round {currentRound + 1} / {totalRounds} · {activeRound.subreddit}
          </p>
          <p className="text-center text-sm text-zinc-600">
            Score: {score} · History:{" "}
            {guessHistory.map((c, i) => (
              <span key={i}>{c ? "🟩" : "🟥"}</span>
            ))}
          </p>

          <div className="flex flex-col gap-3">
            <article className="rounded-lg border border-zinc-200 p-4">
              <p className="text-xs font-semibold uppercase text-zinc-400">Post A</p>
              <p className="font-medium">{activeRound.postA.title}</p>
              <p className="text-sm text-zinc-500">??? upvotes</p>
            </article>
            <article className="rounded-lg border border-zinc-200 p-4">
              <p className="text-xs font-semibold uppercase text-zinc-400">Post B</p>
              <p className="font-medium">{activeRound.postB.title}</p>
              <p className="text-sm text-zinc-500">??? upvotes</p>
            </article>
          </div>

          <p className="text-center text-sm text-zinc-600">
            Does Post B have more upvotes than Post A?
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleGuess(false)}
              className="flex-1 rounded-lg border-2 border-zinc-300 px-4 py-3 font-semibold hover:bg-zinc-50"
            >
              No / Lower
            </button>
            <button
              type="button"
              onClick={() => handleGuess(true)}
              className="flex-1 rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white hover:bg-orange-600"
            >
              Yes / Higher
            </button>
          </div>
        </section>
      )}

      {gameState === "GAME_OVER" && (
        <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow">
          <h2 className="text-center text-xl font-bold">Game Over</h2>
          <p className="text-center text-2xl font-semibold">
            {score} / {totalRounds}
          </p>
          <p className="text-center text-2xl tracking-widest">
            {guessHistory.map((correct, i) => (
              <span key={i}>{correct ? "🟩" : "🟥"}</span>
            ))}
          </p>
          <pre className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600">
            {generateShareText()}
          </pre>
          <button
            type="button"
            onClick={copyShareText}
            className="rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white hover:bg-orange-600"
          >
            Copy Share Text
          </button>
        </section>
      )}
    </main>
  );
}

