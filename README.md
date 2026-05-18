# Redditdle

Redditdle is a **Higher-Lower** game built for Reddit posts. Players are presented with two different Reddit posts side-by-side and must guess which post has a higher upvote count.

## Core Game Mechanics

*   **Higher / Lower Guessing**: Compare two Reddit posts and tap on the card you believe has more upvotes.
*   **Daily Puzzle**: Play a pre-selected 10-round set that resets daily. Every user globally gets the exact same set of challenges each day.
*   **Custom Games**:
    *   **Custom Subreddit**: Test your knowledge of specific communities (e.g., `r/BeAmazed`, `r/CrappyDesign`, or `r/mildlyinteresting`).
    *   **Deterministic Seeding**: Enter a custom seed to generate a repeatable set of rounds. Share your seed with friends to see who can get the higher score on the same challenges!
    *   **Endless Mode**: Play infinitely until you make a single wrong guess.
*   **Upvote Limits**: Customize the game's difficulty by configuring the minimum and maximum upvote thresholds in the settings dashboard.


## Codebase Structure

The project is built using **Next.js (App Router)**, **TypeScript**, and modular **Vanilla CSS**.

```text
├── app/
│   ├── api/
│   │   ├── daily/           # Handles the daily puzzle server-side logic
│   │   └── round/           # Fetches and processes individual game rounds
│   ├── page.tsx             # Main client entry point and game setup control flow
│   └── layout.tsx           # Global HTML metadata and font loader
├── components/              # Handel ui/ux
├── lib/
│   ├── reddit/              # Main Reddit logic engine
│   └── settings.ts          # Store settings
├── types/                   # Global TypeScript types
```


## Author

* [Percy Pham](https://github.com/prcpham-dev)
* [Minh Pham](https://github.com/Bubseatbubs)
* [Danny Pham](https://github.com/PhamDanny)
