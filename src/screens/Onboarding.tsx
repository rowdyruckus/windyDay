import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import { GOALS, Goal } from '../data/goals';
import { useDesignStore } from '../store/useDesignStore';

export function Onboarding() {
  const insets = useSafeAreaInsets();
  const complete = useDesignStore((s) => s.completeOnboarding);
  const [selected, setSelected] = useState<Goal[]>([]);

  const toggle = (g: Goal) =>
    setSelected((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#ffd9a3', '#ffb27a', '#e98a5f', '#0f1a12']}
        locations={[0, 0.25, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
          paddingHorizontal: spacing.lg,
          flexGrow: 1,
          justifyContent: 'center',
        }}
      >
        <Text style={styles.tag}>WELCOME TO</Text>
        <Text style={styles.title}>Let's Plant Paradise</Text>
        <Text style={styles.sub}>
          Design a thriving food forest on your own land — from canopy fruit
          trees to ground covers — tuned to your climate.
        </Text>

        <Text style={styles.q}>What do you dream of growing?</Text>
        <View style={styles.goals}>
          {GOALS.map((g) => {
            const on = selected.includes(g.key);
            return (
              <Pressable
                key={g.key}
                onPress={() => toggle(g.key)}
                style={[styles.goal, on && styles.goalOn]}
              >
                <Text style={styles.goalIcon}>{g.icon}</Text>
                <Text style={[styles.goalLabel, on && styles.goalLabelOn]}>{g.label}</Text>
                <Text style={styles.goalBlurb}>{g.blurb}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.start} onPress={() => complete(selected)}>
          <Text style={styles.startText}>Enter my paradise →</Text>
        </Pressable>
        <Text style={styles.skip} onPress={() => complete([])}>
          Skip for now
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  tag: { color: '#7a3d1f', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  title: { color: '#3a1c0c', fontSize: 34, fontWeight: '900', marginTop: 4 },
  sub: { color: '#4a2a16', fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
  q: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: spacing.xl, marginBottom: spacing.md },
  goals: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  goal: {
    width: '48%',
    backgroundColor: 'rgba(15,26,18,0.55)',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: spacing.md,
  },
  goalOn: { borderColor: colors.primary, backgroundColor: 'rgba(15,26,18,0.8)' },
  goalIcon: { fontSize: 24 },
  goalLabel: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 4 },
  goalLabelOn: { color: colors.primary },
  goalBlurb: { color: '#dfeee0', fontSize: 12, marginTop: 2 },
  start: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  startText: { color: '#0f1a12', fontWeight: '800', fontSize: 16 },
  skip: { color: '#eef4ee', textAlign: 'center', marginTop: spacing.md, fontSize: 14 },
});
