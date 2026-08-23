# 🌄 Let's Plant Paradise

An iPhone app for designing your own food forest — a permaculture garden layered
from canopy fruit trees down to ground covers and roots.

It opens on your own land at golden sunrise, heavy with fruit, and helps you turn
that vision into a real, buildable plan.

## The experience

The app is built around a single idea: **show you how glorious your land could
be, then help you get there.**

- **🌄 Vision** — Your home screen. A sunrise view over the satellite image of
  your land, with leaves glistening in the morning light, butterflies drifting
  between the plants, and a softly bubbling bird bath. It highlights your *peak
  bounty* — the most abundant month of your year — to inspire you.
- **📍 Site** — Find your land from above on a satellite map, drop a pin (or use
  your location), and set your USDA hardiness zone and sun exposure. Everything
  the app suggests is tuned to this. The app also **reads your region** from live
  data: your climate-derived hardiness zone, growing-season length and a named
  biome (e.g. "Warm-summer Mediterranean").
- **🌱 Plants** — A database of fruit & nut trees, edible and medicinal shrubs,
  vines, herbs and ground covers, filtered to what will actually thrive on your
  site. Each plant shows its forest layer, uses, seasonal calendar and **guild
  companions**.
- **✨ Design my paradise** — one tap fills your property boundary with a
  balanced, correctly-spaced food forest: a canopy grid, a companion guild under
  every tree, and understory/shrubs between — all tuned to your zone and sun.
- **🗺️ Design** — Place suggested plants onto the satellite view of your land.
  Each planting shows its true-to-scale mature spread. Outline your **property
  boundary** and line the perimeter with area-appropriate screening species for
  privacy and a sense of enclosure. **Build** structures too — a **chicken coop**
  (adjustable flock + foraging run), a **beehive** (pollination zone), a **pond**
  (resizable), and **rain barrels** — each a hand-drawn marker with its
  permaculture benefits.
- **📅 Timeline** — A month-by-month calendar of when to plant, tend and harvest
  everything in your design, with your peak-bounty month highlighted.
- **📣 Advocate** — The part that leaves your own fence line. Your ripple in
  numbers, a poison-free pledge, ready-to-send invitations written with your own
  figures in them, the case for local self-reliant food, and small local moves
  that put trees and hens on other people's land.

## Advocacy

Growing your own is the start; the point is that it spreads. The **Advocate**
tab (`src/data/advocacy.ts`) turns your design into an argument other people can
act on:

- **Your ripple** — trees planted, hens and their yearly eggs, unsprayed harvest,
  ground kept poison-free, groceries not bought, invitations sent.
- **The poison-free pledge** — no pesticides, herbicides or synthetic
  fertilizer; diversity instead of a spray program; fertility built on site;
  surplus, seed and cuttings shared; someone new invited every year.
- **Invitations** — four messages (a neighbor, family or a friend, your town or
  group, a local grower), each composed from your own numbers and zone and
  handed to the system share sheet to edit and send. Sent invitations earn the
  📣 Advocate milestone.
- **The case** — eight short arguments for fruit trees, chickens and food that
  doesn't travel, written for a conversation at a fence line.
- **Do more, locally** — gift trees on the boundary, giving the glut away, scion
  swaps, mapping the fruit on your street, asking the nursery for bare-root
  stock, talking a neighbor into three hens, pushing the town to plant food
  instead of ornamentals.

Harvest, savings and egg figures are the app's own rough estimates at maturity —
made for making the case, not for a farm budget.

## Region intelligence

Given your coordinates, the app resolves a **region profile** from live sources,
in parallel and with graceful offline fallback (`src/data/region/`):

- **[Open-Meteo](https://open-meteo.com/)** — 10 years of historical climate
  normals → a globally-valid USDA hardiness zone (from the average annual
  minimum temperature) and frost-free growing-season length.
- **Köppen-Geiger** — the biome is **computed on-device** from the monthly
  temperature/precipitation normals (Peel et al. 2007 criteria), so no external
  dataset is bundled and it works worldwide.
- **[USDA phzmapi](https://phzmapi.org/)** — for US locations, refines the zone
  precisely via a reverse-geocoded ZIP.
- **[iNaturalist](https://www.inaturalist.org/api)** — the *actual* butterflies,
  birds and native plants observed near you. Real butterfly **photos flutter
  across the Vision scene**, and matching plants get a "🌿 Native here" badge.

Results are cached on-device (keyed by coordinate, 30-day freshness). If the
network is unavailable, the app falls back to a latitude-based zone estimate and
its curated planting data, so it always works.

### Data attribution

Open-Meteo data is CC-BY 4.0. iNaturalist observations and photos belong to
their observers under their own licenses — we link back to each taxon. Köppen
classification follows Peel, Finlayson & McMahon (2007).

## The seven layers

Suggestions are organized around the classic food-forest layers so you build a
balanced, self-sustaining system:

Canopy · Understory trees · Shrubs · Herbaceous · Ground cover · Vines · Roots

## Tech

- [Expo](https://expo.dev) (React Native) + TypeScript
- `react-native-maps` for the satellite canvas (Apple Maps on iOS — no API key)
- `expo-location` for finding your land
- `zustand` (persisted via AsyncStorage) for the design state
- `expo-linear-gradient` + React Native `Animated` for the sunrise scene
- `expo-audio` for the ambient dawn soundscape

## Running it

```bash
npm install
npx expo start        # then press "i" for the iOS simulator, or scan the QR in Expo Go
```

The satellite map and location features use native modules; use the iOS
simulator or a development build for the full experience.

### Using real video b-roll on the hero

The Vision hero shows an animated orchard backdrop (three scenes cross-fading
every 3s). To use real fruit-tree footage instead, drop up to three short clips
into `assets/video/` and list them in `src/video/broll.ts` — the hero will cycle
them automatically. Free, no-attribution sources: Mixkit, Coverr, Pexels. Clips
can be any length (only ~3s of each is shown).

### Enabling the dawn soundscape

The Vision screen has an ambient soundscape toggle (birdsong + a light breeze +
bubbling water). To enable it, drop a looping recording into `assets/audio/` and
point `AMBIENCE_SOURCE` at it in `src/audio/soundscape.ts`:

```ts
export const AMBIENCE_SOURCE = require('../../assets/audio/dawn-chorus.m4a');
```

Ideally the recording matches the dawn chorus of the user's own region.

## Project layout

```
src/
  audio/        ambient soundscape hook
  components/   reusable UI (plant cards, coop marker, hens, leaves, bird bath)
  data/         plant database, climate/zone logic, seasonal + geo helpers
    advocacy.ts the case, the pledge, invitations & local actions
    region/     live region intelligence (Open-Meteo, Köppen, phzmapi, iNat)
  navigation/   tab + stack navigation
  screens/      Vision, Site, Plants, PlantDetail, Design, Timeline, Advocate
  store/        persisted design state (zustand)
  theme.ts      design tokens + forest-layer metadata
  types.ts      core domain types
```

## Note on the plant data

Hardiness zones, seasonal months and companion pairings are curated general
guidance for Northern-Hemisphere temperate climates — a starting point, not
prescriptions. Your local microclimate always has the final say.
