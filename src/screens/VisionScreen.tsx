import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme';
import { useDesignStore, usePlacedPlantIds } from '../store/useDesignStore';
import { getPlant } from '../data/plants';
import { SpeciesLite } from '../data/region';
import { useCurrentWeather, usePlantingHint } from '../data/region/weather';
import { WeatherOverlay } from '../components/WeatherOverlay';
import { paradiseScore } from '../data/score';
import { totalYieldKg, formatYield } from '../data/yield';
import { totalDollarsPerYear, formatMoney } from '../data/economics';
import { totalCo2KgPerYear, formatCo2, carEquivalentKm } from '../data/carbon';
import { pollinatorReport } from '../data/pollinators';
import { recommendPlants } from '../data/recommend';
import { milestones } from '../data/milestones';
import { CountUp } from '../components/CountUp';
import { formatTemp } from '../data/units';
import { ForestLayer } from '../types';
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
  const structures = useDesignStore((s) => s.structures);
  const region = useDesignStore((s) => s.region);
  const placePlant = useDesignStore((s) => s.placePlant);
  const gettingStartedDismissed = useDesignStore((s) => s.gettingStartedDismissed);
  const dismissGettingStarted = useDesignStore((s) => s.dismissGettingStarted);

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
  const units = useDesignStore((s) => s.units);
  const score = useMemo(() => paradiseScore(placedList), [placedList]);
  const harvestKg = useMemo(() => totalYieldKg(placedList), [placedList]);
  const savings = useMemo(() => totalDollarsPerYear(placedList), [placedList]);
  const co2 = useMemo(() => totalCo2KgPerYear(placedList), [placedList]);
  const pollinators = useMemo(() => pollinatorReport(placedList), [placedList]);
  const recs = useMemo(() => recommendPlants(placedList, site, 3), [placedList, site]);
  const badges = useMemo(
    () => milestones(placedList, structures),
    [placedList, structures]
  );
  const earnedCount = badges.filter((b) => b.earned).length;

  // First-win: one tap plants a suited anchor tree on the user's land.
  function plantFirstTree() {
    if (site.latitude == null || site.longitude == null) {
      navigation.navigate('Site');
      return;
    }
    const rec =
      recs.find((r) => r.plant.layer === 'canopy' || r.plant.layer === 'understory') ?? recs[0];
    if (!rec) {
      navigation.navigate('Plants');
      return;
    }
    placePlant(rec.plant.id, site.latitude, site.longitude);
    Alert.alert(
      '🌳 Your first tree!',
      `${rec.plant.common} is planted on your land — and you've earned your first milestone. Watch your paradise grow.`,
      [
        { text: 'See it on the map', onPress: () => navigation.navigate('Design') },
        { text: 'Nice!' },
      ]
    );
  }

  // Get-started checklist: auto-checks as the design grows.
  const steps = useMemo(
    () => [
      { key: 'plant', label: 'Add your first plant', done: stats.total > 0, go: 'Plants' as const },
      { key: 'variety', label: 'Grow 5 different species', done: stats.species >= 5, go: 'Plants' as const },
      { key: 'thrive', label: 'Reach a Thriving score (60+)', done: score.score >= 60, go: 'Design' as const },
    ],
    [stats.total, stats.species, score.score]
  );
  const stepsDone = steps.filter((s) => s.done).length;

  const plantingHint = usePlantingHint(site.latitude, site.longitude);
  const tips = useMemo(() => {
    const layers = new Set<ForestLayer>();
    let nfix = 0;
    let medicinal = 0;
    const species = new Set<string>();
    for (const pp of placedList) {
      const p = getPlant(pp.plantId);
      if (!p) continue;
      layers.add(p.layer);
      if (p.nitrogenFixer) nfix += 1;
      if (p.medicinal) medicinal += 1;
      species.add(p.id);
    }
    const out: { icon: string; text: string }[] = [];
    if (placedList.length > 0) {
      if (nfix === 0) out.push({ icon: '🌱', text: 'Add a nitrogen fixer' });
      if (!layers.has('groundcover')) out.push({ icon: '☘️', text: 'Add a ground cover' });
      if (!layers.has('herbaceous')) out.push({ icon: '🌿', text: 'Add herbs' });
      if (medicinal === 0) out.push({ icon: '⚕️', text: 'Add a medicinal plant' });
      if (species.size < 8) out.push({ icon: '🌈', text: 'Add more variety' });
    }
    return out.slice(0, 3);
  }, [placedList]);
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

          {/* Live-weather touches: rain / clouds / night */}
          {weather && <WeatherOverlay code={weather.code} isDay={weather.isDay} />}

          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={[styles.gear, { top: insets.top + spacing.sm }]}
          >
            <Text style={styles.gearIcon}>⚙️</Text>
          </Pressable>

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
                {weather.icon} {formatTemp(weather.tempC, units)} · {weather.label}
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

        {/* ---- First win: plant your first tree in one tap ---- */}
        {hasLocation && stats.total === 0 && (
          <View style={styles.section}>
            <View style={styles.firstWin}>
              <Text style={styles.firstWinTitle}>🌳 Plant your first tree</Text>
              <Text style={styles.firstWinBody}>
                We'll drop a tree suited to your climate onto your land — your paradise
                starts with one tap.
              </Text>
              <Pressable style={styles.firstWinBtn} onPress={plantFirstTree}>
                <Text style={styles.firstWinBtnText}>Plant it now →</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ---- Get-started checklist ---- */}
        {hasLocation && !gettingStartedDismissed && stepsDone < steps.length && (
          <View style={styles.section}>
            <View style={styles.checklist}>
              <View style={styles.checkHead}>
                <Text style={styles.checkTitle}>Get started · {stepsDone}/{steps.length}</Text>
                <Pressable onPress={dismissGettingStarted} hitSlop={8}>
                  <Text style={styles.checkDismiss}>Hide</Text>
                </Pressable>
              </View>
              {steps.map((st) => (
                <Pressable
                  key={st.key}
                  style={styles.stepRow}
                  onPress={() => !st.done && navigation.navigate(st.go)}
                >
                  <View style={[styles.stepBox, st.done && styles.stepBoxOn]}>
                    {st.done && <Text style={styles.stepCheck}>✓</Text>}
                  </View>
                  <Text style={[styles.stepText, st.done && styles.stepTextDone]}>{st.label}</Text>
                  {!st.done && <Text style={styles.stepGo}>›</Text>}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ---- Your paradise so far ---- */}
        {stats.total > 0 && (
          <View style={styles.section}>
            <Text style={styles.kicker}>YOUR PARADISE SO FAR</Text>
            <View style={styles.scoreRow}>
              <CountUp value={score.score} style={styles.scoreNum} />
              <View style={{ flex: 1 }}>
                <Text style={styles.scoreLabel}>Paradise score · {score.label}</Text>
                <View style={styles.scoreBar}>
                  <View style={[styles.scoreFill, { width: `${score.score}%` }]} />
                </View>
              </View>
            </View>
            <View style={styles.statRow}>
              <StatTile n={stats.total} label="plantings" />
              <StatTile n={stats.species} label="species" />
              <StatTile n={stats.edible} label="edible" />
              <StatTile n={stats.medicinal} label="medicinal" />
              <StatTile n={stats.nfix} label="N-fixers" />
            </View>
            {harvestKg > 0 && (
              <Text style={styles.harvest}>
                🧺 Harvest potential ~{formatYield(harvestKg, units === 'imperial')}/yr at maturity
              </Text>
            )}
            {(savings > 0 || co2 > 0) && (
              <View style={styles.impactRow}>
                {savings > 0 && (
                  <View style={styles.impactTile}>
                    <CountUp
                      value={savings}
                      style={styles.impactNum}
                      format={(n) => `~${formatMoney(n)}`}
                    />
                    <Text style={styles.impactLbl}>groceries/yr</Text>
                  </View>
                )}
                {co2 > 0 && (
                  <View style={styles.impactTile}>
                    <CountUp
                      value={co2}
                      style={styles.impactNum}
                      format={(n) => `~${formatCo2(n)}`}
                    />
                    <Text style={styles.impactLbl}>
                      CO₂/yr · {carEquivalentKm(co2).toLocaleString()} km driving
                    </Text>
                  </View>
                )}
              </View>
            )}
            {tips.length > 0 && (
              <View style={styles.tipsWrap}>
                <Text style={styles.tipsTitle}>Grow your score</Text>
                <View style={styles.tipsRow}>
                  {tips.map((t, i) => (
                    <Pressable key={i} style={styles.tip} onPress={() => navigation.navigate('Plants')}>
                      <Text style={styles.tipText}>
                        {t.icon} {t.text}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
            <Pressable style={styles.shareBtn} onPress={shareParadise}>
              <Text style={styles.shareBtnText}>📤 Share my paradise</Text>
            </Pressable>
          </View>
        )}

        {/* ---- Plant next: smart, site-suited suggestions ---- */}
        {hasLocation && recs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.kicker}>PLANT NEXT</Text>
            <Text style={styles.bountyTitle}>
              {stats.total > 0 ? 'Fill the gaps in your forest' : 'Great ways to begin'}
            </Text>
            {recs.map((r) => (
              <Pressable
                key={r.plant.id}
                style={styles.recRow}
                onPress={() => navigation.navigate('PlantDetail', { plantId: r.plant.id })}
              >
                <Text style={styles.recIcon}>{r.plant.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recName}>{r.plant.common}</Text>
                  <Text style={styles.recReason}>{r.reason}</Text>
                </View>
                <Text style={styles.recAdd}>＋</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* ---- Pollinator forage across the year ---- */}
        {stats.total > 0 && (
          <View style={styles.section}>
            <Text style={styles.kicker}>POLLINATOR FORAGE</Text>
            <View style={styles.scoreRow}>
              <CountUp
                value={pollinators.score}
                style={styles.beeNum}
                format={(n) => `🐝 ${n}`}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.scoreLabel}>
                  Bloom coverage · {pollinators.gaps.length === 0 ? 'year-round forage' : 'some gaps'}
                </Text>
                <View style={styles.bloomStrip}>
                  {pollinators.bloomByMonth.map((c, i) => (
                    <View
                      key={i}
                      style={[
                        styles.bloomCell,
                        { backgroundColor: c > 0 ? colors.accent : colors.surfaceAlt },
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>
            {pollinators.gaps.length > 0 ? (
              <Text style={styles.bountyBody}>
                No blooms in {pollinators.gaps.map((m) => MONTHS_LONG[m - 1]).join(', ')} — add a
                plant that flowers then to keep bees & butterflies fed all season.
              </Text>
            ) : (
              <Text style={styles.bountyBody}>
                Something's in flower every month of your season — a feast for bees and butterflies.
              </Text>
            )}
          </View>
        )}

        {/* ---- Milestones ---- */}
        {hasLocation && (
          <View style={styles.section}>
            <Text style={styles.kicker}>MILESTONES · {earnedCount}/{badges.length}</Text>
            <View style={styles.badgeGrid}>
              {badges.map((b) => (
                <View key={b.id} style={[styles.badge, b.earned && styles.badgeOn]}>
                  <Text style={[styles.badgeIcon, !b.earned && styles.badgeIconOff]}>{b.icon}</Text>
                  <Text style={[styles.badgeTitle, b.earned && styles.badgeTitleOn]}>{b.title}</Text>
                  <Text style={styles.badgeDetail}>{b.earned ? 'Earned' : b.detail}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {plantingHint && (
          <View style={styles.section}>
            <View style={styles.hintCard}>
              <Text style={styles.hintIcon}>{plantingHint.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.hintTitle}>This week</Text>
                <Text style={styles.hintText}>{plantingHint.text}</Text>
              </View>
            </View>
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
      <CountUp value={n} style={styles.statNum} />
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
  gear: {
    position: 'absolute',
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15,26,18,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: { fontSize: 20 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  scoreNum: { color: colors.primary, fontSize: 40, fontWeight: '900' },
  scoreLabel: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  scoreBar: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  scoreFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
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
  harvest: { color: colors.text, fontSize: 14, fontWeight: '600', marginTop: spacing.md },
  firstWin: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  firstWinTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  firstWinBody: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
  firstWinBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  firstWinBtnText: { color: '#0f1a12', fontWeight: '800', fontSize: 15 },
  checklist: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  checkHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  checkTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  checkDismiss: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  stepBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stepBoxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepCheck: { color: '#0f1a12', fontSize: 14, fontWeight: '900' },
  stepText: { color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  stepTextDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  stepGo: { color: colors.textMuted, fontSize: 22 },
  impactRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  impactTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  impactNum: { color: colors.accent, fontSize: 18, fontWeight: '800' },
  impactLbl: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  recIcon: { fontSize: 26, marginRight: spacing.md },
  recName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  recReason: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  recAdd: { color: colors.primary, fontSize: 26, fontWeight: '800', marginLeft: spacing.sm },
  beeNum: { color: colors.accent, fontSize: 30, fontWeight: '900' },
  bloomStrip: { flexDirection: 'row', gap: 3, marginTop: 6 },
  bloomCell: { flex: 1, height: 10, borderRadius: 2 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  badge: {
    width: '31%',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    opacity: 0.6,
  },
  badgeOn: { opacity: 1, borderColor: colors.primary },
  badgeIcon: { fontSize: 26 },
  badgeIconOff: { opacity: 0.5 },
  badgeTitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  badgeTitleOn: { color: colors.text },
  badgeDetail: { color: colors.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center' },
  tipsWrap: { marginTop: spacing.md },
  tipsTitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  tipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tip: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  tipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  hintIcon: { fontSize: 26, marginRight: spacing.md },
  hintTitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  hintText: { color: colors.text, fontSize: 14, marginTop: 2, lineHeight: 19 },
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
