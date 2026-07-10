import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

/**
 * A little fruit tree that grows on a loop — a seedling sprouts, the trunk
 * rises, the canopy unfurls and fruit ripens, then it gently resets. Purely
 * decorative; used as an animated example on the aerial Design view.
 * Uses the JS driver (layout + non-transform props), which is fine for one
 * small element.
 */
export function GrowingPlant({ size = 1 }: { size?: number }) {
  const grow = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const cycle = Animated.loop(
      Animated.sequence([
        Animated.timing(grow, {
          toValue: 1,
          duration: 4200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.delay(1600),
        Animated.timing(grow, {
          toValue: 0,
          duration: 700,
          easing: Easing.in(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.delay(400),
      ])
    );
    const breeze = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(sway, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    );
    cycle.start();
    breeze.start();
    return () => {
      cycle.stop();
      breeze.stop();
    };
  }, [grow, sway]);

  const s = size;
  const trunkH = grow.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 14 * s, 34 * s] });
  const canopyScale = grow.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 0, 1] });
  const sproutOpacity = grow.interpolate({ inputRange: [0, 0.1, 0.4], outputRange: [0, 1, 0] });
  const fruitOpacity = grow.interpolate({ inputRange: [0, 0.75, 1], outputRange: [0, 0, 1] });
  const rotate = sway.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={{ alignItems: 'center', transform: [{ rotate }] }}>
        {/* Canopy */}
        <Animated.View
          style={[
            styles.canopy,
            { width: 78 * s, height: 70 * s, transform: [{ scale: canopyScale }] },
          ]}
        >
          <View style={[styles.leaf, { backgroundColor: '#357a41', left: -6 * s, top: 10 * s, width: 44 * s, height: 44 * s }]} />
          <View style={[styles.leaf, { backgroundColor: '#296233', right: -6 * s, top: 12 * s, width: 44 * s, height: 44 * s }]} />
          <View style={[styles.leaf, { backgroundColor: '#2f6b3a', left: 17 * s, top: -4 * s, width: 46 * s, height: 46 * s }]} />
          <View style={[styles.highlight, { width: 22 * s, height: 22 * s, left: 14 * s, top: 8 * s }]} />
          <Animated.View style={[styles.fruit, { opacity: fruitOpacity, backgroundColor: '#e0553b', left: 12 * s, top: 30 * s, width: 10 * s, height: 10 * s }]} />
          <Animated.View style={[styles.fruit, { opacity: fruitOpacity, backgroundColor: '#e0a94a', right: 14 * s, top: 22 * s, width: 10 * s, height: 10 * s }]} />
          <Animated.View style={[styles.fruit, { opacity: fruitOpacity, backgroundColor: '#e0553b', left: 34 * s, top: 40 * s, width: 9 * s, height: 9 * s }]} />
        </Animated.View>

        {/* Sprout leaves (early stage, fade out as canopy grows) */}
        <Animated.Text style={[styles.sprout, { opacity: sproutOpacity, fontSize: 20 * s }]}>🌱</Animated.Text>

        {/* Trunk */}
        <Animated.View style={[styles.trunk, { width: 8 * s, height: trunkH }]} />
      </Animated.View>
      {/* Ground shadow */}
      <View style={[styles.shadow, { width: 44 * s, height: 8 * s }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'flex-end' },
  canopy: { alignItems: 'center', justifyContent: 'center' },
  leaf: { position: 'absolute', borderRadius: 999 },
  highlight: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(120,200,120,0.6)' },
  fruit: { position: 'absolute', borderRadius: 999 },
  sprout: { position: 'absolute', bottom: 10 },
  trunk: { backgroundColor: '#7a4a24', borderRadius: 4, marginTop: -2 },
  shadow: { backgroundColor: 'rgba(0,0,0,0.28)', borderRadius: 999, marginTop: 2 },
});
