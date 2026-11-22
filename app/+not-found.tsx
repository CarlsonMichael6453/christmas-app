import { Stack, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/src/components/ui';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function NotFound() {
  const router = useRouter();
  const { theme, fonts } = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Lost' }} />
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 42 }}>🎄</Text>
        <Text style={{ color: theme.colors.text, fontFamily: fonts.display, fontSize: 28 }}>That room is empty</Text>
        <Button label="Back home" onPress={() => router.replace('/')} />
      </View>
    </>
  );
}
