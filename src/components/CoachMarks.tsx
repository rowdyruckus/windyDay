import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import { useDesignStore } from '../store/useDesignStore';

// The five bottom tabs, in order, with a one-line explanation each.
const TABS = [
  { icon: '🌄', name: 'Vision', hint: 'Your dawn & progress' },
  { icon: '📍', name: 'Site', hint: 'Your land & climate' },
  { icon: '🌱', name: 'Plants', hint: 'What thrives here' },
  { icon: '🗺️', name: 'Design', hint: 'Plant on the map' },
  { icon: '📅', name: 'Timeline', hint: 'Month-by-month jobs' },
];

/**
 * A one-time spotlight tour of the bottom tabs, shown the first time the app
 * opens after onboarding. Mounted above the whole navigator so it can point at
 * the tab bar. Tap "Got it" (or the backdrop) to dismiss for good.
 */
export function CoachMarks() {
  const insets = useSafeAreaInsets();
  const hydrated = useDesignStore((s) => s.hydrated);
  const onboarded = useDesignStore((s) => s.onboarded);
  const tourSeen = useDesignStore((s) => s.tourSeen);
  const markTourSeen = useDesignStore((s) => s.markTourSeen);

  if (!hydrated || !onboarded || tourSeen) return null;

  const width = Dimensions.get('window').width;
  const tabBar = 52; // approximate tab-bar height above the safe-area inset

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={markTourSeen}>
      <View style={styles.scrim} />

      {/* Headline card, centered */}
      <View style={styles.center} pointerEvents="box-none">
        <View style={styles.card}>
          <Text style={styles.title}>Find your way around</Text>
          <Text style={styles.body}>
            Five tabs take you from dreaming to planting. Here's what each one does —
            you can always come back from Vision.
          </Text>
          <Pressable style={styles.cta} onPress={markTourSeen}>
            <Text style={styles.ctaText}>Got it — let's grow 🌱</Text>
          </Pressable>
        </View>
      </View>

      {/* Callouts pointing down at each evenly-spaced tab */}
      <View
        style={[styles.calloutRow, { bottom: insets.bottom + tabBar }]}
        pointerEvents="none"
      >
        {TABS.map((t, i) => (
          <View key={t.name} style={[styles.callout, { width: width / TABS.length }]}>
            <Text style={styles.calloutIcon}>{t.icon}</Text>
            <Text style={styles.calloutName}>{t.name}</Text>
            <Text style={styles.calloutHint}>{t.hint}</Text>
            <Text style={styles.pointer}>▾</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8,14,10,0.86)',
  },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  body: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaText: { color: '#0f1a12', fontWeight: '800', fontSize: 15 },
  calloutRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row' },
  callout: { alignItems: 'center', paddingHorizontal: 2 },
  calloutIcon: { fontSize: 20 },
  calloutName: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 2 },
  calloutHint: { color: '#e8f2e6', fontSize: 10, textAlign: 'center', marginTop: 1 },
  pointer: { color: colors.primary, fontSize: 18, marginTop: 2 },
});
