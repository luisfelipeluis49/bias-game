import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AnimatedStack } from '@/components/tinder/animated-stack';
import { Colors, Fonts } from '@/constants/theme';
import { useI18n } from '@/hooks/use-i18n';
import type { Card } from '@/utils/card-factory';
import { generateCards, resetDeck } from '@/utils/card-factory';

const INITIAL_BATCH = 10;
const REFILL_EVERY_SWIPES = 3;
const REFILL_COUNT = 3;
const MATCH_PROBABILITY = 0.45;
const BASE_COUNTER_COLOR = '#0f172a';
const GLOW_COLOR = '#22c55e';

export default function SwipeScreen() {
  const { t, lang } = useI18n();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [leftCount, setLeftCount] = useState(0);
  const [, setSwipeStreak] = useState(0);
  const [refilling, setRefilling] = useState(false);

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

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setCards([]);
    setStatus(null);
    setLeftCount(0);
    setSwipeStreak(0);
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
      setSwipeStreak(prev => {
        const next = prev + 1;
        if (next >= REFILL_EVERY_SWIPES) {
          maybeRefill();
          return 0;
        }
        return next;
      });
      if (match) {
        setLeftCount(0);
      }
    },
    [maybeRefill],
  );

  const handleSwipeLeft = useCallback(() => {
    setStatus(null);
    setLeftCount(prev => {
      const next = prev + 1;
      if (next > 0 && next % 10 === 0) {
        triggerGlow();
      }
      return next;
    });
    handleAfterSwipe(false);
  }, [handleAfterSwipe, triggerGlow]);

  const handleSwipeRight = useCallback(
    (card: Card) => {
      const isMatch = Math.random() < MATCH_PROBABILITY;
      setStatus(isMatch ? t('swipe.match') : t('swipe.noMatch'));
      handleAfterSwipe(isMatch);
    },
    [handleAfterSwipe, t],
  );

  const counterLabel = useMemo(() => t('swipe.counter', { count: leftCount }), [leftCount, t]);

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
