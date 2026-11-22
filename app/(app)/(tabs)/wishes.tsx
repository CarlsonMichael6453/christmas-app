import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { Avatar, Card, GroupPrompt, Heading, Muted, Row, Screen, Title } from '@/src/components/ui';
import { money } from '@/src/logic/format';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function Wishes() {
  const { group, members, items, user } = useApp();
  const { theme, fonts } = useTheme();
  if (!group || !user) {
    return (
      <Screen>
        <Title>Wishlists</Title>
        <GroupPrompt />
      </Screen>
    );
  }
  return (
    <Screen>
      <Title>Wishlists</Title>
      <Muted>Yours is the list people shop from. You will not see who claimed those gifts. Everyone else will.</Muted>
      {members.map((member) => {
        const mine = member.id === user.id;
        const theirs = items.filter((item) => item.ownerId === member.id);
        const waiting = theirs.filter((item) => !item.claim).length;
        return (
          <Pressable key={member.id} onPress={() => router.push(`/(app)/list/${member.id}`)}>
            <Card>
              <Row>
                <Avatar name={member.displayName} />
                <View style={{ flex: 1 }}>
                  <Heading>{mine ? 'Your list' : member.displayName}</Heading>
                  <Muted>
                    {theirs.length === 0
                      ? 'Nothing added yet'
                      : mine
                        ? `${theirs.length} wishes`
                        : `${waiting} still open`}
                  </Muted>
                </View>
                <Text style={{ color: theme.colors.primary, fontFamily: fonts.bold }}>Open</Text>
              </Row>
              {theirs.slice(0, 2).map((item) => (
                <Text key={item.id} style={{ color: theme.colors.text, fontFamily: fonts.regular }}>
                  {item.claim ? '• ' : '◦ '}
                  {item.title}
                  {item.price != null ? ` · ${money(item.price)}` : ''}
                  {item.claim ? ` · ${item.claim.status === 'bought' ? 'bought' : 'claimed'}` : ''}
                </Text>
              ))}
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}
