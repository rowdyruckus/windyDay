import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

/**
 * A soft ambient layer of leaves drifting on a light breeze and catching the
 * morning light. Purely decorative — it sets the mood on the Vision screen.
 */

interface LeafSpec {
  glyph: string;
  left: number; // 0-1 fraction of width
  size: number;
  duration: number; // ms for one sway cycle
  delay: number;
  sway: number; // horizontal drift px
  rise: number; // vertical drift px
}

const LEAVES: LeafSpec[] = [
  { glyph: '🍃', left: 0.08, size: 26, duration: 5200, delay: 0, sway: 18, rise: 14 },
  { glyph: '🍃', left: 0.24, size: 18, duration: 6400, delay: 800, sway: 24, rise: 10 },
  { glyph: '🌿', left: 0.42, size: 22, duration: 5800, delay: 1600, sway: 16, rise: 16 },
  { glyph: '🍃', left: 0.62, size: 30, duration: 7000, delay: 400, sway: 28, rise: 12 },
  { glyph: '🍃', left: 0.78, size: 16, duration: 6000, delay: 1200, sway: 20, rise: 18 },
  { glyph: '🌿', left: 0.9, size: 24, duration: 6800, delay: 2000, sway: 14, rise: 10 },
];

function Leaf({ spec, height }: { spec: LeafSpec; height: number }) {
  const t = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: spec.duration,
          delay: spec.delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: spec.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const glint = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: spec.duration * 0.6,
          delay: spec.delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: spec.duration * 0.6,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    drift.start();
    glint.start();
    return () => {
      drift.stop();
      glint.stop();
    };
  }, [spec, t, shimmer]);

  const translateX = t.interpolate({
    inputRange: [0, 1],
    outputRange: [-spec.sway / 2, spec.sway / 2],
  });
  const translateY = t.interpolate({
    inputRange: [0, 1],
    outputRange: [spec.rise / 2, -spec.rise / 2],
  });
  const rotate = t.interpolate({
    inputRange: [0, 1],
    outputRange: ['-8deg', '10deg'],
  });
  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });

  return (
    <Animated.Text
      style={[
        styles.leaf,
        {
          left: `${spec.left * 100}%`,
          top: height * 0.12 + (spec.rise % 30),
          fontSize: spec.size,
          opacity,
          transform: [{ translateX }, { translateY }, { rotate }],
        },
      ]}
    >
      {spec.glyph}
    </Animated.Text>
  );
}

export function GlisteningLeaves({ height = 260 }: { height?: number }) {
  return (
    <View pointerEvents="none" style={[styles.container, { height }]}>
      {LEAVES.map((spec, i) => (
        <Leaf key={i} spec={spec} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  leaf: {
    position: 'absolute',
  },
});
