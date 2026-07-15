import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme';
import { useDesignStore } from '../store/useDesignStore';
import { estimateZoneFromLatitude, zoneLabel } from '../data/climate';
import { SunNeed } from '../types';
import { Card, SectionTitle } from '../components/ui';
import { BasemapTiles, BasemapToggle, EsriAttribution } from '../components/Basemap';
import { MapZoomControls } from '../components/MapZoomControls';

const SUN_OPTIONS: { value: SunNeed; label: string; icon: string }[] = [
  { value: 'full', label: 'Full sun', icon: '☀️' },
  { value: 'partial', label: 'Partial', icon: '⛅' },
  { value: 'shade', label: 'Shade', icon: '🌳' },
];

export function SiteScreen() {
  const insets = useSafeAreaInsets();
  const site = useDesignStore((s) => s.site);
  const setLocation = useDesignStore((s) => s.setLocation);
  const setZone = useDesignStore((s) => s.setZone);
  const setSun = useDesignStore((s) => s.setSun);
  const setLabel = useDesignStore((s) => s.setLabel);
  const clearSite = useDesignStore((s) => s.clearSite);
  const resolveRegion = useDesignStore((s) => s.resolveRegion);
  const regionInfo = useDesignStore((s) => s.region);
  const regionStatus = useDesignStore((s) => s.regionStatus);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  const mapReady = useRef(false);

  const hasLocation = site.latitude != null && site.longitude != null;

  // Cinematic slow pan + zoom-in to the place (rotated 90° clockwise).
  const flyIn = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const lat = site.latitude ?? 39.5;
    const lng = site.longitude ?? -98.35;
    map.setCamera({
      center: { latitude: lat + 0.008, longitude: lng - 0.008 },
      heading: 270,
      pitch: 0,
      zoom: 9,
      altitude: 14000,
    });
    setTimeout(() => {
      map.animateCamera(
        { center: { latitude: lat, longitude: lng }, heading: 270, pitch: 0, zoom: 15, altitude: 2600 },
        { duration: 6200 }
      );
    }, 90);
  }, [site.latitude, site.longitude]);

  const onMapReady = () => {
    mapReady.current = true;
    flyIn();
  };

  // Re-run the reveal each time the Site tab regains focus (after first load).
  useFocusEffect(
    useCallback(() => {
      if (mapReady.current) {
        const t = setTimeout(flyIn, 120);
        return () => clearTimeout(t);
      }
    }, [flyIn])
  );

  // Resolve region intelligence when we have (or gain) a location.
  useEffect(() => {
    if (site.latitude != null && site.longitude != null) {
      resolveRegion(site.latitude, site.longitude);
    }
  }, [site.latitude, site.longitude, resolveRegion]);

  // Fly in again whenever the location changes (e.g. after "Use my location").
  useEffect(() => {
    if (!mapReady.current) return;
    const t = setTimeout(flyIn, 400);
    return () => clearTimeout(t);
  }, [site.latitude, site.longitude, flyIn]);

  async function locate() {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location needed',
          'Allow location access to center the map on your land, or drop a pin manually on the map.'
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const zone = estimateZoneFromLatitude(pos.coords.latitude);
      setLocation(pos.coords.latitude, pos.coords.longitude, zone);
    } catch (e) {
      Alert.alert('Could not get location', 'Please try again or set a pin on the map.');
    } finally {
      setLoading(false);
    }
  }

  // Memoized so unrelated re-renders don't re-assert the region and interrupt
  // the fly-in animation.
  const region = useMemo(
    () =>
      hasLocation
        ? {
            latitude: site.latitude as number,
            longitude: site.longitude as number,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }
        : { latitude: 39.5, longitude: -98.35, latitudeDelta: 40, longitudeDelta: 40 },
    [hasLocation, site.latitude, site.longitude]
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.md }}
    >
      <Text style={styles.h1}>Your Site</Text>
      <Text style={styles.sub}>
        Find your land from above and set your growing conditions. Everything
        we suggest is tuned to this.
      </Text>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          mapType="satellite"
          region={region}
          onMapReady={onMapReady}
          onPress={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setLocation(latitude, longitude, estimateZoneFromLatitude(latitude));
          }}
        >
          <BasemapTiles />
          {hasLocation && (
            <Marker
              draggable
              coordinate={{
                latitude: site.latitude as number,
                longitude: site.longitude as number,
              }}
              onDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setLocation(latitude, longitude, estimateZoneFromLatitude(latitude));
              }}
              title={site.label}
            />
          )}
        </MapView>
        {!hasLocation && (
          <View style={styles.mapHint} pointerEvents="none">
            <Text style={styles.mapHintText}>
              Tap the map to drop a pin, or use your location below
            </Text>
          </View>
        )}
        <BasemapToggle style={styles.mapToggle} />
        <MapZoomControls mapRef={mapRef} style={styles.mapZoom} />
        <EsriAttribution />
      </View>

      <Pressable style={styles.locateBtn} onPress={locate} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#0f1a12" />
        ) : (
          <Text style={styles.locateText}>
            {hasLocation ? '📍 Update to my location' : '📍 Use my location'}
          </Text>
        )}
      </Pressable>

      {hasLocation && (
        <Pressable
          style={styles.resetBtn}
          onPress={() =>
            Alert.alert(
              'Reset my land?',
              'Clears your saved location so the example garden shows again. Your plantings stay in your design.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: clearSite },
              ]
            )
          }
        >
          <Text style={styles.resetText}>↺ Reset my land (show example garden)</Text>
        </Pressable>
      )}

      {hasLocation && (
        <Card style={{ marginTop: spacing.lg }}>
          <View style={styles.regionHead}>
            <SectionTitle style={{ marginBottom: 0 }}>Your region</SectionTitle>
            {regionStatus === 'loading' && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>

          {regionInfo?.koppen ? (
            <>
              <Text style={styles.biome}>
                🌍 {regionInfo.koppen.label}
                <Text style={styles.koppenCode}> · {regionInfo.koppen.code}</Text>
              </Text>
              <Text style={styles.biomeBlurb}>{regionInfo.koppen.blurb}</Text>
            </>
          ) : regionStatus === 'loading' ? (
            <Text style={styles.cardHint}>Reading your local climate…</Text>
          ) : (
            <Text style={styles.cardHint}>
              Couldn't reach climate data — using a latitude estimate. Pull to
              refresh when you're back online.
            </Text>
          )}

          {regionInfo && (
            <View style={styles.regionStats}>
              {regionInfo.annualMinTempC != null && (
                <Stat
                  label="Coldest low"
                  value={`${Math.round(regionInfo.annualMinTempC)}°C`}
                />
              )}
              {regionInfo.growingSeasonDays != null && (
                <Stat
                  label="Frost-free"
                  value={`${regionInfo.growingSeasonDays} days`}
                />
              )}
              {regionInfo.annualPrecipMm != null && (
                <Stat label="Rainfall" value={`${regionInfo.annualPrecipMm} mm`} />
              )}
              <Stat
                label="Zone source"
                value={
                  regionInfo.zoneSource === 'phzmapi'
                    ? 'USDA'
                    : regionInfo.zoneSource === 'open-meteo'
                    ? 'Climate'
                    : 'Latitude'
                }
              />
            </View>
          )}

          {regionInfo && regionInfo.sources.length > 0 && (
            <Text style={styles.sources}>
              Sources: {regionInfo.sources.join(' · ')}
            </Text>
          )}
        </Card>
      )}

      <Card style={{ marginTop: spacing.md }}>
        <SectionTitle>Site name</SectionTitle>
        <TextInput
          style={styles.input}
          value={site.label}
          onChangeText={setLabel}
          placeholder="My Paradise"
          placeholderTextColor={colors.textMuted}
        />
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <SectionTitle>Hardiness zone</SectionTitle>
        <Text style={styles.cardHint}>
          {site.zoneSource === 'auto'
            ? 'Estimated from your latitude — adjust if you know yours.'
            : site.zoneSource === 'manual'
            ? 'Set manually.'
            : 'Set your location or adjust below.'}
        </Text>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => setZone(Math.max(1, (site.zone ?? 7) - 1))}
          >
            <Text style={styles.stepBtnText}>−</Text>
          </Pressable>
          <Text style={styles.zoneValue}>{zoneLabel(site.zone)}</Text>
          <Pressable
            style={styles.stepBtn}
            onPress={() => setZone(Math.min(13, (site.zone ?? 7) + 1))}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </Pressable>
        </View>
      </Card>

      <Card style={{ marginTop: spacing.md, marginBottom: spacing.xl }}>
        <SectionTitle>Sunlight</SectionTitle>
        <Text style={styles.cardHint}>How much sun does this spot get?</Text>
        <View style={styles.sunRow}>
          {SUN_OPTIONS.map((opt) => {
            const active = site.sun === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.sunOpt, active && styles.sunOptActive]}
                onPress={() => setSun(opt.value)}
              >
                <Text style={styles.sunIcon}>{opt.icon}</Text>
                <Text style={[styles.sunLabel, active && styles.sunLabelActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  regionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  biome: { color: colors.text, fontSize: 17, fontWeight: '700' },
  koppenCode: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  biomeBlurb: { color: colors.textMuted, fontSize: 13, marginTop: 2, lineHeight: 19 },
  regionStats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  statValue: { color: colors.text, fontSize: 15, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  sources: { color: colors.textMuted, fontSize: 11, marginTop: spacing.md, fontStyle: 'italic' },
  h1: { color: colors.text, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 14, marginTop: 4, marginBottom: spacing.lg, lineHeight: 20 },
  mapWrap: {
    height: 260,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapHint: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(15,26,18,0.7)',
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  mapHintText: { color: '#fff', textAlign: 'center', fontSize: 13 },
  mapToggle: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  mapZoom: { position: 'absolute', bottom: spacing.sm, right: spacing.sm },
  locateBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  locateText: { color: '#0f1a12', fontWeight: '800', fontSize: 15 },
  resetBtn: { paddingVertical: spacing.md, alignItems: 'center' },
  resetText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  cardHint: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { color: colors.text, fontSize: 26, fontWeight: '700' },
  zoneValue: { color: colors.text, fontSize: 20, fontWeight: '700' },
  sunRow: { flexDirection: 'row', gap: spacing.sm },
  sunOpt: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sunOptActive: { borderColor: colors.primary },
  sunIcon: { fontSize: 24 },
  sunLabel: { color: colors.textMuted, fontSize: 13, marginTop: 4, fontWeight: '600' },
  sunLabelActive: { color: colors.text },
});
