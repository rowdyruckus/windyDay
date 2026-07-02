import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

/**
 * A few hens pecking and wandering along the ground of the Vision scene. Each
 * hen drifts slowly side to side and dips to peck, with the occasional bob —
 * quiet life in the morning garden.
 */

interface HenSpec {
  glyph: string;
  left: number; // 0-1
  bottom: number; // px from scene bottom
  size: number;
  wander: number; // px horizontal travel
  wanderMs: number;
  peckMs: number;
  delay: number;
  flip: boolean;
}

const HENS: HenSpec[] = [
  { glyph: '🐔', left: 0.12, bottom: 14, size: 26, wander: 46, wanderMs: 7000, peckMs: 1400, delay: 0, flip: false },
  { glyph: '🐓', left: 0.38, bottom: 8, size: 30, wander: 60, wanderMs: 9000, peckMs: 1700, delay: 600, flip: true },
  { glyph: '🐤', left: 0.6, bottom: 18, size: 16, wander: 30, wanderMs: 6000, peckMs: 1100, delay: 300, flip: false },
];

function Hen({ spec }: { spec: HenSpec }) {
  const wander = useRef(new Animated.Value(0)).current;
  const peck = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const walk = Animated.loop(
      Animated.sequence([
        Animated.timing(wander, {
          toValue: 1,
          duration: spec.wanderMs,
          delay: spec.delay,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wander, {
          toValue: 0,
          duration: spec.wanderMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const pecking = Animated.loop(
      Animated.sequence([
        Animated.delay(spec.delay),
        Animated.timing(peck, {
          toValue: 1,
          duration: spec.peckMs * 0.35,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(peck, {
          toValue: 0,
          duration: spec.peckMs * 0.65,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    walk.start();
    pecking.start();
    return () => {
      walk.stop();
      pecking.stop();
    };
  }, [spec, wander, peck]);

  const translateX = wander.interpolate({
    inputRange: [0, 1],
    outputRange: [0, spec.wander],
  });
  // Peck: tip forward and dip down, then back up.
  const rotate = peck.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', spec.flip ? '18deg' : '-18deg'],
  });
  const translateY = peck.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: `${spec.left * 100}%`,
        bottom: spec.bottom,
        fontSize: spec.size,
        transform: [
          { translateX },
          { translateY },
          { rotate },
          { scaleX: spec.flip ? -1 : 1 },
        ],
      }}
    >
      {spec.glyph}
    </Animated.Text>
  );
}

export function Hens({ height = 320 }: { height?: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { height }]}>
      {HENS.map((spec, i) => (
        <Hen key={i} spec={spec} />
      ))}
    </View>
  );
}
