import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { colors } from '../theme';

/**
 * A plant marker that grows in when first placed (scale 0 → 1 with a little
 * spring). Map markers freeze their bitmap once `tracksViewChanges` is false,
 * so we keep it true during the animation / selection changes and drop it after
 * to keep the map smooth.
 */
export function PlantMarker({
  latitude,
  longitude,
  icon,
  selected,
  animateIn,
  onPress,
  onDragEnd,
  sizeScale = 1,
  liveResize = false,
}: {
  latitude: number;
  longitude: number;
  icon: string;
  selected: boolean;
  animateIn: boolean;
  onPress: () => void;
  onDragEnd: (lat: number, lng: number) => void;
  /** Extra scale applied to the bubble (e.g. to shrink young plants). */
  sizeScale?: number;
  /** Re-render the marker bitmap as sizeScale changes (Grow mode). */
  liveResize?: boolean;
}) {
  const scale = useRef(new Animated.Value(animateIn ? 0 : 1)).current;
  const [tracks, setTracks] = useState(true);

  useEffect(() => {
    if (animateIn) {
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 70,
        useNativeDriver: false,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep rendering to bitmap during the grow-in / selection change, then freeze.
  useEffect(() => {
    setTracks(true);
    const t = setTimeout(() => setTracks(false), animateIn ? 950 : 350);
    return () => clearTimeout(t);
  }, [selected, animateIn]);

  // In Grow mode, re-render as the plant's size changes with the year.
  useEffect(() => {
    if (!liveResize) return;
    setTracks(true);
    const t = setTimeout(() => setTracks(false), 260);
    return () => clearTimeout(t);
  }, [sizeScale, liveResize]);

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      draggable
      onDragEnd={(e) =>
        onDragEnd(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)
      }
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracks}
    >
      <Animated.View style={{ transform: [{ scale }, { scale: sizeScale }] }}>
        <View style={[styles.bubble, selected && styles.bubbleSel]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      </Animated.View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  bubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(15,26,18,0.5)',
  },
  bubbleSel: { borderColor: colors.accent, borderWidth: 3 },
  icon: { fontSize: 18 },
});
