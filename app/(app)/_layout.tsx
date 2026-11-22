import { Redirect, Stack } from 'expo-router';

import { useApp } from '@/src/backend/AppState';

export default function AppLayout() {
  const { user, ready } = useApp();
  if (!ready) return null;
  if (!user) return <Redirect href="/sign-in" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
