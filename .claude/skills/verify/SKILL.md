---
name: verify
description: Build/launch/drive recipe for verifying changes in this Vite + React portfolio at runtime
---

# Verifying this project

- Launch: `npm run dev` (background). Vite picks the next free port if 5173 is busy (check the task output for the URL, e.g. 5174).
- Drive with the Playwright MCP tools (`browser_navigate`, `browser_run_code_unsafe` for scripted flows + clipped screenshots).
- Robot/chat mood state can be inspected in dev without UI waiting games: in-page `await import('/src/lib/chat/activity.ts')` returns the same module instance the app uses — read `getEmote()`, `getMoodState()`, `isAsleep()`, signal timestamps directly.
- The robot canvas is inside `#chat`; `scrollIntoView` it so the R3F frameloop runs (`frameloop` is `never` while off-screen). The hover-detection box is a tighter region inside the canvas rect (~22% inset left, 15% right, 24% top), so aim pointer moves at the robot's torso center.
- The neutral emote cycle is timed (3.8s per emote, 12s sleep) — a full cycle to `zzz` takes ~23s with the cursor away from the robot and out of the chat input.
- Typecheck/build: `npx tsc -b --noEmit` / `npm run build`.
