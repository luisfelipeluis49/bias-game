import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useI18n } from '@/hooks/use-i18n';
import { preloadCardAssets } from '@/utils/preload-assets';
import { Redirect } from 'expo-router';

export default function LoadingScreen() {
  const { t, ready } = useI18n();
  const [done, setDone] = useState(false);
  const [delayDone, setDelayDone] = useState(false);

  const blob1 = useSharedValue(1);
  const blob2 = useSharedValue(0.8);

  const blob1Style = useAnimatedStyle(() => ({
    transform: [{ scale: blob1.value }],
    opacity: 0.35 + 0.25 * blob1.value,
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [{ scale: blob2.value }],
    opacity: 0.25 + 0.2 * blob2.value,
  }));

  useEffect(() => {
    const run = async () => {
      await preloadCardAssets();
      setDone(true);
    };
    run();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDelayDone(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timing = (val: typeof blob1) =>
      (val.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.85, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ));

    timing(blob1);
    timing(blob2);
  }, [blob1, blob2]);

  if (ready && done && delayDone) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[styles.backdrop, styles.backdropPink, blob1Style]} />
      <Animated.View style={[styles.backdrop, styles.backdropCyan, blob2Style]} />
      <View style={styles.card}>
        <ThemedText type="title" style={styles.title}>
          {t('loading.title')}
        </ThemedText>
        <ThemedText style={styles.subtitle}>{t('loading.subtitle')}</ThemedText>
        <ActivityIndicator size="large" color="#8b5cf6" style={{ marginTop: 16 }} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  backdrop: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    opacity: 0.25,
    transform: [{ scale: 1.1 }],
  },
  backdropPink: {
    backgroundColor: '#f472b6',
  },
  backdropCyan: {
    backgroundColor: '#22d3ee',
  },
  card: {
    width: '80%',
    maxWidth: 360,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  title: {
    color: '#f9fafb',
  },
  subtitle: {
    color: '#d1d5db',
    marginTop: 8,
    textAlign: 'center',
  },
});
