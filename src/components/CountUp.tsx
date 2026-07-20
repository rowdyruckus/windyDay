import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, TextStyle, StyleProp } from 'react-native';

/**
 * A number that animates up to its value whenever it changes — used to make the
 * Vision stats feel alive on first appearance instead of popping in static.
 */
export function CountUp({
  value,
  style,
  format,
  duration = 900,
}: {
  value: number;
  style?: StyleProp<TextStyle>;
  format?: (n: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const anim = useRef(new Animated.Value(0)).current;
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    anim.setValue(0);
    const id = anim.addListener(({ value: t }) => {
      setDisplay(start + (value - start) * t);
    });
    Animated.timing(anim, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      from.current = value;
    });
    return () => anim.removeListener(id);
  }, [value, duration, anim]);

  const n = Math.round(display);
  return <Text style={style}>{format ? format(n) : String(n)}</Text>;
}
