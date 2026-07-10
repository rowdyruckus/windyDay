import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme';
import { useDesignStore, usePlacedPlantIds } from '../store/useDesignStore';
import { SpeciesLite } from '../data/region';
import {
  MONTHS_LONG,
  peakBountyMonth,
  plantsHarvestingIn,
  seasonForMonth,
  SEASON_META,
} from '../data/season';
import { zoneLabel } from '../data/climate';
import { GlisteningLeaves } from '../components/GlisteningLeaves';
import { LivingScene } from '../components/LivingScene';
import { Hens } from '../components/Hens';
import { OrchardCycler } from '../components/OrchardCycler';
import { VideoBackground } from '../components/VideoBackground';
import { BROLL_SOURCES } from '../video/broll';
import { useSoundscape } from '../audio/soundscape';
import { MUSIC_AVAILABLE } from '../audio/music';

export function VisionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const site = useDesignStore((s) => s.site);
  const placedIds = usePlacedPlantIds();
  const region = useDesignStore((s) => s.region);
  const resolveRegion = useDesignStore((s) => s.resolveRegion);
  const musicMuted = useDesignStore((s) => s.musicMuted);
  const toggleMusic = useDesignStore((s) => s.toggleMusic);
  const sound = useSoundscape();

  // Make sure region life is loaded even if the user lands here first.
  useEffect(() => {
    if (site.latitude != null && site.longitude != null) {
      resolveRegion(site.latitude, site.longitude);
    }
  }, [site.latitude, site.longitude, resolveRegion]);

  const peakMonth = useMemo(() => peakBountyMonth(placedIds), [placedIds]);
  const fruiting = useMemo(
    () => plantsHarvestingIn(placedIds, peakMonth),
    [placedIds, peakMonth]
  );
  const season = SEASON_META[seasonForMonth(peakMonth)];
  const hasLocation = site.latitude != null && site.longitude != null;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {/* ---- Sunrise hero: cycling orchard b-roll ---- */}
        <View style={styles.hero}>
          {BROLL_SOURCES.length > 0 ? (
            <VideoBackground sources={BROLL_SOURCES} style={StyleSheet.absoluteFill} />
          ) : (
            <OrchardCycler height={320} />
          )}

          {/* Warm dawn light washing over the scene */}
          <LinearGradient
            colors={[
              'rgba(255,196,120,0.55)',
              'rgba(255,150,90,0.28)',
              'rgba(15,26,18,0.15)',
              'rgba(15,26,18,0.85)',
            ]}
            locations={[0, 0.35, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Rising sun glow */}
          <View style={styles.sun} />
          <View style={styles.sunCore} />

          {/* Leaves drifting on a light breeze, glistening */}
          <GlisteningLeaves height={320} />

          {/* Butterflies among the plants and a softly bubbling bird bath —
              real local species when we have them, emoji otherwise. */}
          <LivingScene
            height={320}
            butterflyPhotos={(region?.butterflies ?? [])
              .map((b) => b.photo)
              .filter((p): p is string => !!p)
              .slice(0, 3)}
          />

          {/* Hens pecking and wandering along the ground */}
          <Hens height={320} />

          <View style={[styles.heroContent, { paddingTop: insets.top + spacing.md }]}>
            <Text style={styles.dawnTag}>
              {season.icon}  Let's Plant Paradise · Dawn · {season.label}
            </Text>
            <Text style={styles.heroTitle}>{site.label}</Text>
            <Text style={styles.heroSub}>
              {hasLocation
                ? zoneLabel(site.zone)
                : 'Set your location to grow your paradise'}
            </Text>

            <Pressable
              onPress={() => {
                if (sound.available) sound.toggle();
              }}
              style={styles.soundBtn}
            >
              <Text style={styles.soundIcon}>
                {sound.available ? (sound.playing ? '🔊' : '🐦') : '🔈'}
              </Text>
              <Text style={styles.soundText}>
                {sound.available
                  ? sound.playing
                    ? 'Dawn chorus playing'
                    : 'Play the dawn chorus'
                  : 'Add a soundscape to hear birdsong & bubbling water'}
              </Text>
            </Pressable>

            {MUSIC_AVAILABLE && (
              <Pressable onPress={toggleMusic} style={styles.soundBtn}>
                <Text style={styles.soundIcon}>{musicMuted ? '🔇' : '🎵'}</Text>
                <Text style={styles.soundText}>
                  {musicMuted ? 'Music off' : 'Music playing'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ---- Peak bounty ---- */}
        <View style={styles.section}>
          <Text style={styles.kicker}>YOUR MOMENT OF ABUNDANCE</Text>
          <Text style={styles.bountyTitle}>
            In {MONTHS_LONG[peakMonth - 1]}, your forest is heavy with fruit
          </Text>

          {fruiting.length > 0 ? (
            <>
              <Text style={styles.bountyBody}>
                {fruiting.length} planting
                {fruiting.length === 1 ? '' : 's'} ripening at once — a warm,
                glistening morning of harvest.
              </Text>
              <View style={styles.fruitRow}>
                {fruiting.slice(0, 12).map((p) => (
                  <View key={p.id} style={styles.fruitChip}>
                    <Text style={styles.fruitIcon}>{p.icon}</Text>
                    <Text style={styles.fruitName}>{p.common}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.bountyBody}>
              Your land is waiting. Add fruit trees, berries and herbs, and
              we'll show you the glorious morning they'll create together.
            </Text>
          )}
        </View>

        {/* ---- Real local life ---- */}
        {region && (region.butterflies.length > 0 || region.birds.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.kicker}>LIFE AT YOUR DAWN</Text>
            <Text style={styles.bountyTitle}>Who visits your morning</Text>
            <Text style={styles.bountyBody}>
              Really seen near you — from thousands of iNaturalist observations.
            </Text>

            {region.butterflies.length > 0 && (
              <SpeciesStrip title="🦋 Butterflies" species={region.butterflies} />
            )}
            {region.birds.length > 0 && (
              <SpeciesStrip title="🐦 Birdsong from" species={region.birds} />
            )}
          </View>
        )}

        {/* ---- Calls to action ---- */}
        <View style={styles.section}>
          <CTA
            icon="📍"
            title={hasLocation ? 'Refine your site' : 'Start with your location'}
            body="See your land from above and find your climate."
            onPress={() => navigation.navigate('Site')}
          />
          <CTA
            icon="🌱"
            title="Discover what will thrive"
            body="Fruit trees, edible & medicinal shrubs, vines and ground covers for your zone."
            onPress={() => navigation.navigate('Plants')}
          />
          <CTA
            icon="🗺️"
            title="Design your forest"
            body="Place plants onto the satellite view of your land."
            onPress={() => navigation.navigate('Design')}
          />
        </View>

        <Text style={styles.footer}>
          "The best time to plant a tree was 20 years ago. The second best time
          is now."
        </Text>
      </ScrollView>
    </View>
  );
}

function SpeciesStrip({
  title,
  species,
}: {
  title: string;
  species: SpeciesLite[];
}) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={styles.stripTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingVertical: 4 }}
      >
        {species.map((s) => (
          <View key={s.id} style={styles.speciesCard}>
            {s.photo ? (
              <Image source={{ uri: s.photo }} style={styles.speciesPhoto} />
            ) : (
              <View style={[styles.speciesPhoto, styles.speciesPhotoEmpty]}>
                <Text style={{ fontSize: 22 }}>🌿</Text>
              </View>
            )}
            <Text style={styles.speciesName} numberOfLines={2}>
              {s.common ?? s.name}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function CTA({
  icon,
  title,
  body,
  onPress,
}: {
  icon: string;
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cta, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.ctaIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.ctaTitle}>{title}</Text>
        <Text style={styles.ctaBody}>{body}</Text>
      </View>
      <Text style={styles.ctaChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    height: 320,
    backgroundColor: '#243b2b',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  sun: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,214,150,0.35)',
  },
  sunCore: {
    position: 'absolute',
    top: 90,
    alignSelf: 'center',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,236,196,0.85)',
  },
  heroContent: { padding: spacing.lg },
  dawnTag: {
    color: '#ffe9c7',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowRadius: 8,
  },
  heroSub: {
    color: '#f2fff0',
    fontSize: 15,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 6,
  },
  soundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: 'rgba(15,26,18,0.55)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  soundIcon: { fontSize: 18, marginRight: spacing.sm },
  soundText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  bountyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  bountyBody: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  fruitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  fruitChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fruitIcon: { fontSize: 18, marginRight: 6 },
  fruitName: { color: colors.text, fontWeight: '600', fontSize: 13 },
  stripTitle: { color: colors.textMuted, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  speciesCard: { width: 88 },
  speciesPhoto: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  speciesPhotoEmpty: { alignItems: 'center', justifyContent: 'center' },
  speciesName: { color: colors.text, fontSize: 12, marginTop: 4, fontWeight: '600' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  ctaIcon: { fontSize: 26, marginRight: spacing.md },
  ctaTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  ctaBody: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  ctaChevron: { color: colors.textMuted, fontSize: 28, marginLeft: spacing.sm },
  footer: {
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    fontSize: 13,
  },
});
