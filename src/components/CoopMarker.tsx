import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * A small hand-drawn chicken coop illustration built from views (no image
 * assets) — a warm wooden henhouse with a pitched roof, a round pop-hole and a
 * perch. Used as a map marker and in the coop info card.
 */
export function CoopMarker({
  size = 1,
  selected = false,
}: {
  size?: number;
  selected?: boolean;
}) {
  const s = size;
  return (
    <View style={[styles.wrap, selected && styles.selectedWrap]}>
      {/* Pitched roof */}
      <View
        style={[
          styles.roof,
          {
            borderLeftWidth: 26 * s,
            borderRightWidth: 26 * s,
            borderBottomWidth: 18 * s,
          },
        ]}
      />
      <View style={[styles.roofRidge, { width: 4 * s, height: 6 * s }]} />
      {/* Body */}
      <View style={[styles.body, { width: 44 * s, height: 30 * s }]}>
        <View style={[styles.plankA]} />
        <View style={[styles.plankB]} />
        {/* Pop-hole door */}
        <View style={[styles.door, { width: 13 * s, height: 17 * s }]} />
        {/* Ramp */}
        <View style={[styles.ramp, { width: 12 * s }]} />
        {/* Window */}
        <View style={[styles.window, { width: 9 * s, height: 9 * s }]} />
      </View>
      {/* Little perch legs */}
      <View style={styles.legs}>
        <View style={[styles.leg, { height: 5 * s }]} />
        <View style={[styles.leg, { height: 5 * s }]} />
      </View>
      <Text style={[styles.hen, { fontSize: 13 * s }]}>🐔</Text>
    </View>
  );
}

const WOOD = '#c98a52';
const WOOD_DARK = '#a56a37';
const ROOF = '#8c4a2f';

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  selectedWrap: {
    padding: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(224,169,74,0.35)',
  },
  roof: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: ROOF,
    marginBottom: -2,
  },
  roofRidge: {
    backgroundColor: ROOF,
    borderRadius: 2,
    marginBottom: -1,
  },
  body: {
    backgroundColor: WOOD,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: WOOD_DARK,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  plankA: {
    position: 'absolute',
    top: '33%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: WOOD_DARK,
    opacity: 0.5,
  },
  plankB: {
    position: 'absolute',
    top: '66%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: WOOD_DARK,
    opacity: 0.5,
  },
  door: {
    backgroundColor: '#3a2415',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    marginBottom: 0,
  },
  ramp: {
    position: 'absolute',
    bottom: -3,
    height: 3,
    backgroundColor: WOOD_DARK,
    transform: [{ rotate: '4deg' }],
  },
  window: {
    position: 'absolute',
    top: 5,
    right: 6,
    backgroundColor: '#ffd98a',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: WOOD_DARK,
  },
  legs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 34,
  },
  leg: { width: 2, backgroundColor: WOOD_DARK },
  hen: { position: 'absolute', bottom: -2, right: -8 },
});
