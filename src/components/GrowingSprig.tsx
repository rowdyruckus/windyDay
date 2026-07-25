import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

/**
 * A tiny tree that grows on a gentle loop — a trunk rises and a canopy unfurls,
 * then it resets. Sized to sit *behind* a small emoji/icon as a living backdrop.
 * Uses the native driver (transform + opacity only) so many can run at once
 * without touching the JS thread. `delayMs` staggers a row so they don't grow
 * in unison.
 */
export function GrowingSprig({
  size = 26,
  delayMs = 0,
  maxOpacity = 0.5,
}: {
  size?: number;
  delayMs?: number;
  maxOpacity?: number;
}) {
  const grow = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const cycle = Animated.loop(
      Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(grow, {
          toValue: 1,
          duration: 3200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(grow, {
          toValue: 0,
          duration: 600,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(500),
      ])
    );
    const breeze = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    cycle.start();
    breeze.start();
    return () => {
      cycle.stop();
      breeze.stop();
    };
  }, [grow, sway, delayMs]);

  const trunkH = size * 0.55;
  const canopyD = size * 0.8;

  const canopyScale = grow.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.15, 1] });
  // Scale the trunk from its base by pairing scaleY with a downward translate.
  const trunkScaleY = grow.interpolate({ inputRange: [0, 1], outputRange: [0.06, 1] });
  const trunkTranslateY = grow.interpolate({ inputRange: [0, 1], outputRange: [trunkH * 0.47, 0] });
  const opacity = grow.interpolate({
    inputRange: [0, 0.2, 0.9, 1],
    outputRange: [0, maxOpacity, maxOpacity, maxOpacity * 0.9],
  });
  const rotate = sway.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] });

  return (
    <Animated.View
      style={[styles.wrap, { width: size, height: size, opacity }]}
      pointerEvents="none"
    >
      <Animated.View style={{ alignItems: 'center', transform: [{ rotate }] }}>
        <Animated.View
          style={[
            styles.canopy,
            { width: canopyD, height: canopyD, borderRadius: canopyD, transform: [{ scale: canopyScale }] },
          ]}
        />
        <Animated.View
          style={[
            styles.trunk,
            {
              width: Math.max(2, size * 0.09),
              height: trunkH,
              transform: [{ translateY: trunkTranslateY }, { scaleY: trunkScaleY }],
            },
          ]}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'flex-end' },
  canopy: { backgroundColor: '#3f8f4c' },
  trunk: { backgroundColor: '#7a4a24', borderRadius: 3, marginTop: -3 },
});
