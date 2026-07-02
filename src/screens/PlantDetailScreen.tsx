import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, radius, spacing, LAYER_META } from '../theme';
import { getPlant, PLANTS } from '../data/plants';
import { suitability } from '../data/climate';
import { useDesignStore } from '../store/useDesignStore';
import { Card, Pill, SectionTitle } from '../components/ui';
import { MONTHS } from '../data/season';

type ParamList = { PlantDetail: { plantId: string } };

export function PlantDetailScreen() {
  const route = useRoute<RouteProp<ParamList, 'PlantDetail'>>();
  const navigation = useNavigation<any>();
  const site = useDesignStore((s) => s.site);
  const placed = useDesignStore((s) => s.placed);
  const placePlant = useDesignStore((s) => s.placePlant);

  const plant = getPlant(route.params.plantId);
  if (!plant) {
    return (
      <View style={styles.root}>
        <Text style={styles.body}>Plant not found.</Text>
      </View>
    );
  }

  const layer = LAYER_META[plant.layer];
  const suit = suitability(plant, site);
  const companions = plant.companions
    .map((id) => getPlant(id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  function addToDesign() {
    if (site.latitude == null || site.longitude == null) {
      Alert.alert(
        'Set your location first',
        'Add your site on the Site tab so we can place plants on your land.'
      );
      return;
    }
    // Spread new plantings out a little so they don't stack on one point.
    const n = placed.length;
    const ring = 0.00008 * (1 + n);
    const angle = n * 2.399963; // golden-angle spiral for even spread
    const lat = site.latitude + ring * Math.cos(angle);
    const lng = site.longitude + ring * Math.sin(angle);
    placePlant(plant!.id, lat, lng);
    Alert.alert('Added', `${plant!.common} placed in your design.`, [
      { text: 'Keep browsing' },
      { text: 'Open design', onPress: () => navigation.navigate('Design') },
    ]);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: layer.color }]}>
          <Text style={styles.icon}>{plant.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.common}>{plant.common}</Text>
          <Text style={styles.sci}>{plant.scientific}</Text>
        </View>
      </View>

      <View style={styles.tags}>
        <Pill label={layer.label} color={layer.color} textColor="#0f1a12" />
        {plant.edible && <Pill label="Edible" color={colors.edible} textColor="#0f1a12" />}
        {plant.medicinal && (
          <Pill label="Medicinal" color={colors.medicinal} textColor="#0f1a12" />
        )}
        {plant.nitrogenFixer && (
          <Pill label="Nitrogen fixer" color={colors.accent} textColor="#0f1a12" />
        )}
      </View>

      {/* Suitability banner */}
      <View
        style={[
          styles.suitBanner,
          { backgroundColor: suit.ok ? 'rgba(91,191,106,0.15)' : 'rgba(217,112,91,0.15)' },
        ]}
      >
        <Text style={[styles.suitText, { color: suit.ok ? colors.primary : colors.danger }]}>
          {suit.ok ? '✓ ' : '⚠ '}
          {suit.reason}
        </Text>
      </View>

      <Card style={{ marginTop: spacing.md }}>
        <SectionTitle>At a glance</SectionTitle>
        <Row label="Layer" value={layer.label} />
        <Row label="Uses" value={plant.uses.join(', ')} />
        <Row
          label="Sun"
          value={
            plant.sun === 'full' ? 'Full sun' : plant.sun === 'partial' ? 'Partial sun' : 'Shade'
          }
        />
        <Row label="Hardiness" value={`USDA zones ${plant.minZone}–${plant.maxZone}`} />
        <Row
          label="Mature size"
          value={`${plant.matureHeightM} m tall · ${plant.matureSpreadM} m wide`}
        />
      </Card>

      {/* Calendar strip */}
      <Card style={{ marginTop: spacing.md }}>
        <SectionTitle>Through the year</SectionTitle>
        <View style={styles.calRow}>
          {MONTHS.map((m, i) => {
            const month = i + 1;
            const plant_ = plant!;
            const isPlant = plant_.plantMonths.includes(month);
            const isHarvest = plant_.harvestMonths.includes(month);
            return (
              <View key={m} style={styles.calCell}>
                <Text style={styles.calMonth}>{m[0]}</Text>
                <View
                  style={[
                    styles.calDot,
                    isHarvest
                      ? { backgroundColor: colors.accent }
                      : isPlant
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.surfaceAlt },
                  ]}
                />
              </View>
            );
          })}
        </View>
        <View style={styles.legendRow}>
          <Legend color={colors.primary} label="Plant" />
          <Legend color={colors.accent} label="Harvest" />
        </View>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <SectionTitle>Notes</SectionTitle>
        <Text style={styles.body}>{plant.notes}</Text>
      </Card>

      {/* Guild companions */}
      {companions.length > 0 && (
        <Card style={{ marginTop: spacing.md }}>
          <SectionTitle>Guild companions</SectionTitle>
          <Text style={styles.body}>
            Plants that support {plant.common} — layer these together to build a
            self-sustaining guild.
          </Text>
          <View style={{ marginTop: spacing.sm }}>
            {companions.map((c) => (
              <Pressable
                key={c.id}
                style={styles.companion}
                onPress={() =>
                  navigation.push('PlantDetail', { plantId: c.id })
                }
              >
                <Text style={styles.compIcon}>{c.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.compName}>{c.common}</Text>
                  <Text style={styles.compLayer}>{LAYER_META[c.layer].label}</Text>
                </View>
                <Text style={styles.ctaChevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      )}

      <Pressable style={styles.addBtn} onPress={addToDesign}>
        <Text style={styles.addText}>＋ Add to my design</Text>
      </Pressable>
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: { fontSize: 34 },
  common: { color: colors.text, fontSize: 26, fontWeight: '800' },
  sci: { color: colors.textMuted, fontSize: 14, fontStyle: 'italic' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  suitBanner: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.sm },
  suitText: { fontWeight: '700', fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: spacing.md },
  body: { color: colors.text, fontSize: 14, lineHeight: 21 },
  calRow: { flexDirection: 'row', justifyContent: 'space-between' },
  calCell: { alignItems: 'center', flex: 1 },
  calMonth: { color: colors.textMuted, fontSize: 10, marginBottom: 4 },
  calDot: { width: 14, height: 14, borderRadius: 7 },
  legendRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  legend: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendText: { color: colors.textMuted, fontSize: 12 },
  companion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  compIcon: { fontSize: 24, marginRight: spacing.md },
  compName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  compLayer: { color: colors.textMuted, fontSize: 12 },
  ctaChevron: { color: colors.textMuted, fontSize: 24 },
  addBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  addText: { color: '#0f1a12', fontWeight: '800', fontSize: 16 },
});
