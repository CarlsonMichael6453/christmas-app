import { router } from 'expo-router';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { Button, Muted, Screen, Title } from '@/src/components/ui';
import { adventDoors, doorKinds } from '@/src/content/advent';
import { isDoorUnlocked } from '@/src/logic/countdown';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function Advent() {
  const { doorsOpen, previewAdvent, setPreviewAdvent } = useApp();
  const { theme, fonts } = useTheme();
  const { width } = useWindowDimensions();
  const columns = width > 700 ? 6 : 4;
  const gap = 8;
  const size = Math.floor((Math.min(width, 560) - 32 - gap * (columns - 1)) / columns);
  const today = new Date();

  return (
    <Screen>
      <Title>Advent</Title>
      <Muted>
        Doors open on their December day. {previewAdvent ? 'Preview is on, so every door opens.' : 'Turn on preview to read ahead.'}
      </Muted>
      <Button
        label={previewAdvent ? 'Hide locked doors' : 'Preview locked doors'}
        tone="ghost"
        onPress={() => void setPreviewAdvent(!previewAdvent)}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
        {adventDoors.map((door) => {
          const unlocked = isDoorUnlocked(door.day, today, previewAdvent);
          const opened = doorsOpen.includes(door.day);
          const kind = doorKinds[door.kind];
          return (
            <Pressable
              key={door.day}
              onPress={() => {
                if (unlocked) router.push(`/(app)/door/${door.day}`);
              }}
              style={{
                width: size,
                height: size,
                borderRadius: 16,
                backgroundColor: unlocked ? theme.colors.primary : theme.colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: opened ? 0 : 1,
                borderColor: theme.colors.accent,
              }}
            >
              <Text style={{ color: unlocked ? theme.colors.onPrimary : theme.colors.text, fontFamily: fonts.bold, fontSize: 18 }}>
                {door.day}
              </Text>
              <Text style={{ fontSize: 16 }}>{unlocked ? kind.emoji : '🔒'}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
