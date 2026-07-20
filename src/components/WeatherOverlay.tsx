import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, Text } from 'react-native';

/**
 * Weather-reactive touches for the Vision hero, driven by the live WMO code:
 * falling rain for wet codes, drifting clouds for overcast, a moon for night.
 */

function Raindrop({ left, delay, dur }: { left: number; delay: number; dur: number }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, { toValue: 1, duration: dur, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [y, delay, dur]);
  const translateY = y.interpolate({ inputRange: [0, 1], outputRange: [-10, 300] });
  const opacity = y.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.6, 0.6, 0] });
  return (
    <Animated.View
      style={[styles.drop, { left: `${left}%`, opacity, transform: [{ translateY }] }]}
    />
  );
}

function Cloud({ top, size, dur, delay }: { top: number; size: number; dur: number; delay: number }) {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: 1, duration: dur, delay, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [x, dur, delay]);
  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-80, 420] });
  return (
    <Animated.Text style={{ position: 'absolute', top, fontSize: size, opacity: 0.85, transform: [{ translateX }] }}>
      ☁️
    </Animated.Text>
  );
}

export function WeatherOverlay({ code, isDay }: { code: number; isDay: boolean }) {
  const raining = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
  const cloudy = code === 2 || code === 3 || code === 45 || code === 48;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {!isDay && <Text style={styles.moon}>🌙</Text>}
      {(cloudy || raining) && (
        <>
          <Cloud top={30} size={40} dur={26000} delay={0} />
          <Cloud top={64} size={30} dur={34000} delay={6000} />
        </>
      )}
      {raining &&
        Array.from({ length: 24 }).map((_, i) => (
          <Raindrop key={i} left={(i * 4.1) % 100} delay={(i % 8) * 180} dur={900 + (i % 5) * 120} />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  drop: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 14,
    borderRadius: 1,
    backgroundColor: 'rgba(200,225,255,0.8)',
  },
  moon: { position: 'absolute', top: 30, right: 30, fontSize: 34 },
});
