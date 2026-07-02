import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Plant, SiteInfo } from '../types';
import { colors, radius, spacing, LAYER_META } from '../theme';
import { suitability } from '../data/climate';
import { Pill } from './ui';

export function PlantCard({
  plant,
  site,
  onPress,
  right,
}: {
  plant: Plant;
  site: SiteInfo;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  const suit = suitability(plant, site);
  const layer = LAYER_META[plant.layer];
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{plant.icon}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.common}>{plant.common}</Text>
        <Text style={styles.sci}>{plant.scientific}</Text>
        <View style={styles.tags}>
          <Pill label={layer.short} color={layer.color} textColor="#0f1a12" />
          {plant.edible && (
            <Pill label="Edible" color={colors.edible} textColor="#0f1a12" />
          )}
          {plant.medicinal && (
            <Pill
              label="Medicinal"
              color={colors.medicinal}
              textColor="#0f1a12"
            />
          )}
          {plant.nitrogenFixer && (
            <Pill label="N-fixer" color={colors.accent} textColor="#0f1a12" />
          )}
        </View>
        <View style={styles.suitRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: suit.ok ? colors.primary : colors.danger },
            ]}
          />
          <Text style={styles.suitText}>{suit.reason}</Text>
        </View>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  pressed: { opacity: 0.7 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: { fontSize: 26 },
  body: { flex: 1 },
  common: { color: colors.text, fontSize: 16, fontWeight: '700' },
  sci: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  suitRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  suitText: { color: colors.textMuted, fontSize: 12 },
  right: { marginLeft: spacing.sm },
});
