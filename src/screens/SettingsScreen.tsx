import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { Card, SectionTitle } from '../components/ui';
import { useDesignStore } from '../store/useDesignStore';
import { GOALS, Goal } from '../data/goals';
import { MUSIC_AVAILABLE } from '../audio/music';

export function SettingsScreen() {
  const units = useDesignStore((s) => s.units);
  const setUnits = useDesignStore((s) => s.setUnits);
  const musicMuted = useDesignStore((s) => s.musicMuted);
  const toggleMusic = useDesignStore((s) => s.toggleMusic);
  const goals = useDesignStore((s) => s.goals);
  const setGoals = useDesignStore((s) => s.setGoals);
  const resetOnboarding = useDesignStore((s) => s.resetOnboarding);
  const clearDesign = useDesignStore((s) => s.clearDesign);
  const clearSite = useDesignStore((s) => s.clearSite);

  const toggleGoal = (g: Goal) =>
    setGoals(goals.includes(g) ? goals.filter((x) => x !== g) : [...goals, g]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: spacing.lg }}>
      <Card>
        <SectionTitle>Units</SectionTitle>
        <View style={styles.row}>
          <Seg label="Metric (m, °C, mm)" active={units === 'metric'} onPress={() => setUnits('metric')} />
          <Seg label="Imperial (ft, °F, in)" active={units === 'imperial'} onPress={() => setUnits('imperial')} />
        </View>
      </Card>

      {MUSIC_AVAILABLE && (
        <Card style={{ marginTop: spacing.md }}>
          <SectionTitle>Startup music</SectionTitle>
          <Pressable style={styles.lineBtn} onPress={toggleMusic}>
            <Text style={styles.lineText}>{musicMuted ? '🔇 Muted' : '🎵 On'}</Text>
            <Text style={styles.lineAction}>{musicMuted ? 'Turn on' : 'Mute'}</Text>
          </Pressable>
        </Card>
      )}

      <Card style={{ marginTop: spacing.md }}>
        <SectionTitle>My goals</SectionTitle>
        <View style={styles.goals}>
          {GOALS.map((g) => {
            const on = goals.includes(g.key);
            return (
              <Pressable key={g.key} onPress={() => toggleGoal(g.key)} style={[styles.goal, on && styles.goalOn]}>
                <Text style={styles.goalIcon}>{g.icon}</Text>
                <Text style={[styles.goalLabel, on && { color: colors.primary }]}>{g.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <SectionTitle>Data</SectionTitle>
        <Pressable
          style={styles.lineBtn}
          onPress={() =>
            Alert.alert('Clear design?', 'Remove all plantings and structures.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearDesign },
            ])
          }
        >
          <Text style={styles.lineText}>🗑 Clear my design</Text>
          <Text style={styles.lineAction}>Clear</Text>
        </Pressable>
        <Pressable style={styles.lineBtn} onPress={clearSite}>
          <Text style={styles.lineText}>📍 Reset my land</Text>
          <Text style={styles.lineAction}>Reset</Text>
        </Pressable>
        <Pressable style={styles.lineBtn} onPress={resetOnboarding}>
          <Text style={styles.lineText}>👋 Replay the welcome</Text>
          <Text style={styles.lineAction}>Replay</Text>
        </Pressable>
      </Card>

      <Text style={styles.about}>Let's Plant Paradise · v1.0.0</Text>
      <Text style={styles.aboutSub}>
        Climate & species data from Open-Meteo and iNaturalist · imagery from Apple
        & Esri. Made with love for the soil.
      </Text>
    </ScrollView>
  );
}

function Seg({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.seg, active && styles.segOn]} onPress={onPress}>
      <Text style={[styles.segText, active && styles.segTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', gap: spacing.sm },
  seg: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  segOn: { borderColor: colors.primary },
  segText: { color: colors.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  segTextOn: { color: colors.text },
  lineBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  lineText: { color: colors.text, fontSize: 15 },
  lineAction: { color: colors.primary, fontWeight: '700' },
  goals: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  goal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalOn: { borderColor: colors.primary },
  goalIcon: { fontSize: 16, marginRight: 6 },
  goalLabel: { color: colors.textMuted, fontWeight: '600' },
  about: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, fontWeight: '700' },
  aboutSub: { color: colors.textMuted, textAlign: 'center', fontSize: 12, marginTop: spacing.sm, lineHeight: 17 },
});
