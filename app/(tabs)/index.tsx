import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Animated as RNAnimated, Easing as RNEasing, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import loveMessagesData from '@/assets/data/love_messages.json';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AnimatedStack } from '@/components/tinder/animated-stack';
import { Colors, Fonts } from '@/constants/theme';
import { useI18n } from '@/hooks/use-i18n';
import type { Card } from '@/utils/card-factory';
import { generateCards, resetDeck } from '@/utils/card-factory';

const INITIAL_BATCH = 10;
// const REFILL_EVERY_SWIPES = 3; // Unused constant removed
const REFILL_COUNT = 3;
const MATCH_PROBABILITY = 0.45;
const BASE_COUNTER_COLOR = '#0f172a';
const GLOW_COLOR = '#22c55e';
const SPRINT_DURATION_MS = 60_000;

export default function SwipeScreen() {
  const { t, lang } = useI18n();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [leftCount, setLeftCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [refilling, setRefilling] = useState(false);
  const [sprintEndsAt, setSprintEndsAt] = useState<number | null>(null);
  const [sprintRemaining, setSprintRemaining] = useState(0);
  const [confettiBursts, setConfettiBursts] = useState<{ id: number }[]>([]);
  const [loveFlash, setLoveFlash] = useState<{ text: string; day: string } | null>(null);
  const loveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confettiId = useRef(0);

    const calmLoveMessages = useMemo(() => {
      const list = loveMessagesData as { text: string; day: string; emoji: string; heat: number }[];
      return list.filter(item => item.heat < 1);
    }, []);

  const glow = useSharedValue(0);

  const counterStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(glow.value, [0, 1], [BASE_COUNTER_COLOR, GLOW_COLOR]),
    transform: [{ scale: 1 + glow.value * 0.06 }],
    shadowColor: GLOW_COLOR,
    shadowOpacity: 0.75 * glow.value,
    shadowRadius: 12 * glow.value,
  }));

  const triggerGlow = useCallback(() => {
    glow.value = 0;
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 180 }), withTiming(0, { duration: 180 })), 4);
  }, [glow]);

  const triggerConfetti = useCallback(() => {
    if (Math.random() >= 0.33) return;
    setConfettiBursts(prev => [...prev, { id: ++confettiId.current }]);
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setCards([]);
    setStatus(null);
    setLeftCount(0);
    setStreak(0);
    setBestStreak(0);
    setSprintEndsAt(null);
    setSprintRemaining(0);
    await resetDeck(lang);
    const { cards: firstBatch } = await generateCards(lang, INITIAL_BATCH);
    setCards(firstBatch);
    setLoading(false);
  }, [lang]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const maybeRefill = useCallback(async () => {
    if (refilling) return;
    setRefilling(true);
    const { cards: more } = await generateCards(lang, REFILL_COUNT);
    setCards(prev => [...prev, ...more]);
    setRefilling(false);
  }, [lang, refilling]);

  const handleAfterSwipe = useCallback(
    (match: boolean) => {
      setCards(prev => prev.slice(1));
      setStreak(prev => {
        const next = match ? prev + 1 : 0;
        setBestStreak(current => Math.max(current, next));
        return next;
      });
      if (match) {
        setLeftCount(0);
      }
      maybeRefill();
    },
    [maybeRefill],
  );

  const handleSwipeLeft = useCallback(() => {
    setStatus(null);
    setStreak(0);
    setLeftCount(prev => {
      const next = prev + 1;
      if (next > 0 && next % 10 === 0) {
        triggerGlow();
        triggerConfetti();
      }
      if (next > 0 && next % 15 === 0 && !sprintEndsAt) {
        const pick = calmLoveMessages[Math.floor(Math.random() * calmLoveMessages.length)];
        if (pick) {
          setLoveFlash({ text: pick.text, day: pick.day });
          if (loveTimer.current) clearTimeout(loveTimer.current);
          loveTimer.current = setTimeout(() => setLoveFlash(null), 5000);
        }
      }
      return next;
    });
    handleAfterSwipe(false);
  }, [calmLoveMessages, handleAfterSwipe, sprintEndsAt, triggerConfetti, triggerGlow]);

  const handleSwipeRight = useCallback(
    (card: Card) => {
      const isMatch = Math.random() < MATCH_PROBABILITY;
      setStatus(isMatch ? t('swipe.match') : t('swipe.noMatch'));
      handleAfterSwipe(isMatch);
    },
    [handleAfterSwipe, t],
  );

  const counterLabel = useMemo(() => t('swipe.counter', { count: leftCount }), [leftCount, t]);
  const streakLabel = useMemo(() => t('swipe.streak', { count: streak, best: bestStreak }), [bestStreak, streak, t]);
  const leftProgress = useMemo(() => Math.min(1, (leftCount % 10) / 10), [leftCount]);
  const sprintLabel = useMemo(() => {
    if (!sprintEndsAt) return t('swipe.sprint.start');
    if (sprintRemaining <= 0) return t('swipe.sprint.ended');
    return t('swipe.sprint.timeLeft', { seconds: sprintRemaining });
  }, [sprintEndsAt, sprintRemaining, t]);

  const toggleSprint = useCallback(() => {
    if (sprintEndsAt) {
      setSprintEndsAt(null);
      setSprintRemaining(0);
      return;
    }
    const end = Date.now() + SPRINT_DURATION_MS;
    setSprintEndsAt(end);
    setSprintRemaining(Math.ceil(SPRINT_DURATION_MS / 1000));
  }, [sprintEndsAt]);

  useEffect(() => {
    if (!sprintEndsAt) return undefined;
    const id = setInterval(() => {
      const remainingMs = sprintEndsAt - Date.now();
      const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
      setSprintRemaining(seconds);
      if (remainingMs <= 0) {
        setSprintEndsAt(null);
      }
    }, 300);
    return () => clearInterval(id);
  }, [sprintEndsAt]);

  useEffect(() => {
    return () => {
      if (loveTimer.current) clearTimeout(loveTimer.current);
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Animated.View style={[styles.counter, counterStyle]}>
            <ThemedText type="title" style={styles.counterText}>
              {counterLabel}
            </ThemedText>
          </Animated.View>
          {status && (
            <ThemedText type="subtitle" style={styles.status}>
              {status}
            </ThemedText>
          )}
          <View style={styles.progressRow}>
            <ThemedText style={styles.streakText}>{streakLabel}</ThemedText>
            <Pressable onPress={toggleSprint} style={styles.sprintButton}>
              <ThemedText style={styles.sprintText}>{sprintLabel}</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.deck}>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#a855f7" />
              <ThemedText style={styles.loadingText}>{t('swipe.empty')}</ThemedText>
            </View>
          ) : cards.length === 0 ? (
            <View style={styles.loading}>
              <ThemedText style={styles.loadingText}>{t('swipe.empty')}</ThemedText>
              {refilling && <ActivityIndicator size="small" color="#a855f7" style={{ marginTop: 8 }} />}
            </View>
          ) : (
            <AnimatedStack
              data={cards}
              renderItem={({ item }) => <CardView card={item} />}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />
          )}
        </View>

        {loveFlash && (
          <ThemedView style={styles.loveBanner}>
            <ThemedText type="subtitle" style={styles.loveTitle}>
              ❤️ {loveFlash.day}
            </ThemedText>
            <ThemedText style={styles.loveText}>{loveFlash.text}</ThemedText>
          </ThemedView>
        )}

        {confettiBursts.map(burst => (
          <ConfettiBurst key={burst.id} onDone={() => setConfettiBursts(prev => prev.filter(item => item.id !== burst.id))} />
        ))}

        <View style={styles.progressBarSection}>
          <ThemedText style={styles.progressLabel}>{t('swipe.progress', { current: leftCount % 10, target: 10 })}</ThemedText>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${leftProgress * 100}%` }]} />
          </View>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

function CardView({ card }: { card: Card }) {
  const { t } = useI18n();
  const kindLabel = useMemo(() => t(`card.kind.${card.kind}`), [card.kind, t]);

  return (
    <View style={styles.card}>
      <Image source={card.image} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardOverlay} />
      <View style={styles.cardContent}>
        <ThemedText type="title" style={styles.cardTitle}>
          {kindLabel}
        </ThemedText>
        <ThemedText style={styles.cardText}>{card.text}</ThemedText>
      </View>
    </View>
  );
}

function ConfettiBurst({ onDone }: { onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(() => {
    const colors = ['#22c55e', '#a855f7', '#f59e0b', '#38bdf8', '#f472b6'];
    return Array.from({ length: 16 }).map((_, index) => {
      const delay = Math.random() * 150;
      return {
        id: index,
        color: colors[index % colors.length],
        left: Math.random() * width,
        rotate: Math.random() * 360,
        scale: 0.8 + Math.random() * 0.6,
        delay,
        translateY: new RNAnimated.Value(0),
        opacity: new RNAnimated.Value(1),
      };
    });
  }, [width]);

  useEffect(() => {
    pieces.forEach(piece => {
      RNAnimated.timing(piece.translateY, {
        toValue: height * 0.6 + Math.random() * 80,
        duration: 700 + Math.random() * 300,
        delay: piece.delay,
        easing: RNEasing.out(RNEasing.quad),
        useNativeDriver: true,
      }).start();
      RNAnimated.timing(piece.opacity, {
        toValue: 0,
        duration: 400,
        delay: 500 + piece.delay,
        easing: RNEasing.out(RNEasing.quad),
        useNativeDriver: true,
      }).start();
    });

    const cleanup = setTimeout(onDone, 1200);
    return () => clearTimeout(cleanup);
  }, [height, onDone, pieces]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map(piece => (
        <RNAnimated.View
          key={piece.id}
          style={{
            position: 'absolute',
            top: 0,
            left: piece.left,
            width: 10,
            height: 18,
            backgroundColor: piece.color,
            borderRadius: 3,
            opacity: piece.opacity,
            transform: [
              { translateY: piece.translateY },
              { rotate: `${piece.rotate}deg` },
              { scale: piece.scale },
            ],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    gap: 10,
  },
  progressRow: {
    marginTop: 12,
    gap: 8,
    width: '100%',
  },
  streakText: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  sprintButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  sprintText: {
    fontSize: 14,
    color: '#e2e8f0',
    textAlign: 'center',
  },
  progressBarSection: {
    width: '100%',
    gap: 6,
  },
  progressLabel: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  progressTrack: {
    height: 10,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  loveBanner: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  loveTitle: {
    color: '#f472b6',
  },
  loveText: {
    color: '#e2e8f0',
    lineHeight: 20,
  },
  counter: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: BASE_COUNTER_COLOR,
  },
  counterText: {
    color: '#e2e8f0',
    fontFamily: Fonts.rounded,
  },
  status: {
    color: '#fbbf24',
  },
  deck: {
    flex: 1,
    width: '100%',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#cbd5e1',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a80',
  },
  cardContent: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    gap: 8,
  },
  cardTitle: {
    color: '#a5b4fc',
  },
  cardText: {
    color: '#f8fafc',
    lineHeight: 22,
  },
});
