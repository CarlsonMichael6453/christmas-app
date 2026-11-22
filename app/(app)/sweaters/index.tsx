import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { SweaterView } from '@/src/components/SweaterView';
import { BackButton, Button, Card, GroupPrompt, Heading, Muted, Screen, Title } from '@/src/components/ui';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function Sweaters() {
  const { sweaters, group, user, votesFor, nameOf, toggleVote } = useApp();
  const { fonts, theme } = useTheme();
  if (!group || !user) {
    return (
      <Screen>
        <BackButton />
        <GroupPrompt />
      </Screen>
    );
  }
  const ranked = [...sweaters].sort((a, b) => votesFor(b.id).count - votesFor(a.id).count);
  return (
    <Screen>
      <BackButton />
      <Title>Ugly sweaters</Title>
      <Muted>Design one, then let the group vote. The loudest sweater wins.</Muted>
      <Button label="Design a sweater" onPress={() => router.push('/(app)/sweaters/edit')} />
      {ranked.map((sweater) => {
        const vote = votesFor(sweater.id);
        return (
          <Card key={sweater.id}>
            <View style={{ alignItems: 'center' }}>
              <SweaterView sweater={sweater} />
            </View>
            <Heading>{sweater.name}</Heading>
            <Muted>By {nameOf(sweater.designerId)}</Muted>
            <Text style={{ color: theme.colors.text, fontFamily: fonts.bold }}>
              {vote.count} {vote.count === 1 ? 'vote' : 'votes'}
            </Text>
            <Button
              label={vote.mine ? 'Take my vote back' : 'Vote for this one'}
              tone={vote.mine ? 'ghost' : 'primary'}
              onPress={() => void toggleVote(sweater.id)}
            />
            {sweater.designerId === user.id ? (
              <Button label="Edit" tone="ghost" onPress={() => router.push(`/(app)/sweaters/edit?id=${sweater.id}`)} />
            ) : null}
          </Card>
        );
      })}
      {ranked.length === 0 ? <Muted>The runway is empty.</Muted> : null}
    </Screen>
  );
}
