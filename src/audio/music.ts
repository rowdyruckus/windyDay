import { useEffect, useRef } from 'react';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

/**
 * Dramatic, inspiring startup music.
 *
 * To enable it, drop a track into `assets/audio/` and point MUSIC_SOURCE at it:
 *
 *   export const MUSIC_SOURCE = require('../../assets/audio/startup.mp3');
 *
 * Use a PUBLIC-DOMAIN recording (composition + performance both free). Great,
 * on-theme choices — sunrise / nature / soaring:
 *   • Grieg — "Morning Mood" (Peer Gynt)      ← perfect dawn-in-the-garden feel
 *   • R. Strauss — "Sunrise" (Also sprach Zarathustra)  ← maximum drama
 *   • Vivaldi — "Spring" (The Four Seasons)
 *   • Beethoven — "Ode to Joy" (Symphony No. 9 finale)
 *
 * Free, legally-clear recordings: Musopen.org (many CC0), IMSLP, Wikimedia
 * Commons. Trim to ~30–60s for a tasteful intro if you like.
 *
 * Leave this null to keep the app silent on launch.
 */
export const MUSIC_SOURCE: number | { uri: string } | null = require('../../assets/audio/startup.mp3');

export const MUSIC_AVAILABLE = MUSIC_SOURCE != null;

/** Plays the startup track once (looping off) unless muted. */
export function useStartupMusic(muted: boolean) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const available = MUSIC_SOURCE != null;

  useEffect(() => {
    if (!available) return;
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const player = createAudioPlayer(MUSIC_SOURCE);
    player.volume = 0.6;
    playerRef.current = player;
    if (!muted) player.play();
    return () => {
      player.remove();
      playerRef.current = null;
    };
    // Create the player once; mute is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (muted) player.pause();
    else player.play();
  }, [muted]);
}
