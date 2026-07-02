import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, LAYER_META, LAYER_ORDER } from '../theme';
import { PLANTS } from '../data/plants';
import { suitability } from '../data/climate';
import { zoneLabel } from '../data/climate';
import { useDesignStore } from '../store/useDesignStore';
import { PlantCard } from '../components/PlantCard';
import { ForestLayer } from '../types';

type LayerFilter = ForestLayer | 'all';

export function PlantsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const site = useDesignStore((s) => s.site);

  const [layer, setLayer] = useState<LayerFilter>('all');
  const [edibleOnly, setEdibleOnly] = useState(false);
  const [medicinalOnly, setMedicinalOnly] = useState(false);
  const [suitedOnly, setSuitedOnly] = useState(false);

  const data = useMemo(() => {
    let list = PLANTS.filter((p) => {
      if (layer !== 'all' && p.layer !== layer) return false;
      if (edibleOnly && !p.edible) return false;
      if (medicinalOnly && !p.medicinal) return false;
      if (suitedOnly && !suitability(p, site).ok) return false;
      return true;
    });
    // Suited plants first, then by layer order, then name.
    list = [...list].sort((a, b) => {
      const sa = suitability(a, site).ok ? 0 : 1;
      const sb = suitability(b, site).ok ? 0 : 1;
      if (sa !== sb) return sa - sb;
      const la = LAYER_META[a.layer].order;
      const lb = LAYER_META[b.layer].order;
      if (la !== lb) return la - lb;
      return a.common.localeCompare(b.common);
    });
    return list;
  }, [layer, edibleOnly, medicinalOnly, suitedOnly, site]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <Text style={styles.h1}>Plants</Text>
        <Text style={styles.sub}>
          {zoneLabel(site.zone)} · {data.length} matches
        </Text>
      </View>

      {/* Layer filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        <Chip label="All layers" active={layer === 'all'} onPress={() => setLayer('all')} />
        {LAYER_ORDER.map((l) => (
          <Chip
            key={l}
            label={LAYER_META[l].short}
            color={LAYER_META[l].color}
            active={layer === l}
            onPress={() => setLayer(l)}
          />
        ))}
      </ScrollView>

      {/* Toggle filters */}
      <View style={styles.toggleRow}>
        <Toggle label="🍽 Edible" active={edibleOnly} onPress={() => setEdibleOnly((v) => !v)} />
        <Toggle
          label="⚕️ Medicinal"
          active={medicinalOnly}
          onPress={() => setMedicinalOnly((v) => !v)}
        />
        <Toggle
          label="✓ Suits my site"
          active={suitedOnly}
          onPress={() => setSuitedOnly((v) => !v)}
        />
      </View>

      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm }}
        renderItem={({ item }) => (
          <PlantCard
            plant={item}
            site={site}
            onPress={() => navigation.navigate('PlantDetail', { plantId: item.id })}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No plants match these filters. Try widening them.
          </Text>
        }
      />
    </View>
  );
}

function Chip({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: color ?? colors.primary, borderColor: color ?? colors.primary },
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Toggle({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.toggle, active && styles.toggleActive]}
    >
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg },
  h1: { color: colors.text, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  chipScroll: { marginTop: spacing.md, maxHeight: 44 },
  chipRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: 'center' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#0f1a12' },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  toggle: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: colors.surfaceAlt, borderColor: colors.primary },
  toggleText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  toggleTextActive: { color: colors.text },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
