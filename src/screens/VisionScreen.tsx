import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme';
import { useDesignStore, usePlacedPlantIds } from '../store/useDesignStore';
import { getPlant } from '../data/plants';
import { SpeciesLite } from '../data/region';
import { useCurrentWeather } from '../data/region/weather';
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
  const placedList = useDesignStore((s) => s.placed);
  const region = useDesignStore((s) => s.region);

  const stats = useMemo(() => {
    let edible = 0;
    let medicinal = 0;
    let nfix = 0;
    const species = new Set<string>();
    for (const pp of placedList) {
      const p = getPlant(pp.plantId);
      if (!p) continue;
      species.add(p.id);
      if (p.edible) edible += 1;
      if (p.medicinal) medicinal += 1;
      if (p.nitrogenFixer) nfix += 1;
    }
    const counts: Record<string, number> = {};
    for (const pp of placedList) counts[pp.plantId] = (counts[pp.plantId] ?? 0) + 1;
    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id]) => getPlant(id)?.common)
      .filter((n): n is string => !!n);
    return { total: placedList.length, species: species.size, edible, medicinal, nfix, top };
  }, [placedList]);

  function shareParadise() {
    const lines = [
      "🌱 My food forest — Let's Plant Paradise",
      `${region?.koppen ? region.koppen.label + ' · ' : ''}${zoneLabel(site.zone)}`,
      `${stats.total} plantings · ${stats.species} species · ${stats.edible} edible · ${stats.medicinal} medicinal · ${stats.nfix} nitrogen-fixers`,
      stats.top.length ? `Featuring: ${stats.top.join(', ')}` : '',
      'Designing my paradise with Let\'s Plant Paradise 🌳',
    ].filter(Boolean);
    Share.share({ message: lines.join('\n') }).catch(() => {});
  }
  const resolveRegion = useDesignStore((s) => s.resolveRegion);
  const musicMuted = useDesignStore((s) => s.musicMuted);
  const toggleMusic = useDesignStore((s) => s.toggleMusic);
  const weather = useCurrentWeather(site.latitude, site.longitude);
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

          {/* Leaves drifting on a light breeze, glistening */}
          <GlisteningLeaves height={320} />

          {/* Butterflies among the plants and a softly bubbling bird bath —
              real local species when we have them, emoji otherwise. */}
          <LivingScene
            height={320}
            butterflyPhotos={(() => {
              const monarch = (region?.butterflies ?? []).find(
                (b) =>
                  /monarch/i.test(b.common ?? '') || /danaus plexippus/i.test(b.name)
              );
              return monarch?.photo ? [monarch.photo] : [];
            })()}
          />

          {/* Hens pecking and wandering along the ground */}
          <Hens height={320} />

          <View style={[styles.heroContent, { paddingTop: insets.top + spacing.md }]}>
            <Text style={styles.dawnTag}>
              {season.icon}  Dawn · {season.label}
            </Text>
            <Text style={styles.heroTitle}>Let's Plant Paradise</Text>
            <Text style={styles.heroSub}>
              {hasLocation
                ? zoneLabel(site.zone)
                : 'Set your location to grow your paradise'}
            </Text>

            {weather && (
              <Text style={styles.weatherChip}>
                {weather.icon} {Math.round((weather.tempC * 9) / 5 + 32)}°F · {weather.label}
              </Text>
            )}

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

        {/* ---- Your paradise so far ---- */}
        {stats.total > 0 && (
          <View style={styles.section}>
            <Text style={styles.kicker}>YOUR PARADISE SO FAR</Text>
            <View style={styles.statRow}>
              <StatTile n={stats.total} label="plantings" />
              <StatTile n={stats.species} label="species" />
              <StatTile n={stats.edible} label="edible" />
              <StatTile n={stats.medicinal} label="medicinal" />
              <StatTile n={stats.nfix} label="N-fixers" />
            </View>
            <Pressable style={styles.shareBtn} onPress={shareParadise}>
              <Text style={styles.shareBtnText}>📤 Share my paradise</Text>
            </Pressable>
          </View>
        )}

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

function StatTile({ n, label }: { n: number; label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statNum}>{n}</Text>
      <Text style={styles.statLbl}>{label}</Text>
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
  weatherChip: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
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
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statNum: { color: colors.primary, fontSize: 22, fontWeight: '800' },
  statLbl: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  shareBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  shareBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
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
