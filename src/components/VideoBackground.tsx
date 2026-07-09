import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { useVideoPlayer, VideoView, VideoSource } from 'expo-video';

/**
 * A muted, looping video backdrop that cycles through several clips, showing
 * each for `intervalMs` with a soft cross-fade. Used on the Vision hero when
 * real b-roll is supplied (see src/video/broll.ts).
 */
export function VideoBackground({
  sources,
  style,
  intervalMs = 3000,
}: {
  sources: VideoSource[];
  style?: ViewStyle;
  intervalMs?: number;
}) {
  const player = useVideoPlayer(sources[0] ?? null, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  const opacity = useRef(new Animated.Value(1)).current;
  const index = useRef(0);

  useEffect(() => {
    if (sources.length < 2) return;
    const id = setInterval(() => {
      // Fade down, swap the clip while dim, fade back up.
      Animated.timing(opacity, {
        toValue: 0.15,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        index.current = (index.current + 1) % sources.length;
        player.replace(sources[index.current]);
        player.play();
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }).start();
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [player, sources, intervalMs, opacity]);

  return (
    <Animated.View style={[style, { opacity }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        pointerEvents="none"
      />
    </Animated.View>
  );
}
