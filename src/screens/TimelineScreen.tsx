import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import { useDesignStore, usePlacedPlantIds } from '../store/useDesignStore';
import { getPlant, PLANTS } from '../data/plants';
import { suitability } from '../data/climate';
import {
  MONTHS_LONG,
  peakBountyMonth,
  seasonForMonth,
  SEASON_META,
} from '../data/season';
import { Plant } from '../types';

export function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const site = useDesignStore((s) => s.site);
  const placedIds = usePlacedPlantIds();

  // Base the calendar on what's planted; if the design is empty, preview with
  // plants suited to the site so the timeline still tells a story.
  const isPreview = placedIds.length === 0;
  const plants: Plant[] = useMemo(() => {
    if (!isPreview) {
      return placedIds
        .map((id) => getPlant(id))
        .filter((p): p is Plant => !!p);
    }
    return PLANTS.filter((p) => suitability(p, site).ok);
  }, [placedIds, isPreview, site]);

  const peak = useMemo(
    () => peakBountyMonth(isPreview ? [] : placedIds),
    [placedIds, isPreview]
  );

  const months = useMemo(() => {
    return MONTHS_LONG.map((name, i) => {
      const month = i + 1;
      const toPlant = plants.filter((p) => p.plantMonths.includes(month));
      const toHarvest = plants.filter((p) => p.harvestMonths.includes(month));
      return { month, name, toPlant, toHarvest };
    });
  }, [plants]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.md }}
    >
      <Text style={styles.h1}>Seasonal Timeline</Text>
      <Text style={styles.sub}>
        {isPreview
          ? 'A preview using plants suited to your site. Add plants to your design to make it yours.'
          : 'When to plant, tend and harvest across the year.'}
      </Text>

      {isPreview && (
        <Pressable style={styles.previewBtn} onPress={() => navigation.navigate('Plants')}>
          <Text style={styles.previewBtnText}>Browse plants to add →</Text>
        </Pressable>
      )}

      {months.map((m) => {
        const season = SEASON_META[seasonForMonth(m.month)];
        const isPeak = m.month === peak && !isPreview;
        const nothing = m.toPlant.length === 0 && m.toHarvest.length === 0;
        return (
          <View key={m.month} style={[styles.monthCard, isPeak && styles.peakCard]}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthName}>
                {season.icon} {m.name}
              </Text>
              {isPeak && <Text style={styles.peakTag}>PEAK BOUNTY</Text>}
            </View>

            {nothing ? (
              <Text style={styles.quiet}>{season.blurb} · a quiet month</Text>
            ) : (
              <>
                {m.toPlant.length > 0 && (
                  <Activity
                    color={colors.primary}
                    label="Plant"
                    items={m.toPlant}
                    onPick={(id) => navigation.navigate('PlantDetail', { plantId: id })}
                  />
                )}
                {m.toHarvest.length > 0 && (
                  <Activity
                    color={colors.accent}
                    label="Harvest"
                    items={m.toHarvest}
                    onPick={(id) => navigation.navigate('PlantDetail', { plantId: id })}
                  />
                )}
              </>
            )}
          </View>
        );
      })}
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

function Activity({
  color,
  label,
  items,
  onPick,
}: {
  color: string;
  label: string;
  items: Plant[];
  onPick: (id: string) => void;
}) {
  return (
    <View style={styles.activity}>
      <View style={styles.activityHead}>
        <View style={[styles.actDot, { backgroundColor: color }]} />
        <Text style={styles.actLabel}>{label}</Text>
      </View>
      <View style={styles.chips}>
        {items.map((p) => (
          <Pressable key={p.id} style={styles.chip} onPress={() => onPick(p.id)}>
            <Text style={styles.chipIcon}>{p.icon}</Text>
            <Text style={styles.chipText}>{p.common}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  h1: { color: colors.text, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 14, marginTop: 4, marginBottom: spacing.lg, lineHeight: 20 },
  previewBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  previewBtnText: { color: colors.primary, fontWeight: '700' },
  monthCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  peakCard: { borderColor: colors.accent, borderWidth: 2, backgroundColor: 'rgba(224,169,74,0.08)' },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthName: { color: colors.text, fontSize: 18, fontWeight: '700' },
  peakTag: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  quiet: { color: colors.textMuted, fontStyle: 'italic', marginTop: spacing.sm, fontSize: 13 },
  activity: { marginTop: spacing.md },
  activityHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  actDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  actLabel: { color: colors.text, fontWeight: '700', fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
  },
  chipIcon: { fontSize: 15, marginRight: 5 },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
});
