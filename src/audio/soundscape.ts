import { useEffect, useRef, useState } from 'react';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

/**
 * Ambient dawn soundscape — local birdsong and a light breeze — for the Vision
 * screen.
 *
 * To bring it to life, drop a looping recording (m4a/mp3) into
 * `assets/audio/` and point AMBIENCE_SOURCE at it, e.g.
 *
 *   export const AMBIENCE_SOURCE = require('../../assets/audio/dawn-chorus.m4a');
 *
 * Ideally the recording is the dawn chorus of the *user's own region*; a future
 * version can select a track by latitude/biome. Until a source is set the
 * toggle stays gracefully inert and the UI explains how to enable it.
 */
export const AMBIENCE_SOURCE: number | { uri: string } | null = null;

export interface Soundscape {
  available: boolean;
  playing: boolean;
  toggle: () => void;
}

export function useSoundscape(): Soundscape {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const available = AMBIENCE_SOURCE != null;

  useEffect(() => {
    if (!available) return;
    // Allow playback to continue in silent mode — a garden should still sing.
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const player = createAudioPlayer(AMBIENCE_SOURCE);
    player.loop = true;
    playerRef.current = player;
    return () => {
      player.remove();
      playerRef.current = null;
    };
  }, [available]);

  const toggle = () => {
    const player = playerRef.current;
    if (!player) return;
    if (playing) {
      player.pause();
      setPlaying(false);
    } else {
      player.seekTo(0);
      player.play();
      setPlaying(true);
    }
  };

  return { available, playing, toggle };
}
