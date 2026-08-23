import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme';
import { useDesignStore } from '../store/useDesignStore';
import { getPlant } from '../data/plants';
import { totalYieldKg, formatYield } from '../data/yield';
import { totalDollarsPerYear, formatMoney } from '../data/economics';
import { polygonAreaM2 } from '../data/geo';
import { zoneLabel } from '../data/climate';
import {
  ACTIONS,
  CASE_POINTS,
  INVITES,
  InviteContext,
  InviteKind,
  PLEDGE_LINES,
  flockSummary,
  inviteMessage,
} from '../data/advocacy';

/** Area of the drawn boundary, in the user's units. */
function formatArea(m2: number, imperial: boolean): string {
  if (imperial) {
    const acres = m2 / 4046.86;
    if (acres < 0.25) return `${Math.round(m2 * 10.7639).toLocaleString()} sq ft`;
    return `${acres.toFixed(acres < 10 ? 2 : 0)} acres`;
  }
  if (m2 < 10000) return `${Math.round(m2).toLocaleString()} m²`;
  return `${(m2 / 10000).toFixed(2)} ha`;
}

export function AdvocateScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const site = useDesignStore((s) => s.site);
  const placed = useDesignStore((s) => s.placed);
  const structures = useDesignStore((s) => s.structures);
  const boundary = useDesignStore((s) => s.boundary);
  const units = useDesignStore((s) => s.units);
  const pledgedAt = useDesignStore((s) => s.pledgedAt);
  const takePledge = useDesignStore((s) => s.takePledge);
  const clearPledge = useDesignStore((s) => s.clearPledge);
  const invitesSent = useDesignStore((s) => s.invitesSent);
  const recordInvite = useDesignStore((s) => s.recordInvite);

  const [openCase, setOpenCase] = useState<string | null>(CASE_POINTS[0].id);
  const imperial = units === 'imperial';

  const counts = useMemo(() => {
    const species = new Set<string>();
    let trees = 0;
    for (const pp of placed) {
      const p = getPlant(pp.plantId);
      if (!p) continue;
      species.add(p.id);
      if (p.layer === 'canopy' || p.layer === 'understory') trees += 1;
    }
    return { trees, species: species.size };
  }, [placed]);

  const flock = useMemo(() => flockSummary(structures), [structures]);
  const harvestKg = useMemo(() => totalYieldKg(placed), [placed]);
  const savings = useMemo(() => totalDollarsPerYear(placed), [placed]);
  const areaM2 = useMemo(
    () => (boundary.length >= 3 ? polygonAreaM2(boundary) : 0),
    [boundary]
  );

  const ctx: InviteContext = {
    placeLabel: site.label || 'my place',
    trees: counts.trees,
    species: counts.species,
    hens: flock.hens,
    harvest: formatYield(harvestKg, imperial),
    savings: formatMoney(savings),
    area: areaM2 > 0 ? formatArea(areaM2, imperial) : null,
    zone: zoneLabel(site.zone),
    pledged: pledgedAt !== null,
  };

  async function sendInvite(kind: InviteKind) {
    const message = inviteMessage(kind, ctx);
    try {
      const result = await Share.share({ message });
      // Only count invitations that actually left the phone.
      if (result.action === Share.sharedAction) recordInvite();
    } catch {
      // The user backed out of the share sheet — nothing to do.
    }
  }

  function onPledge() {
    if (pledgedAt) {
      Alert.alert(
        'Withdraw your pledge?',
        'You can take it again any time.',
        [
          { text: 'Keep it', style: 'cancel' },
          { text: 'Withdraw', style: 'destructive', onPress: clearPledge },
        ]
      );
      return;
    }
    takePledge();
    Alert.alert(
      '🌿 Pledge taken',
      'No poisons on your ground. Now bring somebody with you — one neighbor, one tree.',
      [{ text: 'Invite someone', onPress: () => sendInvite('neighbor') }, { text: 'Later' }]
    );
  }

  const pledgeDate = pledgedAt
    ? new Date(pledgedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
    >
      {/* ---- Hero ---- */}
      <LinearGradient
        colors={['#1d3a24', '#16281c', colors.bg]}
        style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}
      >
        <Text style={styles.kicker}>ADVOCATE</Text>
        <Text style={styles.heroTitle}>One neighbor, one tree</Text>
        <Text style={styles.heroSub}>
          Local, self-reliant, poison-free food doesn't spread through arguments —
          it spreads through fruit handed over a fence and eggs left on a
          doorstep. Here's the case, and the invitations to send.
        </Text>
      </LinearGradient>

      {/* ---- Your ripple ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>YOUR RIPPLE</Text>
        <View style={styles.tiles}>
          <Tile value={String(counts.trees)} label="fruit & nut trees" />
          <Tile
            value={flock.hens > 0 ? String(flock.hens) : '—'}
            label={
              flock.hens > 0
                ? `hens · ~${flock.eggsPerYear.toLocaleString()} eggs/yr`
                : 'hens — add a coop'
            }
          />
          <Tile
            value={harvestKg > 0 ? `~${formatYield(harvestKg, imperial)}` : '—'}
            label="food a year, unsprayed"
          />
          <Tile
            value={areaM2 > 0 ? formatArea(areaM2, imperial) : '—'}
            label={areaM2 > 0 ? 'ground kept poison-free' : 'draw your boundary'}
          />
          <Tile
            value={savings > 0 ? formatMoney(savings) : '—'}
            label="groceries not bought"
          />
          <Tile
            value={String(invitesSent)}
            label={invitesSent === 1 ? 'invitation sent' : 'invitations sent'}
          />
        </View>
        {counts.trees === 0 && (
          <Pressable
            style={styles.ghostBtn}
            onPress={() => navigation.navigate('Plants')}
          >
            <Text style={styles.ghostBtnText}>
              🌳 Plant your first tree — then you have something to invite people to
            </Text>
          </Pressable>
        )}
      </View>

      {/* ---- The pledge ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>THE PLEDGE</Text>
        <View style={[styles.card, pledgedAt ? styles.cardPledged : null]}>
          <Text style={styles.cardTitle}>
            {pledgedAt ? '🌿 Poison-free since ' + pledgeDate : '🌿 The poison-free pledge'}
          </Text>
          {PLEDGE_LINES.map((l) => (
            <View key={l.id} style={styles.pledgeRow}>
              <Text style={styles.pledgeIcon}>{pledgedAt ? '✓' : l.icon}</Text>
              <Text style={styles.pledgeText}>{l.text}</Text>
            </View>
          ))}
          <Pressable
            style={[styles.primaryBtn, pledgedAt ? styles.secondaryBtn : null]}
            onPress={onPledge}
          >
            <Text
              style={[styles.primaryBtnText, pledgedAt ? styles.secondaryBtnText : null]}
            >
              {pledgedAt ? 'Withdraw my pledge' : 'I take the pledge'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ---- Invitations ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>INVITE SOMEONE</Text>
        <Text style={styles.sectionBlurb}>
          Each one opens a message written with your own numbers in it. Read it,
          change what you like, send it.
        </Text>
        {INVITES.map((inv) => (
          <Pressable
            key={inv.key}
            style={styles.inviteRow}
            onPress={() => sendInvite(inv.key)}
          >
            <Text style={styles.inviteIcon}>{inv.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.inviteLabel}>{inv.label}</Text>
              <Text style={styles.inviteBlurb}>{inv.blurb}</Text>
            </View>
            <Text style={styles.inviteChevron}>📤</Text>
          </Pressable>
        ))}
      </View>

      {/* ---- The case ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>THE CASE</Text>
        <Text style={styles.sectionBlurb}>
          Eight arguments worth having at a fence line. Tap one to read it.
        </Text>
        {CASE_POINTS.map((c) => {
          const open = openCase === c.id;
          return (
            <Pressable
              key={c.id}
              style={[styles.caseRow, open && styles.caseRowOpen]}
              onPress={() => setOpenCase(open ? null : c.id)}
            >
              <View style={styles.caseHead}>
                <Text style={styles.caseIcon}>{c.icon}</Text>
                <Text style={[styles.caseTitle, open && { color: colors.primary }]}>
                  {c.title}
                </Text>
              </View>
              {open && <Text style={styles.caseBody}>{c.body}</Text>}
            </Pressable>
          );
        })}
      </View>

      {/* ---- Do more, locally ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>DO MORE, LOCALLY</Text>
        <Text style={styles.sectionBlurb}>
          Small moves that put trees and hens on other people's land.
        </Text>
        {ACTIONS.map((a) => (
          <View key={a.id} style={styles.actionRow}>
            <Text style={styles.actionIcon}>{a.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>{a.title}</Text>
              <Text style={styles.actionDetail}>{a.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.footnote}>
        Harvest, savings and egg figures are rough estimates at maturity, meant
        for making the case rather than for a farm budget. Your soil, your
        rainfall and your hens will all have opinions of their own.
      </Text>
    </ScrollView>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  kicker: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  heroSub: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },

  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  sectionKicker: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  sectionBlurb: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.md,
  },

  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  tileValue: { color: colors.primary, fontSize: 20, fontWeight: '800' },
  tileLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2, lineHeight: 15 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardPledged: { borderColor: colors.primary },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing.md,
  },

  pledgeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  pledgeIcon: { fontSize: 14, width: 20, color: colors.primary },
  pledgeText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },

  primaryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  secondaryBtn: { backgroundColor: 'transparent' },
  secondaryBtnText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },

  ghostBtn: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  ghostBtnText: { color: colors.primary, fontWeight: '600', fontSize: 13 },

  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  inviteIcon: { fontSize: 22 },
  inviteLabel: { color: colors.text, fontSize: 15, fontWeight: '700' },
  inviteBlurb: { color: colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  inviteChevron: { fontSize: 16 },

  caseRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  caseRowOpen: { borderColor: colors.primaryDark, backgroundColor: colors.surfaceAlt },
  caseHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  caseIcon: { fontSize: 20 },
  caseTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  caseBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },

  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionIcon: { fontSize: 20, width: 26 },
  actionTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  actionDetail: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 3 },

  footnote: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    fontStyle: 'italic',
  },
});
