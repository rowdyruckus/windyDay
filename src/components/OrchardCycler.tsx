import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * An in-app "b-roll" backdrop for the Vision hero: three stylised orchard
 * scenes (dawn, morning, golden hour) that gently drift and cross-fade every
 * few seconds. Used when no real video clips are supplied (see VideoBackground
 * / src/video/broll.ts to swap in real footage).
 */

interface Scene {
  sky: [string, string, string];
  sun: string;
  trunk: string;
  canopy: string;
  canopyAlt: string;
  fruit: string;
}

const SCENES: Scene[] = [
  {
    sky: ['#ffd9a3', '#ffb27a', '#e98a5f'],
    sun: 'rgba(255,240,200,0.9)',
    trunk: '#6f4a29',
    canopy: '#2f6b3a',
    canopyAlt: '#357a41',
    fruit: '#e0553b',
  },
  {
    sky: ['#cfe8b0', '#8fce7e', '#4e9a4f'],
    sun: 'rgba(255,250,220,0.85)',
    trunk: '#7a4a24',
    canopy: '#2b7a3e',
    canopyAlt: '#3f9a52',
    fruit: '#e0a94a',
  },
  {
    sky: ['#ffd98a', '#f0a860', '#c9772f'],
    sun: 'rgba(255,225,170,0.95)',
    trunk: '#5a3a1e',
    canopy: '#285f33',
    canopyAlt: '#2f6b3a',
    fruit: '#e0553b',
  },
];

const CYCLE_MS = 3000;
const FADE_MS = 900;

function TreeRow({ scene, drift }: { scene: Scene; drift: Animated.Value }) {
  // A row of simple orchard trees along the bottom.
  const trees = [0.08, 0.28, 0.5, 0.72, 0.92];
  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: [-12, 12] });
  return (
    <Animated.View style={[styles.row, { transform: [{ translateX }] }]}>
      {trees.map((left, i) => {
        const size = i % 2 === 0 ? 120 : 96;
        return (
          <View key={i} style={{ position: 'absolute', left: `${left * 100}%`, bottom: 0, alignItems: 'center' }}>
            <View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: i % 2 === 0 ? scene.canopy : scene.canopyAlt,
              }}
            />
            <View style={{ position: 'absolute', bottom: 0, width: 3, height: 3, backgroundColor: scene.fruit, left: size * 0.35, borderRadius: 3 }} />
            <View style={{ position: 'absolute', top: size * 0.4, left: size * 0.55, width: 10, height: 10, borderRadius: 5, backgroundColor: scene.fruit }} />
            <View style={{ position: 'absolute', top: size * 0.6, left: size * 0.3, width: 9, height: 9, borderRadius: 5, backgroundColor: scene.fruit, opacity: 0.9 }} />
            <View style={{ width: 12, height: 26, backgroundColor: scene.trunk, marginTop: -6, borderRadius: 3 }} />
          </View>
        );
      })}
    </Animated.View>
  );
}

export function OrchardCycler({ height = 320 }: { height?: number }) {
  const opacities = useRef(SCENES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const drift = useRef(new Animated.Value(0)).current;
  const index = useRef(0);

  useEffect(() => {
    const gentleDrift = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    gentleDrift.start();

    const id = setInterval(() => {
      const next = (index.current + 1) % SCENES.length;
      Animated.parallel([
        Animated.timing(opacities[index.current], { toValue: 0, duration: FADE_MS, useNativeDriver: true }),
        Animated.timing(opacities[next], { toValue: 1, duration: FADE_MS, useNativeDriver: true }),
      ]).start();
      index.current = next;
    }, CYCLE_MS);

    return () => {
      gentleDrift.stop();
      clearInterval(id);
    };
  }, [opacities, drift]);

  return (
    <View style={[StyleSheet.absoluteFill, { height, overflow: 'hidden' }]}>
      {SCENES.map((scene, i) => (
        <Animated.View key={i} style={[StyleSheet.absoluteFill, { opacity: opacities[i] }]}>
          <LinearGradient colors={scene.sky} style={StyleSheet.absoluteFill} />
          <View style={[styles.sun, { backgroundColor: scene.sun }]} />
          <TreeRow scene={scene} drift={drift} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { position: 'absolute', left: 0, right: 0, bottom: 26, height: 140 },
  sun: {
    position: 'absolute',
    top: 46,
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
});
