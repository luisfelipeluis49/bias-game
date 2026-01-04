import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useI18n, type SupportedLang } from '@/hooks/use-i18n';

const LANGUAGES: { code: SupportedLang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'pt-BR', label: 'PT-BR' },
];

export default function RulesScreen() {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();

  const bullets = (t('rules.bullets', { returnObjects: true }) as unknown as string[]) || [];

  return (
    <SafeAreaView style={styles.safe}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {t('rules.title')}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            {t('rules.subtitle')}
          </ThemedText>
        </View>

        <View style={styles.bullets}>
          {bullets?.map((item, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <View style={styles.dot} />
              <ThemedText style={styles.bulletText}>{item}</ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.controls}>
          <View style={styles.langRow}>
            <ThemedText type="defaultSemiBold" style={styles.langLabel}>
              {t('rules.languageLabel')}
            </ThemedText>
            <View style={styles.langPills}>
              {LANGUAGES.map(option => (
                <Pressable
                  key={option.code}
                  onPress={() => setLang(option.code)}
                  style={[styles.pill, lang === option.code && styles.pillActive]}
                >
                  <ThemedText type="defaultSemiBold" style={styles.pillText}>
                    {option.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable style={styles.cta} onPress={() => router.push('/(tabs)')}>
            <ThemedText type="defaultSemiBold" style={styles.ctaText}>
              {t('rules.start')}
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20,
  },
  header: {
    gap: 8,
  },
  title: {
    fontFamily: Fonts.rounded,
    fontSize: 28,
  },
  subtitle: {
    color: '#cbd5e1',
    lineHeight: 22,
  },
  bullets: {
    gap: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    backgroundColor: '#22d3ee',
  },
  bulletText: {
    flex: 1,
    color: '#e2e8f0',
    lineHeight: 20,
  },
  controls: {
    marginTop: 'auto',
    gap: 16,
  },
  langRow: {
    gap: 8,
  },
  langLabel: {
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  langPills: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  pillActive: {
    backgroundColor: '#22d3ee1a',
    borderColor: '#22d3ee',
  },
  pillText: {
    color: '#e2e8f0',
  },
  cta: {
    backgroundColor: '#34d399',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: '#0f172a',
    letterSpacing: 0.5,
  },
});
