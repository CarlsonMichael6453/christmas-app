import { Redirect } from 'expo-router';

import { useApp } from '@/src/backend/AppState';

export default function Index() {
  const { user, ready } = useApp();
  if (!ready) return null;
  if (!user) return <Redirect href="/sign-in" />;
  return <Redirect href="/(app)/(tabs)" />;
}
