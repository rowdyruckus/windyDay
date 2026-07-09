import type { VideoSource } from 'expo-video';

/**
 * Real fruit-tree b-roll for the Vision hero.
 *
 * The hero shows an animated orchard backdrop by default. To use real footage
 * instead, add up to three short clips and list them here — the hero will cycle
 * them 3 seconds each with a cross-fade.
 *
 * TWO WAYS TO ENABLE:
 *
 * 1) Bundled files (works offline). Drop clips into `assets/video/` and require
 *    them (clips can be any length — we only show ~3s of each):
 *
 *      import b1 from '../../assets/video/broll1.mp4';
 *      import b2 from '../../assets/video/broll2.mp4';
 *      import b3 from '../../assets/video/broll3.mp4';
 *      export const BROLL_SOURCES: VideoSource[] = [b1, b2, b3];
 *
 * 2) Remote URLs (needs a connection):
 *
 *      export const BROLL_SOURCES: VideoSource[] = [
 *        { uri: 'https://example.com/orchard-1.mp4' },
 *        { uri: 'https://example.com/orchard-2.mp4' },
 *      ];
 *
 * Great free, no-attribution sources for short orchard/fruit-tree clips:
 *   • Mixkit    https://mixkit.co/free-stock-video/orchard/
 *   • Coverr    https://coverr.co/s?q=orchard
 *   • Pexels    https://www.pexels.com/search/videos/fruit%20tree/
 *
 * Leave this empty to keep the animated orchard backdrop.
 */
export const BROLL_SOURCES: VideoSource[] = [];
