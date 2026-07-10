import React, { useRef } from 'react';
import { View, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import { colors } from '../theme';

/**
 * A minimal horizontal slider built on PanResponder — no native module, so it
 * works over-the-air without a rebuild. Value is continuous in [min, max].
 */
export function TimeSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const width = useRef(0);
  const left = useRef(0);

  const setFromX = (pageX: number) => {
    if (width.current <= 0) return;
    const rel = Math.max(0, Math.min(1, (pageX - left.current) / width.current));
    onChange(min + rel * (max - min));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => setFromX(e.nativeEvent.pageX),
      onPanResponderMove: (e) => setFromX(e.nativeEvent.pageX),
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    width.current = e.nativeEvent.layout.width;
    // Measure absolute x for pageX math.
    e.target &&
      (e.target as any).measure?.((_x: number, _y: number, _w: number, _h: number, px: number) => {
        left.current = px;
      });
  };

  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));

  return (
    <View style={styles.wrap} onLayout={onLayout} {...pan.panHandlers}>
      <View style={styles.track} />
      <View style={[styles.fill, { width: `${pct * 100}%` }]} />
      <View style={[styles.thumb, { left: `${pct * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 36, justifyContent: 'center' },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceAlt,
  },
  fill: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: colors.accent,
    marginLeft: -11,
  },
});
