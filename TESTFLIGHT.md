# Shipping "Let's Plant Paradise" to TestFlight

This app is configured for EAS Build (`eas.json`). Follow these steps on your
Mac to get a build into TestFlight so others can install it.

## Prerequisites
- An **Apple Developer account** ($99/yr) — required for TestFlight.
- A **free Expo account** (expo.dev).
- Node + the EAS CLI:
  ```bash
  npm install -g eas-cli
  eas login
  ```

## One-time setup
From the project folder:

```bash
eas init          # links this project to your Expo account (writes the projectId into app.json)
```

The bundle identifier is already set to `com.letsplantparadise.app` in `app.json`.
If you want a different one, change it there before building.

## Build for TestFlight

```bash
eas build --platform ios --profile production
```

- EAS will offer to **create the iOS credentials** (signing certificate +
  provisioning profile) for you — say yes; it manages them in the cloud.
- The build runs on Expo's servers (~15–25 min). You'll get a link to the
  finished `.ipa`.

## Submit to TestFlight

```bash
eas submit --platform ios --profile production --latest
```

- Provide your Apple ID / App Store Connect API key when prompted.
- On first submit, EAS can **create the app record** in App Store Connect for you.
- After processing (~5–15 min in App Store Connect), add testers under
  **TestFlight → Internal Testing** (up to 100 without review) or set up
  External Testing (needs a quick Beta App Review).

## Try it faster (no Apple account, just the Simulator)

```bash
eas build --platform ios --profile development
```

Installs a dev build to a Simulator/registered device without TestFlight —
handy for sharing internally before the full submit.

## Before you publish — a checklist
- **Real music/audio license**: `assets/audio/startup.mp3` must be a track you
  have the right to distribute (a public-domain / CC0 recording).
- **App icon & splash**: already generated in `assets/`.
- **Yosemite startup override**: the app currently forces the map to Yosemite on
  every launch (a testing convenience). Ask me to switch this to
  "default-only" so real users' chosen locations persist before you ship.
- **Privacy**: the app uses location and calls Open-Meteo, phzmapi and
  iNaturalist. App Store Connect will ask for a privacy label — declare
  approximate location use (for suggestions), and note no data is sold.
