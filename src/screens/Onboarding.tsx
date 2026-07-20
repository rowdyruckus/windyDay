import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import { GOALS, Goal } from '../data/goals';
import { useDesignStore } from '../store/useDesignStore';
import { VideoBackground } from '../components/VideoBackground';
import { BROLL_SOURCES } from '../video/broll';

// The story we tell before asking for anything — sell the dream first.
interface Slide {
  tag?: string;
  icon: string;
  title: string;
  body: string;
  // Bottom colour wash so the orchard video shows through the top.
  wash: [string, string];
}

const SLIDES: Slide[] = [
  {
    tag: 'WELCOME TO',
    icon: '🌱',
    title: "Let's Plant Paradise",
    body: 'Turn your yard into a thriving food forest — beautiful, abundant and alive.',
    wash: ['rgba(255,178,122,0.25)', 'rgba(15,26,18,0.92)'],
  },
  {
    icon: '🌅',
    title: 'Wake to abundance',
    body: 'Open the app to your own land glowing at dawn — trees heavy with fruit, bees at the blossom, a soft morning of harvest.',
    wash: ['rgba(255,196,120,0.22)', 'rgba(15,26,18,0.92)'],
  },
  {
    icon: '🛰️',
    title: 'Design on your real land',
    body: 'We pull up a satellite view of your home and suggest fruit trees, berries, herbs and ground covers tuned to your climate.',
    wash: ['rgba(74,163,217,0.18)', 'rgba(15,26,18,0.93)'],
  },
  {
    icon: '⏳',
    title: 'Watch it grow',
    body: 'Slide through the years and see your forest fill in — from canopy to ground cover, season by season.',
    wash: ['rgba(91,191,106,0.18)', 'rgba(15,26,18,0.93)'],
  },
  {
    icon: '🐝',
    title: 'A living system',
    body: 'Feed pollinators, grow food and medicine, save at the grocery store and lock up carbon — all from one design.',
    wash: ['rgba(224,169,74,0.2)', 'rgba(15,26,18,0.93)'],
  },
];

export function Onboarding() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const complete = useDesignStore((s) => s.completeOnboarding);
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Goal[]>([]);

  const lastIndex = SLIDES.length; // the extra, final page is the goals picker
  const onGoals = index === lastIndex;

  const toggle = (g: Goal) =>
    setSelected((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));

  const goTo = (i: number) =>
    scroller.current?.scrollTo({ x: i * width, animated: true });

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  return (
    <View style={styles.root}>
      {/* A soft, slow orchard backdrop drifting behind every slide */}
      {BROLL_SOURCES.length > 0 && (
        <VideoBackground sources={BROLL_SOURCES} style={StyleSheet.absoluteFill} intervalMs={6000} />
      )}

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={{ width }}>
            <LinearGradient colors={s.wash} locations={[0, 0.85]} style={StyleSheet.absoluteFill} />
            <View style={[styles.slide, { paddingTop: insets.top + spacing.xl }]}>
              <View style={{ flex: 1 }} />
              <Text style={styles.icon}>{s.icon}</Text>
              {s.tag && <Text style={styles.tag}>{s.tag}</Text>}
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.body}>{s.body}</Text>
              <View style={{ height: spacing.xl * 3 }} />
            </View>
          </View>
        ))}

        {/* Final page: the goals picker */}
        <View style={{ width }}>
          <LinearGradient
            colors={['rgba(255,178,122,0.22)', 'rgba(15,26,18,0.95)']}
            locations={[0, 0.7]}
            style={StyleSheet.absoluteFill}
          />
          <ScrollView
            contentContainerStyle={[
              styles.goalsPage,
              { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + 140 },
            ]}
          >
            <Text style={styles.icon}>🌈</Text>
            <Text style={styles.title}>What do you dream of growing?</Text>
            <Text style={styles.body}>
              Pick what matters to you — we'll tailor your plant suggestions. You can
              change this anytime.
            </Text>
            <View style={styles.goals}>
              {GOALS.map((g) => {
                const on = selected.includes(g.key);
                return (
                  <Pressable
                    key={g.key}
                    onPress={() => toggle(g.key)}
                    style={[styles.goal, on && styles.goalOn]}
                  >
                    <Text style={styles.goalIcon}>{g.icon}</Text>
                    <Text style={[styles.goalLabel, on && styles.goalLabelOn]}>{g.label}</Text>
                    <Text style={styles.goalBlurb}>{g.blurb}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Skip (hidden on the goals page, where the CTA takes over) */}
      {!onGoals && (
        <Pressable
          onPress={() => complete([])}
          style={[styles.skip, { top: insets.top + spacing.sm }]}
          hitSlop={10}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}

      {/* Bottom controls: page dots + primary action */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {Array.from({ length: lastIndex + 1 }).map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
        <Pressable
          style={styles.cta}
          onPress={() => (onGoals ? complete(selected) : goTo(index + 1))}
        >
          <Text style={styles.ctaText}>
            {onGoals ? 'Enter my paradise →' : 'Next →'}
          </Text>
        </Pressable>
        {!onGoals && (
          <Pressable onPress={() => goTo(lastIndex)} hitSlop={8}>
            <Text style={styles.jump}>Skip the tour</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f1a12' },
  slide: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'flex-end' },
  icon: { fontSize: 56, marginBottom: spacing.md },
  tag: { color: '#ffe9c7', fontSize: 13, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', lineHeight: 38 },
  body: {
    color: '#e8f2e6',
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.md,
    maxWidth: 460,
  },
  goalsPage: { paddingHorizontal: spacing.lg, flexGrow: 1, justifyContent: 'flex-end' },
  goals: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  goal: {
    width: '48%',
    backgroundColor: 'rgba(15,26,18,0.55)',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: spacing.md,
  },
  goalOn: { borderColor: colors.primary, backgroundColor: 'rgba(15,26,18,0.85)' },
  goalIcon: { fontSize: 24 },
  goalLabel: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 4 },
  goalLabelOn: { color: colors.primary },
  goalBlurb: { color: '#dfeee0', fontSize: 12, marginTop: 2 },
  skip: {
    position: 'absolute',
    right: spacing.lg,
    backgroundColor: 'rgba(15,26,18,0.5)',
    borderRadius: radius.lg,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  skipText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  dots: { flexDirection: 'row', gap: 7, marginBottom: spacing.md },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotOn: { backgroundColor: colors.primary, width: 20 },
  cta: {
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaText: { color: '#0f1a12', fontWeight: '800', fontSize: 16 },
  jump: { color: '#eef4ee', fontSize: 13, marginTop: spacing.md, opacity: 0.85 },
});
