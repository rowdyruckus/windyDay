import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

/**
 * Life moving through the morning garden: butterflies drifting between plants
 * and a bird bath with softly bubbling water. Decorative mood-setting for the
 * Vision screen.
 *
 * Butterfly and plant choices are generic here; a future version can pick
 * region-appropriate pollinators (e.g. by latitude/biome) so the species you
 * see are the ones that would truly visit your land.
 */

interface FlyerSpec {
  glyph: string;
  startLeft: number; // 0-1
  top: number; // px within scene
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
}

const BUTTERFLIES: FlyerSpec[] = [
  { glyph: '🦋', startLeft: 0.15, top: 150, size: 22, duration: 6400, delay: 300, driftX: 60, driftY: -40 },
  { glyph: '🦋', startLeft: 0.55, top: 190, size: 18, duration: 7200, delay: 1400, driftX: -50, driftY: -30 },
  { glyph: '🦋', startLeft: 0.78, top: 165, size: 20, duration: 6800, delay: 900, driftX: -40, driftY: -50 },
];

function Butterfly({ spec }: { spec: FlyerSpec }) {
  const t = useRef(new Animated.Value(0)).current;
  const flutter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const path = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: spec.duration,
          delay: spec.delay,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration: spec.duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const wings = Animated.loop(
      Animated.sequence([
        Animated.timing(flutter, {
          toValue: 1,
          duration: 220,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(flutter, {
          toValue: 0,
          duration: 220,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    path.start();
    wings.start();
    return () => {
      path.stop();
      wings.stop();
    };
  }, [spec, t, flutter]);

  const translateX = t.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, spec.driftX, 0],
  });
  const translateY = t.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, spec.driftY, 0],
  });
  const scaleX = flutter.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.6],
  });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: `${spec.startLeft * 100}%`,
        top: spec.top,
        fontSize: spec.size,
        transform: [{ translateX }, { translateY }, { scaleX }],
      }}
    >
      {spec.glyph}
    </Animated.Text>
  );
}

function BirdBath() {
  const ripple = useRef(new Animated.Value(0)).current;
  const bubble = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const r = Animated.loop(
      Animated.timing(ripple, {
        toValue: 1,
        duration: 2600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    const b = Animated.loop(
      Animated.timing(bubble, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    r.start();
    b.start();
    return () => {
      r.stop();
      b.stop();
    };
  }, [ripple, bubble]);

  const rippleScale = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.6] });
  const rippleOpacity = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });
  const bubbleY = bubble.interpolate({ inputRange: [0, 1], outputRange: [4, -8] });
  const bubbleOpacity = bubble.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.9, 0],
  });

  return (
    <View style={styles.birdBathWrap}>
      <View style={styles.basin}>
        <Animated.View
          style={[
            styles.ripple,
            { opacity: rippleOpacity, transform: [{ scale: rippleScale }] },
          ]}
        />
        <Animated.View
          style={[styles.bubble, { opacity: bubbleOpacity, transform: [{ translateY: bubbleY }] }]}
        />
        <Text style={styles.bird}>🐦</Text>
      </View>
      <View style={styles.pedestal} />
    </View>
  );
}

export function LivingScene({ height = 320 }: { height?: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { height }]}>
      {BUTTERFLIES.map((spec, i) => (
        <Butterfly key={i} spec={spec} />
      ))}
      <BirdBath />
    </View>
  );
}

const styles = StyleSheet.create({
  birdBathWrap: {
    position: 'absolute',
    right: 18,
    bottom: 8,
    alignItems: 'center',
  },
  basin: {
    width: 54,
    height: 20,
    borderRadius: 27,
    backgroundColor: 'rgba(120,190,220,0.75)',
    borderWidth: 2,
    borderColor: 'rgba(230,245,250,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ripple: {
    position: 'absolute',
    width: 24,
    height: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  bubble: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  bird: { fontSize: 14, position: 'absolute', top: -12 },
  pedestal: {
    width: 10,
    height: 22,
    backgroundColor: 'rgba(180,190,180,0.55)',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
});
