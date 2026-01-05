# Bia's Game (Expo Router)

Colorful, offline-first swipe game with localized rules and infinite joke/story cards. Screens: Launch/Loading → Swipe → Rules. All assets are local (AVIF deck), safe-area aware for modern devices.

## Quick start

- Install deps: `npm install`
- Run: `npx expo start`

## What’s implemented

- Launch screen: [assets/images/launch.png](assets/images/launch.png) wired in [app.json](app.json) via `expo-splash-screen` (cover, dark-friendly).
- Loading screen: [app/loading.tsx](app/loading.tsx) with animated blobs, local asset preload, 3s minimum display.
- Swipe screen: [app/(tabs)/index.tsx](app/(tabs)/index.tsx) uses `card-factory` for infinite local cards (10 initial, +3 every 3 swipes), per-language deck persistence, left counter glow every 10, random match text on right swipe.
- Rules screen: [app/(tabs)/rules.tsx](app/(tabs)/rules.tsx) with localized bullets and language pills (EN/FR/PT-BR).
- i18n: [hooks/use-i18n.tsx](hooks/use-i18n.tsx) with AsyncStorage persistence and device locale detect; locale strings in [assets/i18n](assets/i18n).
- Assets: AVIF deck at [assets/images/cards/compressed](assets/images/cards/compressed); local jokes/stories in [assets/data/jokes.ts](assets/data/jokes.ts); no remote fetches.
- Navigation/layout: tabs for Swipe + Rules in [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx); root stack starts at loading in [app/_layout.tsx](app/_layout.tsx#L1-L34); safe-area wrappers on primary screens.

## Development notes

- Infinite deck: generated locally, no reuse until pool cycles; adds 3 new cards every 3 swipes after the initial 10.
- Languages: English, French, Portuguese (Brazil). Language persisted via AsyncStorage; defaults to device locale.
- Safe areas: key screens use `react-native-safe-area-context` padding.

## Commands

- Install: `npm install`
- Start dev: `npx expo start`
- Convert new card images to AVIF: `./scripts/convert-to-avif.sh` (reads `assets/images/cards/original`, writes `compressed`, keeps originals).
