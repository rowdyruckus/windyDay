import React from 'react';
import { Pressable, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { UrlTile } from 'react-native-maps';
import { colors, radius, spacing } from '../theme';
import { useDesignStore } from '../store/useDesignStore';

// Esri World Imagery — free high-resolution aerial/satellite tiles. Attribution
// required (shown via <EsriAttribution/>). Tile scheme is /{z}/{y}/{x}.
const ESRI_WORLD_IMAGERY =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

/** Overlays Esri high-res tiles when that basemap is selected. Must be a child
 *  of <MapView>. Kept below markers/overlays via a negative zIndex. */
export function BasemapTiles() {
  const basemap = useDesignStore((s) => s.basemap);
  if (basemap !== 'esri') return null;
  return (
    <UrlTile
      urlTemplate={ESRI_WORLD_IMAGERY}
      maximumZ={19}
      zIndex={-1}
      tileSize={256}
    />
  );
}

/** A small button that flips between Apple satellite and Esri high-res. */
export function BasemapToggle({ style }: { style?: ViewStyle }) {
  const basemap = useDesignStore((s) => s.basemap);
  const setBasemap = useDesignStore((s) => s.setBasemap);
  const isEsri = basemap === 'esri';
  return (
    <Pressable
      onPress={() => setBasemap(isEsri ? 'apple' : 'esri')}
      style={[styles.toggle, isEsri && styles.toggleActive, style]}
    >
      <Text style={styles.toggleIcon}>🛰️</Text>
      <Text style={[styles.toggleText, isEsri && styles.toggleTextActive]}>
        {isEsri ? 'HD' : 'Std'}
      </Text>
    </Pressable>
  );
}

/** Required attribution when Esri imagery is shown. */
export function EsriAttribution({ style }: { style?: ViewStyle }) {
  const basemap = useDesignStore((s) => s.basemap);
  if (basemap !== 'esri') return null;
  return (
    <View style={[styles.attrib, style]} pointerEvents="none">
      <Text style={styles.attribText}>Imagery © Esri</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    backgroundColor: 'rgba(15,26,18,0.8)',
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    width: 56,
  },
  toggleActive: { borderColor: colors.primary },
  toggleIcon: { fontSize: 18 },
  toggleText: { color: '#fff', fontSize: 11, fontWeight: '700', marginTop: 2 },
  toggleTextActive: { color: colors.primary },
  attrib: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  attribText: { color: '#fff', fontSize: 10 },
});
