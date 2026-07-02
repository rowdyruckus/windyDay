import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StructureType } from '../types';
import { CoopMarker } from './CoopMarker';

/**
 * Hand-drawn markers for each structure type — a beehive skep, a pond, and a
 * rain barrel — built from views so they stay crisp at any zoom. The coop lives
 * in its own component and is delegated to here.
 */

function BeehiveMarker({ size = 1 }: { size?: number }) {
  const s = size;
  return (
    <View style={{ alignItems: 'center' }}>
      {/* Skep: stacked rounded bands, narrowing upward */}
      <View style={[band(28, s)]} />
      <View style={[band(34, s), { marginTop: -3 * s }]} />
      <View style={[band(40, s), { marginTop: -3 * s }]} />
      <View style={[band(44, s), { marginTop: -3 * s }]}>
        <View style={[styles.hiveEntrance, { width: 8 * s, height: 8 * s }]} />
      </View>
      <Text style={{ fontSize: 12 * s, position: 'absolute', right: -6 * s, top: -4 * s }}>
        🐝
      </Text>
    </View>
  );
}

function band(width: number, s: number) {
  return {
    width: width * s,
    height: 10 * s,
    borderRadius: 6 * s,
    backgroundColor: '#e6b800',
    borderWidth: 1,
    borderColor: '#b38f00',
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
  };
}

function PondMarker({ size = 1 }: { size?: number }) {
  const s = size;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={[styles.pond, { width: 46 * s, height: 30 * s }]}>
        <View style={[styles.pondShine, { width: 18 * s, height: 6 * s }]} />
        <View style={[styles.lilyPad, { width: 10 * s, height: 7 * s }]} />
      </View>
      {/* reeds */}
      <View style={[styles.reed, { left: 6 * s, height: 16 * s }]} />
      <View style={[styles.reed, { left: 10 * s, height: 11 * s }]} />
    </View>
  );
}

function RainBarrelMarker({ size = 1 }: { size?: number }) {
  const s = size;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[styles.barrel, { width: 30 * s, height: 40 * s }]}>
        <View style={[styles.water, { height: 10 * s }]} />
        <View style={[styles.hoop, { top: 12 * s }]} />
        <View style={[styles.hoop, { top: 26 * s }]} />
        <View style={[styles.tap, { width: 6 * s, height: 4 * s }]} />
      </View>
    </View>
  );
}

export function StructureMarker({
  type,
  size = 1,
  selected = false,
}: {
  type: StructureType;
  size?: number;
  selected?: boolean;
}) {
  const inner =
    type === 'coop' ? (
      <CoopMarker size={size} selected={selected} />
    ) : type === 'beehive' ? (
      <BeehiveMarker size={size} />
    ) : type === 'pond' ? (
      <PondMarker size={size} />
    ) : (
      <RainBarrelMarker size={size} />
    );

  if (type === 'coop') return inner; // coop handles its own selection ring
  return (
    <View style={[selected && styles.selectedWrap]}>{inner}</View>
  );
}

const styles = StyleSheet.create({
  selectedWrap: {
    padding: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(224,169,74,0.35)',
  },
  hiveEntrance: {
    backgroundColor: '#5a3d10',
    borderRadius: 5,
    marginBottom: 1,
  },
  pond: {
    borderRadius: 999,
    backgroundColor: '#4aa3d9',
    borderWidth: 2,
    borderColor: '#bfe3f2',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pondShine: {
    position: 'absolute',
    top: 4,
    left: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  lilyPad: {
    position: 'absolute',
    bottom: 5,
    right: 7,
    borderRadius: 999,
    backgroundColor: '#3f8248',
  },
  reed: {
    position: 'absolute',
    bottom: 6,
    width: 2,
    backgroundColor: '#5bbf6a',
    borderRadius: 2,
  },
  barrel: {
    backgroundColor: '#9c6b3f',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#6f4a29',
    overflow: 'hidden',
    alignItems: 'center',
  },
  water: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4aa3d9',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  hoop: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#6f4a29',
  },
  tap: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: '#3a2415',
    borderRadius: 1,
  },
});
