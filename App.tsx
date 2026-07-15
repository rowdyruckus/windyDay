import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Onboarding } from './src/screens/Onboarding';
import { useStartupMusic } from './src/audio/music';
import { useDesignStore } from './src/store/useDesignStore';

function StartupMusic() {
  const muted = useDesignStore((s) => s.musicMuted);
  useStartupMusic(muted);
  return null;
}

export default function App() {
  const hydrated = useDesignStore((s) => s.hydrated);
  const onboarded = useDesignStore((s) => s.onboarded);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <StartupMusic />
      {hydrated && !onboarded ? <Onboarding /> : <RootNavigator />}
    </SafeAreaProvider>
  );
}
