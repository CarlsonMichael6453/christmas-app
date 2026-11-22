import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { BackButton, Button, Card, GroupPrompt, Muted, Screen, Title } from '@/src/components/ui';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function Letters() {
  const { letters, group, user, nameOf, deleteLetter } = useApp();
  const { theme, fonts } = useTheme();
  if (!group || !user) {
    return (
      <Screen>
        <BackButton />
        <GroupPrompt />
      </Screen>
    );
  }
  return (
    <Screen>
      <BackButton />
      <Title>Letters to Santa</Title>
      <Muted>Kids can write or draw. Everyone in the group can read them, which is the point for parents.</Muted>
      <Button label="New letter" onPress={() => router.push('/(app)/letters/edit')} />
      {letters.map((letter) => (
        <Pressable key={letter.id} onPress={() => router.push(`/(app)/letters/edit?id=${letter.id}`)}>
          <Card>
            <Text style={{ color: theme.colors.text, fontFamily: fonts.bold, fontSize: 18 }}>{letter.title}</Text>
            <Muted>
              {nameOf(letter.authorId)}
              {letter.strokes.length ? ' · with a drawing' : ''}
            </Muted>
            <Text style={{ color: theme.colors.text, fontFamily: fonts.regular }} numberOfLines={3}>
              {letter.body}
            </Text>
            {letter.authorId === user.id ? (
              <Button label="Delete" tone="ghost" onPress={() => void deleteLetter(letter.id)} />
            ) : null}
          </Card>
        </Pressable>
      ))}
      {letters.length === 0 ? <Muted>No letters yet.</Muted> : null}
    </Screen>
  );
}
