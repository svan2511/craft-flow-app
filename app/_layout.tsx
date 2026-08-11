import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { AnimatedSplash, SPLASH_BG } from '@/components/animated-splash';
import { ToastProvider } from '@/components/toast-provider';
import { AuthProvider } from '@/lib/auth-context';
import { initI18n } from '@/lib/i18n';

SplashScreen.preventAutoHideAsync();

let i18nReady: Promise<void> | null = null;
if (!i18nReady) {
  i18nReady = initI18n();
}

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F8F6F3',
    card: '#FFFFFF',
    primary: '#8A6D3B',
    text: '#1C1B1A',
    border: '#CFC9BF',
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });
  const [splashDone, setSplashDone] = useState(false);
  const [i18nLoaded, setI18nLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      await i18nReady;
      setI18nLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && i18nLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, i18nLoaded]);

  if ((!fontsLoaded && !fontError) || !i18nLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <ThemeProvider value={appTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: SPLASH_BG },
            }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="help" />
            <Stack.Screen name="about" />
          </Stack>
          {!splashDone ? <AnimatedSplash onDone={() => setSplashDone(true)} /> : null}
          <StatusBar style="dark" />
        </ThemeProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
