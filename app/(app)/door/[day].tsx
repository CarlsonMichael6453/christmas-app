import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { BackButton, Button, Card, Muted, Screen, Title } from '@/src/components/ui';
import { doorByDay, doorKinds } from '@/src/content/advent';
import { isDoorUnlocked } from '@/src/logic/countdown';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function Door() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const number = Number(day);
  const door = doorByDay(number);
  const { previewAdvent, doorsOpen, markDoorOpen } = useApp();
  const { theme, fonts } = useTheme();
  const unlocked = isDoorUnlocked(number, new Date(), previewAdvent);

  if (!door || !unlocked) {
    return (
      <Screen>
        <BackButton />
        <Title>Still shut</Title>
        <Muted>This door opens on December {number || '?'}.</Muted>
        <Button label="Back to the calendar" tone="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const kind = doorKinds[door.kind];
  const opened = doorsOpen.includes(door.day);

  return (
    <Screen>
      <BackButton />
      <Text style={{ fontSize: 42 }}>{kind.emoji}</Text>
      <Muted>
        December {door.day} · {kind.label}
      </Muted>
      <Title>{door.title}</Title>
      <Card>
        <Text style={{ color: theme.colors.text, fontFamily: fonts.regular, fontSize: 17, lineHeight: 24 }}>{door.body}</Text>
      </Card>
      {!opened ? <Button label="I've opened it" onPress={() => void markDoorOpen(door.day)} /> : <Muted>Opened.</Muted>}
    </Screen>
  );
}
