import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppProvider, useApp } from '@/src/backend/AppState';
import { rememberFirstOpen } from '@/src/feedback/reviewStore';
import { Snow } from '@/src/components/Snow';
import { StringLights } from '@/src/components/StringLights';
import { ThemeProvider, useTheme } from '@/src/theme/ThemeProvider';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { ready: themeReady, theme, lights } = useTheme();
  const { ready } = useApp();
  const loaded = themeReady && ready;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);

  useEffect(() => {
    void rememberFirstOpen();
  }, []);

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="(app)" />
      </Stack>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
        <Snow />
      </View>
      {lights.id !== 'none' ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: insets.top, left: 0, right: 0 }}>
          <StringLights width={width} />
        </View>
      ) : null}
    </View>
  );
}
