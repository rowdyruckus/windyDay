import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import MapView, { Marker, Circle, Polygon, Region } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, LAYER_META } from '../theme';
import { useDesignStore } from '../store/useDesignStore';
import { getPlant, PLANTS } from '../data/plants';
import { suitability } from '../data/climate';
import {
  isScreeningPlant,
  pointsAlongPerimeter,
  squareBoundary,
  metersToLatDelta,
  metersToLngDelta,
} from '../data/geo';
import { autoDesign } from '../data/autodesign';
import { estimateZoneFromLatitude } from '../data/climate';
import {
  dayOfYear,
  solarPosition,
  shadowOffsetMeters,
  computeMicroclimate,
  MICRO_META,
  SUN_QUOTE,
  ShadeTree,
} from '../data/sun';
import { TimeSlider } from '../components/TimeSlider';
import { DEMO_SITE } from '../data/demo';
import { STRUCTURE_META, structureRadiusM } from '../data/structures';
import { StructureMarker } from '../components/StructureMarker';
import { StructureType } from '../types';
import { BasemapTiles, BasemapToggle, EsriAttribution } from '../components/Basemap';

export function DesignScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const site = useDesignStore((s) => s.site);
  const placed = useDesignStore((s) => s.placed);
  const movePlant = useDesignStore((s) => s.movePlant);
  const removePlant = useDesignStore((s) => s.removePlant);
  const placePlant = useDesignStore((s) => s.placePlant);
  const placePlants = useDesignStore((s) => s.placePlants);
  const clearPlants = useDesignStore((s) => s.clearPlants);
  const clearDesign = useDesignStore((s) => s.clearDesign);
  const boundary = useDesignStore((s) => s.boundary);
  const setBoundary = useDesignStore((s) => s.setBoundary);
  const moveBoundaryPoint = useDesignStore((s) => s.moveBoundaryPoint);
  const clearBoundary = useDesignStore((s) => s.clearBoundary);
  const region = useDesignStore((s) => s.region);
  const structures = useDesignStore((s) => s.structures);
  const placeStructure = useDesignStore((s) => s.placeStructure);
  const moveStructure = useDesignStore((s) => s.moveStructure);
  const updateStructure = useDesignStore((s) => s.updateStructure);
  const removeStructure = useDesignStore((s) => s.removeStructure);

  const [selected, setSelected] = useState<string | null>(null);
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null);
  const [sunMode, setSunMode] = useState(false);
  const [sunHour, setSunHour] = useState(13);
  const [playing, setPlaying] = useState(false);
  const hasLocation = site.latitude != null && site.longitude != null;

  // Sweep the sun across the day when playing.
  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setSunHour((h) => (h >= 19 ? 6 : Math.round((h + 0.5) * 10) / 10));
    }, 350);
    return () => clearInterval(id);
  }, [playing]);

  // Before the user sets their own site, center on a real example garden.
  const viewLat = site.latitude ?? DEMO_SITE.latitude;
  const viewLng = site.longitude ?? DEMO_SITE.longitude;

  // Track the map center so quick-add drops plants where you're looking.
  const centerRef = useRef({ latitude: viewLat, longitude: viewLng });
  const mapRef = useRef<MapView | null>(null);

  // Rotate the satellite view 90° clockwise (camera heading 270°).
  const applyHeading = () => mapRef.current?.setCamera({ heading: 270 });

  const initialRegion: Region = {
    latitude: viewLat,
    longitude: viewLng,
    latitudeDelta: 0.0018,
    longitudeDelta: 0.0018,
  };

  // Plants suited to the site, for the quick-add tray.
  const suited = useMemo(
    () => PLANTS.filter((p) => suitability(p, site).ok),
    [site]
  );

  // Tall, site-suited species that make good privacy screens, tallest first.
  const screeningOptions = useMemo(
    () =>
      suited
        .filter(isScreeningPlant)
        .sort((a, b) => b.matureHeightM - a.matureHeightM),
    [suited]
  );

  // ---- Sun & shade ----
  const sunLat = site.latitude ?? DEMO_SITE.latitude;
  const doy = useMemo(() => dayOfYear(new Date()), []);
  const sunBoundary = useMemo(
    () =>
      boundary.length >= 3
        ? boundary
        : squareBoundary({ latitude: viewLat, longitude: viewLng }, 36),
    [boundary, viewLat, viewLng]
  );
  const shadeTrees: ShadeTree[] = useMemo(
    () =>
      placed
        .map((pp) => {
          const p = getPlant(pp.plantId);
          if (!p) return null;
          if ((p.layer === 'canopy' || p.layer === 'understory') && p.matureHeightM >= 2) {
            return {
              latitude: pp.latitude,
              longitude: pp.longitude,
              heightM: p.matureHeightM,
              spreadM: p.matureSpreadM,
            };
          }
          return null;
        })
        .filter((t): t is ShadeTree => t !== null),
    [placed]
  );
  const microCells = useMemo(
    () => (sunMode ? computeMicroclimate(sunBoundary, shadeTrees, sunLat, doy) : []),
    [sunMode, sunBoundary, shadeTrees, sunLat, doy]
  );
  const sunPos = solarPosition(sunLat, doy, sunHour);

  // Build a shadow "streak" polygon for a tree at the current time.
  function shadowPolygon(pp: { latitude: number; longitude: number }, heightM: number, spreadM: number) {
    const off = shadowOffsetMeters(sunLat, doy, sunHour, heightM);
    if (!off.valid) return null;
    const len = Math.hypot(off.east, off.north) || 1;
    const ux = off.east / len;
    const uy = off.north / len;
    const r = Math.max(0.6, spreadM / 2);
    const px = -uy * r; // perpendicular * canopy radius
    const py = ux * r;
    const dLat = (mN: number) => metersToLatDelta(mN);
    const dLng = (mE: number) => metersToLngDelta(mE, pp.latitude);
    const base = pp;
    const tip = {
      latitude: pp.latitude + dLat(off.north),
      longitude: pp.longitude + dLng(off.east),
    };
    return [
      { latitude: base.latitude + dLat(py), longitude: base.longitude + dLng(px) },
      { latitude: base.latitude - dLat(py), longitude: base.longitude - dLng(px) },
      { latitude: tip.latitude - dLat(py), longitude: tip.longitude - dLng(px) },
      { latitude: tip.latitude + dLat(py), longitude: tip.longitude + dLng(px) },
    ];
  }

  function formatHour(h: number) {
    const hr = Math.floor(h);
    const min = Math.round((h - hr) * 60);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const h12 = ((hr + 11) % 12) + 1;
    return `${h12}:${min.toString().padStart(2, '0')} ${ampm}`;
  }

  function plantTheShade() {
    if (microCells.length === 0) return;
    const shadePlants = PLANTS.filter(
      (p) =>
        suitability(p, site).ok &&
        (p.sun === 'shade' || p.sun === 'partial') &&
        ['groundcover', 'herbaceous', 'shrub'].includes(p.layer)
    );
    const sunPlants = PLANTS.filter(
      (p) =>
        suitability(p, site).ok &&
        p.sun === 'full' &&
        ['groundcover', 'herbaceous', 'shrub'].includes(p.layer)
    );
    const items: { plantId: string; latitude: number; longitude: number }[] = [];
    let ci = 0;
    let si = 0;
    microCells.forEach((cell, i) => {
      if (i % 2 !== 0) return; // thin out so it isn't wall-to-wall
      if (cell.klass === 'cool' && shadePlants.length) {
        items.push({ plantId: shadePlants[ci++ % shadePlants.length].id, latitude: cell.latitude, longitude: cell.longitude });
      } else if (cell.klass === 'hot' && sunPlants.length) {
        items.push({ plantId: sunPlants[si++ % sunPlants.length].id, latitude: cell.latitude, longitude: cell.longitude });
      }
    });
    if (items.length === 0) return;
    placePlants(items);
    Alert.alert(
      '🌱 Planted to the light',
      `${items.length} plants placed — shade-lovers in the cool blue zones, sun-lovers in the warm ones.`
    );
  }

  function toggleBoundary() {
    if (boundary.length > 0) {
      Alert.alert('Remove property outline?', 'This also lets you re-mark it.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: clearBoundary },
      ]);
      return;
    }
    // First guess: a 40 m square around the map center, reshape by dragging.
    setBoundary(squareBoundary(centerRef.current, 40));
  }

  function hedgePerimeter() {
    if (boundary.length < 3) {
      Alert.alert('Mark your property first', 'Tap "Property" to outline the boundary, then line it with a hedge.');
      return;
    }
    if (screeningOptions.length === 0) {
      Alert.alert('No screening species', 'No tall privacy plants suit your current site conditions.');
      return;
    }
    const choose = (plantId: string) => {
      const plant = getPlant(plantId)!;
      const spacing = Math.max(1.5, plant.matureSpreadM * 0.85);
      const spots = pointsAlongPerimeter(boundary, spacing);
      spots.forEach((s) => placePlant(plantId, s.latitude, s.longitude));
      Alert.alert('Privacy hedge planted', `${spots.length} ${plant.common} lined around your perimeter.`);
    };
    Alert.alert(
      'Line the perimeter',
      'Choose a screening species for privacy and enclosure:',
      [
        ...screeningOptions.slice(0, 3).map((p) => ({
          text: `${p.icon} ${p.common} (${p.matureHeightM} m)`,
          onPress: () => choose(p.id),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  }

  const selectedPlaced = placed.find((p) => p.instanceId === selected);
  const selectedPlant = selectedPlaced ? getPlant(selectedPlaced.plantId) : null;
  const selectedStruct = structures.find((s) => s.instanceId === selectedStructure);

  function quickAdd(plantId: string) {
    placePlant(plantId, centerRef.current.latitude, centerRef.current.longitude);
  }

  function autoBuild() {
    const c = centerRef.current;
    const poly = boundary.length >= 3 ? boundary : squareBoundary(c, 36);

    // Never block: assume a hardiness zone from region data, then a latitude
    // estimate, then a sensible default. Sun already defaults to full sun.
    const guessedZone =
      site.zone ??
      region?.zone ??
      (site.latitude != null ? estimateZoneFromLatitude(site.latitude) : DEMO_SITE.zone);
    const effectiveSite = { ...site, zone: guessedZone };

    const points = autoDesign(poly, effectiveSite);
    if (points.length === 0) return;

    const apply = () => {
      if (boundary.length < 3) setBoundary(poly);
      clearPlants();
      placePlants(points);
      setSelected(null);
      Alert.alert(
        '🌱 Paradise designed',
        `${points.length} plants placed — a privacy & windbreak hedge around the edge, and balanced guilds inside. Drag anything to fine-tune.`
      );
    };
    if (placed.length > 0) {
      Alert.alert(
        'Design my paradise',
        `Replace your ${placed.length} current plantings with an auto-designed forest of ${points.length} (windbreak hedge + interior guilds)?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', style: 'destructive', onPress: apply },
        ]
      );
    } else {
      apply();
    }
  }

  function build() {
    const c = centerRef.current;
    const add = (type: StructureType) => placeStructure(type, c.latitude, c.longitude);
    Alert.alert('Add to your paradise', 'Placed at the center of the map:', [
      { text: '🐔 Chicken coop', onPress: () => add('coop') },
      { text: '🐝 Beehive', onPress: () => add('beehive') },
      { text: '💧 Pond', onPress: () => add('pond') },
      { text: '🛢️ Rain barrel', onPress: () => add('rainbarrel') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function clearSelection() {
    setSelected(null);
    setSelectedStructure(null);
  }

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        mapType="satellite"
        initialRegion={initialRegion}
        onMapReady={applyHeading}
        onPress={clearSelection}
        onRegionChangeComplete={(r) => {
          centerRef.current = { latitude: r.latitude, longitude: r.longitude };
        }}
      >
        <BasemapTiles />

        {/* Microclimate cells (cool/moist vs hot/dry) */}
        {sunMode &&
          microCells
            .filter((c) => c.klass !== 'mod')
            .map((c, i) => (
              <Circle
                key={`mc-${i}`}
                center={{ latitude: c.latitude, longitude: c.longitude }}
                radius={2.4}
                strokeWidth={0}
                fillColor={`${MICRO_META[c.klass].color}44`}
              />
            ))}

        {/* Moving tree shadows */}
        {sunMode &&
          shadeTrees.map((t, i) => {
            const poly = shadowPolygon(t, t.heightM, t.spreadM);
            return poly ? (
              <Polygon
                key={`sh-${i}`}
                coordinates={poly}
                strokeWidth={0}
                fillColor="rgba(18,20,40,0.28)"
              />
            ) : null;
          })}

        {/* Inferred property outline for privacy planting */}
        {boundary.length >= 3 && (
          <Polygon
            coordinates={boundary}
            strokeColor={colors.accent}
            strokeWidth={2}
            fillColor="rgba(224,169,74,0.08)"
          />
        )}
        {boundary.map((pt, i) => (
          <Marker
            key={`b-${i}`}
            coordinate={pt}
            draggable
            onDragEnd={(e) => moveBoundaryPoint(i, e.nativeEvent.coordinate)}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.corner} />
          </Marker>
        ))}

        {/* Structures (coop, beehive, pond, rain barrel) with benefit zones */}
        {structures.map((st) => {
          const meta = STRUCTURE_META[st.type];
          const isSel = st.instanceId === selectedStructure;
          const r = structureRadiusM(st.type, st.flockSize, st.radiusM);
          return (
            <React.Fragment key={st.instanceId}>
              {r != null && (
                <Circle
                  center={{ latitude: st.latitude, longitude: st.longitude }}
                  radius={r}
                  strokeColor={meta.color}
                  strokeWidth={isSel ? 3 : 1.5}
                  fillColor={`${meta.color}33`}
                />
              )}
              <Marker
                coordinate={{ latitude: st.latitude, longitude: st.longitude }}
                draggable
                onDragEnd={(e) =>
                  moveStructure(
                    st.instanceId,
                    e.nativeEvent.coordinate.latitude,
                    e.nativeEvent.coordinate.longitude
                  )
                }
                onPress={() => {
                  setSelected(null);
                  setSelectedStructure(st.instanceId);
                }}
                anchor={{ x: 0.5, y: st.type === 'pond' ? 0.5 : 1 }}
                tracksViewChanges={false}
              >
                <StructureMarker type={st.type} size={0.85} selected={isSel} />
              </Marker>
            </React.Fragment>
          );
        })}

        {placed.map((pp) => {
          const plant = getPlant(pp.plantId);
          if (!plant) return null;
          const layer = LAYER_META[plant.layer];
          const isSel = pp.instanceId === selected;
          return (
            <React.Fragment key={pp.instanceId}>
              {/* Mature canopy/spread footprint, true-to-scale in metres */}
              <Circle
                center={{ latitude: pp.latitude, longitude: pp.longitude }}
                radius={Math.max(0.5, plant.matureSpreadM / 2)}
                strokeColor={layer.color}
                strokeWidth={isSel ? 3 : 1.5}
                fillColor={`${layer.color}44`}
              />
              <Marker
                coordinate={{ latitude: pp.latitude, longitude: pp.longitude }}
                draggable
                onDragEnd={(e) =>
                  movePlant(
                    pp.instanceId,
                    e.nativeEvent.coordinate.latitude,
                    e.nativeEvent.coordinate.longitude
                  )
                }
                onPress={() => {
                  setSelectedStructure(null);
                  setSelected(pp.instanceId);
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <View style={[styles.markerBubble, isSel && styles.markerBubbleSel]}>
                  <Text style={styles.markerIcon}>{plant.icon}</Text>
                </View>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapView>

      {/* Top summary */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>{hasLocation ? site.label : DEMO_SITE.label}</Text>
          <Text style={styles.topSub}>
            {hasLocation
              ? `${placed.length} planting${placed.length === 1 ? '' : 's'}${
                  structures.length > 0
                    ? ` · ${structures.length} structure${structures.length === 1 ? '' : 's'}`
                    : ''
                } · plant, 🏗️ build, or ☀️ study the sun`
              : 'Example garden — explore, then add your own land'}
          </Text>
        </View>
        {(placed.length > 0 || structures.length > 0) && (
          <Pressable
            onPress={() =>
              Alert.alert('Clear design?', 'Remove all plantings and structures from the map.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: () => {
                    clearDesign();
                    clearSelection();
                  },
                },
              ])
            }
          >
            <Text style={styles.clear}>Clear</Text>
          </Pressable>
        )}
      </View>

      {/* Boundary / privacy controls */}
      <View style={[styles.controls, { top: insets.top + 64 }]}>
        <Pressable style={[styles.ctrlBtn, styles.ctrlBtnPrimary]} onPress={autoBuild}>
          <Text style={styles.ctrlIcon}>✨</Text>
          <Text style={[styles.ctrlText, { color: '#0f1a12' }]}>Auto</Text>
        </Pressable>
        <Pressable
          style={[styles.ctrlBtn, boundary.length > 0 && styles.ctrlBtnActive]}
          onPress={toggleBoundary}
        >
          <Text style={styles.ctrlIcon}>🏠</Text>
          <Text style={styles.ctrlText}>{boundary.length > 0 ? 'Clear edge' : 'Property'}</Text>
        </Pressable>
        <Pressable
          style={[styles.ctrlBtn, boundary.length < 3 && styles.ctrlBtnDisabled]}
          onPress={hedgePerimeter}
        >
          <Text style={styles.ctrlIcon}>🌳</Text>
          <Text style={styles.ctrlText}>Hedge</Text>
        </Pressable>
        <Pressable style={styles.ctrlBtn} onPress={build}>
          <Text style={styles.ctrlIcon}>🏗️</Text>
          <Text style={styles.ctrlText}>Build</Text>
        </Pressable>
        <Pressable
          style={[styles.ctrlBtn, sunMode && styles.ctrlBtnActive]}
          onPress={() => {
            setSunMode((m) => !m);
            setPlaying(false);
          }}
        >
          <Text style={styles.ctrlIcon}>☀️</Text>
          <Text style={styles.ctrlText}>Sun</Text>
        </Pressable>
        <BasemapToggle style={{ width: 72 }} />
      </View>

      <EsriAttribution style={{ bottom: insets.bottom + 96 }} />

      {/* Center crosshair to show where quick-add will drop */}
      <View pointerEvents="none" style={styles.crosshair}>
        <View style={styles.crossV} />
        <View style={styles.crossH} />
      </View>

      {/* Selected plant card */}
      {selectedPlaced && selectedPlant && (
        <View style={[styles.selCard, { bottom: insets.bottom + 96 }]}>
          <Text style={styles.selIcon}>{selectedPlant.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.selName}>{selectedPlant.common}</Text>
            <Text style={styles.selSub}>
              {LAYER_META[selectedPlant.layer].label} · {selectedPlant.matureSpreadM} m wide
            </Text>
          </View>
          <Pressable
            style={styles.removeBtn}
            onPress={() => {
              removePlant(selectedPlaced.instanceId);
              setSelected(null);
            }}
          >
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        </View>
      )}

      {/* Selected structure card */}
      {selectedStruct && (() => {
        const meta = STRUCTURE_META[selectedStruct.type];
        const isCoop = selectedStruct.type === 'coop';
        const sizable = selectedStruct.type === 'pond' || selectedStruct.type === 'beehive';
        return (
          <View style={[styles.coopCard, { bottom: insets.bottom + 96 }]}>
            <View style={styles.coopHead}>
              <StructureMarker type={selectedStruct.type} size={0.8} />
              <View style={{ flex: 1, marginLeft: spacing.lg }}>
                <Text style={styles.selName}>{meta.label}</Text>
                <Text style={styles.selSub}>{meta.blurb}</Text>
              </View>
              <Pressable
                style={styles.removeBtn}
                onPress={() => {
                  removeStructure(selectedStruct.instanceId);
                  setSelectedStructure(null);
                }}
              >
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>

            {isCoop && (
              <Stepper
                label="Flock size"
                value={`${selectedStruct.flockSize ?? 4} 🐔`}
                onDec={() =>
                  updateStructure(selectedStruct.instanceId, {
                    flockSize: Math.max(meta.minFlock ?? 2, (selectedStruct.flockSize ?? 4) - 1),
                  })
                }
                onInc={() =>
                  updateStructure(selectedStruct.instanceId, {
                    flockSize: Math.min(meta.maxFlock ?? 20, (selectedStruct.flockSize ?? 4) + 1),
                  })
                }
              />
            )}
            {sizable && (
              <Stepper
                label={selectedStruct.type === 'pond' ? 'Pond radius' : 'Forage radius'}
                value={`${Math.round(selectedStruct.radiusM ?? meta.defaultRadiusM ?? 4)} m`}
                onDec={() =>
                  updateStructure(selectedStruct.instanceId, {
                    radiusM: Math.max(meta.minRadiusM ?? 1, (selectedStruct.radiusM ?? meta.defaultRadiusM ?? 4) - 1),
                  })
                }
                onInc={() =>
                  updateStructure(selectedStruct.instanceId, {
                    radiusM: Math.min(meta.maxRadiusM ?? 40, (selectedStruct.radiusM ?? meta.defaultRadiusM ?? 4) + 1),
                  })
                }
              />
            )}

            <View style={styles.benefitRow}>
              {meta.benefits.map((b) => (
                <Text key={b} style={styles.benefit}>
                  {b}
                </Text>
              ))}
            </View>
          </View>
        );
      })()}

      {/* Example-garden banner before the user sets their own land */}
      {!hasLocation && !sunMode && (
        <View style={[styles.demoBanner, { bottom: insets.bottom + 96 }]}>
          <Text style={styles.demoText}>
            🌱 You're exploring the {DEMO_SITE.label}. Try ✨ Auto here, or switch to your own land.
          </Text>
          <Pressable style={styles.demoBtn} onPress={() => navigation.navigate('Site')}>
            <Text style={styles.demoBtnText}>📍 Use my land</Text>
          </Pressable>
        </View>
      )}

      {/* Quick-add tray (hidden in Sun mode) */}
      {!sunMode && (
        <View style={[styles.tray, { paddingBottom: insets.bottom + spacing.sm }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trayRow}>
            {suited.map((p) => (
              <Pressable key={p.id} style={styles.trayItem} onPress={() => quickAdd(p.id)}>
                <Text style={styles.trayIcon}>{p.icon}</Text>
                <Text style={styles.trayName} numberOfLines={1}>
                  {p.common}
                </Text>
              </Pressable>
            ))}
            <Pressable style={styles.trayMore} onPress={() => navigation.navigate('Plants')}>
              <Text style={styles.trayMoreIcon}>＋</Text>
              <Text style={styles.trayName}>Browse</Text>
            </Pressable>
          </ScrollView>
        </View>
      )}

      {/* Sun & shade panel */}
      {sunMode && (
        <View style={[styles.sunPanel, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.sunRow}>
            <Pressable onPress={() => setPlaying((p) => !p)} style={styles.playBtn}>
              <Text style={styles.playIcon}>{playing ? '⏸' : '▶︎'}</Text>
            </Pressable>
            <Text style={styles.sunTime}>
              ☀️ {formatHour(sunHour)} · {Math.max(0, Math.round(sunPos.altitude))}° high
            </Text>
            <Pressable
              onPress={() => {
                setSunMode(false);
                setPlaying(false);
              }}
            >
              <Text style={styles.sunClose}>Done</Text>
            </Pressable>
          </View>

          <TimeSlider min={5} max={20} value={sunHour} onChange={setSunHour} />

          <View style={styles.sunLegend}>
            {(['cool', 'mod', 'hot'] as const).map((k) => (
              <View key={k} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: MICRO_META[k].color }]} />
                <Text style={styles.legendText}>{MICRO_META[k].label}</Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.shadeBtn} onPress={plantTheShade}>
            <Text style={styles.shadeBtnText}>🌱 Plant to the light</Text>
          </Pressable>

          <Text style={styles.quote}>"{SUN_QUOTE.text}"</Text>
          <Text style={styles.quoteAuthor}>— {SUN_QUOTE.author}</Text>
          <Text style={styles.sunTip}>
            In hot summers, afternoon shade cuts heat stress and bolting for leafy
            greens — site the veggie beds where trees shade them after midday.
          </Text>
        </View>
      )}
    </View>
  );
}

function Stepper({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string;
  value: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <View style={styles.flockRow}>
      <Text style={styles.flockLabel}>{label}</Text>
      <View style={styles.stepperMini}>
        <Pressable style={styles.miniBtn} onPress={onDec}>
          <Text style={styles.miniBtnText}>−</Text>
        </Pressable>
        <Text style={styles.flockValue}>{value}</Text>
        <Pressable style={styles.miniBtn} onPress={onInc}>
          <Text style={styles.miniBtnText}>＋</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(15,26,18,0.6)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  topTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  topSub: { color: '#dfeee0', fontSize: 12, marginTop: 2 },
  clear: { color: colors.danger, fontWeight: '700' },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 24,
    height: 24,
    marginLeft: -12,
    marginTop: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossV: { position: 'absolute', width: 2, height: 24, backgroundColor: 'rgba(255,255,255,0.8)' },
  crossH: { position: 'absolute', width: 24, height: 2, backgroundColor: 'rgba(255,255,255,0.8)' },
  markerBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(15,26,18,0.5)',
  },
  markerBubbleSel: { borderColor: colors.accent, borderWidth: 3 },
  markerIcon: { fontSize: 18 },
  corner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: '#fff',
  },
  controls: {
    position: 'absolute',
    right: spacing.md,
    gap: spacing.sm,
  },
  ctrlBtn: {
    backgroundColor: 'rgba(15,26,18,0.8)',
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    width: 72,
  },
  ctrlBtnActive: { borderColor: colors.accent },
  ctrlBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  ctrlBtnDisabled: { opacity: 0.45 },
  ctrlIcon: { fontSize: 20 },
  ctrlText: { color: '#fff', fontSize: 11, fontWeight: '700', marginTop: 2 },
  selCard: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selIcon: { fontSize: 28, marginRight: spacing.md },
  selName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  selSub: { color: colors.textMuted, fontSize: 12 },
  removeBtn: {
    backgroundColor: 'rgba(217,112,91,0.2)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  removeText: { color: colors.danger, fontWeight: '700' },
  coopCard: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  coopHead: { flexDirection: 'row', alignItems: 'center' },
  flockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  flockLabel: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  stepperMini: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  miniBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBtnText: { color: colors.text, fontSize: 22, fontWeight: '700' },
  flockValue: { color: colors.text, fontSize: 16, fontWeight: '700', minWidth: 56, textAlign: 'center' },
  benefitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  benefit: {
    color: colors.text,
    fontSize: 12,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  tray: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.sm,
    backgroundColor: 'rgba(15,26,18,0.85)',
  },
  trayRow: { paddingHorizontal: spacing.md, gap: spacing.sm },
  trayItem: {
    width: 72,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trayIcon: { fontSize: 24 },
  trayName: { color: colors.text, fontSize: 11, marginTop: 2, maxWidth: 64, textAlign: 'center' },
  trayMore: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  trayMoreIcon: { fontSize: 22, color: colors.primary, fontWeight: '800' },
  sunPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(15,26,18,0.94)',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  sunRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { fontSize: 18, color: '#0f1a12' },
  sunTime: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'center' },
  sunClose: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  sunLegend: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendText: { color: '#dfeee0', fontSize: 12 },
  shadeBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  shadeBtnText: { color: '#0f1a12', fontWeight: '800', fontSize: 15 },
  quote: { color: '#eef4ee', fontStyle: 'italic', fontSize: 12, marginTop: spacing.md, lineHeight: 17 },
  quoteAuthor: { color: colors.textMuted, fontSize: 11, marginTop: 2, textAlign: 'right' },
  sunTip: { color: colors.textMuted, fontSize: 11, marginTop: spacing.sm, lineHeight: 16 },
  demoBanner: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(15,26,18,0.92)',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  demoText: { color: '#eef4ee', fontSize: 13, flex: 1, lineHeight: 18 },
  demoBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  demoBtnText: { color: '#0f1a12', fontWeight: '800', fontSize: 13 },
  empty: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: spacing.sm },
  emptyBody: { color: colors.textMuted, textAlign: 'center', lineHeight: 21, marginBottom: spacing.lg },
  emptyBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: radius.md },
  emptyBtnText: { color: '#0f1a12', fontWeight: '800' },
});
