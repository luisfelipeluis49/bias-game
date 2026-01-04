import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useI18n } from '@/hooks/use-i18n';
import { preloadCardAssets } from '@/utils/preload-assets';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function LoadingScreen() {
  const { t, ready } = useI18n();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const run = async () => {
      await preloadCardAssets();
      setDone(true);
    };
    run();
  }, []);

  if (ready && done) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.backdrop} />
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
    backgroundColor: '#a855f7',
    opacity: 0.25,
    transform: [{ scale: 1.1 }],
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
