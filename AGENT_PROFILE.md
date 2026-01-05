# Agent Profile for VS Code AI

## Persona

- Name: GitHub Copilot (GPT-5.1-Codex-Max)
- Role: React Native and Expo expert with years of experience in both bare RN and Expo Router projects.
- Tone: concise, pragmatic, collaborative. Default to brief answers; add structure only when it helps scanability.
- Safety: decline harmful/abusive requests. Avoid non-ASCII unless already present and justified.

## Project Context

- App type: Expo Router tabs app with safe-area aware screens (loading, swipe, rules). All assets are local; no network fetches.
- Product note: bias-game is a swipe game that surfaces inclusive vs biased statements; cards are jokes/stories/images, not people.
- Key screens (current):
  - Loading: [app/loading.tsx](app/loading.tsx) with animated colorful blobs, preloads card assets, enforces 3s minimum before redirect.
  - Swipe: [app/(tabs)/index.tsx](app/(tabs)/index.tsx) uses AnimatedStack + card-factory to generate infinite local cards (10 initial, +3 every 3 swipes), persists deck state per language, left counter glow every 10, random match text on right swipe.
  - Rules: [app/(tabs)/rules.tsx](app/(tabs)/rules.tsx) localized copy, language pills (EN/FR/PT-BR), safe-area layout.
- i18n: [hooks/use-i18n.tsx](hooks/use-i18n.tsx) with AsyncStorage persistence, device locale detect, JSON resources in assets/i18n (en/fr/pt-BR), wired via app/_layout provider.
- Notifications: [utils/notification-scheduler.ts](utils/notification-scheduler.ts) schedules hourly local notifications (heat 0.0 from 5AM-10PM, heat 1.0 from 11PM-4AM) using `expo-notifications`.
- Assets/data: jokes per language in [assets/data/jokes.ts](assets/data/jokes.ts); AVIF deck in [assets/images/cards/compressed](assets/images/cards/compressed); overlay icons LIKE/nope; launch image [assets/images/launch.png](assets/images/launch.png) configured in app.json.
- Navigation/layout: [app/_layout.tsx](app/_layout.tsx) wraps GestureHandlerRootView, ThemeProvider, I18nProvider, stack initial route loading. Tabs defined in [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx) for Swipe + Rules with localized labels/icons.

- components/ — UI building blocks.
  - Theming: [components/themed-text.tsx](components/themed-text.tsx), [components/themed-view.tsx](components/themed-view.tsx).
  - Gestures/stack: [components/tinder/animated-stack.tsx](components/tinder/animated-stack.tsx); card rendering now uses local jokes/images (see swipe screen + card-factory).
  - UX helpers: haptic tab, external link, collapsible, icon-symbol mapping.
- assets/
  - data: legacy users kept but unused for cards; active jokes in [assets/data/jokes.ts](assets/data/jokes.ts).
  - images: AVIF deck under cards/compressed; launch.png; overlays LIKE.png / nope.png.
- hooks: theming helpers + i18n provider/persistence.
- constants: theme colors and platform fonts.

## Detailed File Explanations

### app/_layout.tsx (root)

Root navigation wrapper. Uses GestureHandlerRootView to enable gestures, ThemeProvider with light/dark themes from useColorScheme, declares Stack with tabs + modal, and StatusBar setup. Entry point for Expo Router navigation.

### app/modal.tsx

Simple modal screen showing a title and a link back to root using expo-router Link, using themed text/view for consistent colors.

### app/(tabs)/_layout.tsx

Tabs: Swipe + Rules, localized titles, icons flame/book, haptic button, header hidden.

### app/(tabs)/index.tsx (Swipe game)

- Uses `card-factory` to generate/persist infinite cards (10 initial, +3 per 3 swipes) with no reuse until pool cycles; per-language deck state via AsyncStorage.
- Left counter glows every 10; right swipe random match; i18n strings for counter/match texts; safe-area container.
- Renders local images/jokes only; uses AnimatedStack gesture engine.

### app/(tabs)/rules.tsx

- Localized rules bullets, language pills (EN/FR/PT-BR), CTA to swipe, safe-area padding.

### app/loading.tsx

- Animated colorful blobs, asset preload, 3s minimum display before redirect to tabs.

### app/_layout.tsx

- Root stack with loading as initial; wraps GestureHandlerRootView, I18nProvider, ThemeProvider; tabs + modal routes.

### components/tinder/animated-stack.tsx (Swipe engine)

- Props: data array, renderItem, optional onSwipeLeft/onSwipeRight.
- State: currentIndex; shared values: translateX; derived rotate; next card scale/opacity; overlay opacities.
- Gesture: GestureDetector with Pan; onUpdate sets translateX; onEnd checks velocity (threshold SWIPE_VELOCITY), springs card off-screen with velocity, resets translate and advances index modulo total; invokes left/right callbacks with swiped item. Supports 0/1+ items, keys current/next views for remounting.
- Rendering: next card behind (pointerEvents none), current card on top with LIKE/nope overlays and provided renderItem.

### components/tinder/card.tsx

Presentational profile card: ImageBackground with user.image; shows name and bio overlaid; rounded corners, shadow, and padding.

### components/themed-text.tsx

Themed Text wrapper selecting color from useThemeColor; variants default/title/subtitle/semibold/link with sizes/weights.

### components/themed-view.tsx

View wrapper applying themed background color from useThemeColor.

### components/hello-wave.tsx

Animated emoji using Reanimated web-style animation props for a quick waving effect.

### components/parallax-scroll-view.tsx

Parallax header ScrollView: uses useAnimatedRef + useScrollOffset to translate/scale header based on scroll, themed background, and wraps content in ThemedView.

### components/external-link.tsx

Wrapper around expo-router Link; on native prevents default and opens URL in in-app browser via openBrowserAsync; target _blank on web.

### components/haptic-tab.tsx

Custom tab button; onPressIn triggers light haptic feedback on iOS via expo-haptics before delegating to original handler.

### components/ui/collapsible.tsx

Disclosure widget: toggles isOpen; heading shows chevron icon rotated when open; renders children in indented ThemedView.

### components/ui/icon-symbol.tsx and icon-symbol.ios.tsx

- iOS: icon-symbol.ios.tsx uses SymbolView with tintColor/weight.
- Android/web: icon-symbol.tsx maps SF Symbol names to MaterialIcons equivalents for consistent icons.

### assets/data/jokes.ts

Localized joke/story bank powering card generation (no translations reused across languages).

### constants/theme.ts

Defines Colors for light/dark (text/background/tints/icons) and platform font family names via Platform.select.

### hooks/use-color-scheme.ts and use-color-scheme.web.ts

Platform hook re-export (native) and web-safe hydration-aware variant returning light until hydrated to avoid mismatch.

### hooks/use-theme-color.ts

Chooses theme color by name with optional overrides per theme; uses useColorScheme and Colors map.

## Working Agreements

- Prefer apply_patch for single-file edits; avoid destructive git commands.
- Keep comments minimal and purposeful; maintain ASCII.
- When citing files/lines in replies, use markdown links with workspace-relative paths and #L references.
- For frontend tasks, aim for intentional design (avoid generic defaults) if relevant.

## Typical Commands

- Install: npm install
- Run: npx expo start

## Current status / TODO

- Done: i18n (EN/FR/PT-BR) with persistence; safe-area screens (loading/swipe/rules); infinite local card generation with persistence; AVIF asset pipeline + compressed deck; launch/splash image configured; navigation reduced to Swipe+Rules.

## Testing/Verification

- After gesture or navigation changes, ensure GestureHandlerRootView stays at app/_layout.tsx root.

## Response Style

- Lead with outcome/changes; bullet important points; suggest next steps only when natural.
