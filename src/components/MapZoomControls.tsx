import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import MapView from 'react-native-maps';
import { colors, radius } from '../theme';

/**
 * Simple + / − zoom buttons for a MapView. Adjusts the camera zoom (or altitude
 * on platforms that report it instead), preserving heading/rotation.
 */
export function MapZoomControls({
  mapRef,
  style,
}: {
  mapRef: React.RefObject<MapView | null>;
  style?: StyleProp<ViewStyle>;
}) {
  const zoom = async (delta: number) => {
    const cam = await mapRef.current?.getCamera();
    if (!cam) return;
    if (cam.zoom != null) {
      cam.zoom = Math.max(2, Math.min(20, cam.zoom + delta));
    } else if (cam.altitude != null) {
      cam.altitude = delta > 0 ? cam.altitude / 2 : cam.altitude * 2;
    }
    mapRef.current?.animateCamera(cam, { duration: 200 });
  };

  return (
    <View style={[styles.wrap, style]}>
      <Pressable style={styles.btn} onPress={() => zoom(1)} hitSlop={6}>
        <Text style={styles.txt}>＋</Text>
      </Pressable>
      <View style={styles.divider} />
      <Pressable style={styles.btn} onPress={() => zoom(-1)} hitSlop={6}>
        <Text style={styles.txt}>−</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(15,26,18,0.85)',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  btn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  txt: { color: '#fff', fontSize: 24, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border },
});
