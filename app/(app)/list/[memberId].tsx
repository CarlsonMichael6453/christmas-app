import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { Pressable, Text, View } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { BackButton, Button, Card, GroupPrompt, Heading, Muted, Screen, Stars, Title } from '@/src/components/ui';
import { money } from '@/src/logic/format';
import { tap } from '@/src/logic/feedback';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function MemberList() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const { items, user, members, nameOf, claim, markBought, release, deleteItem, group } = useApp();
  const { theme, fonts } = useTheme();
  if (!group || !user) {
    return (
      <Screen>
        <GroupPrompt />
      </Screen>
    );
  }
  const ownerId = String(memberId);
  const mine = ownerId === user.id;
  const list = items.filter((item) => item.ownerId === ownerId);
  const name = mine ? 'Your list' : nameOf(ownerId);

  return (
    <Screen>
      <BackButton />
      <Title>{name}</Title>
      <Muted>
        {mine
          ? 'Family can claim these. You will keep seeing them as ordinary wishes, even after they are bought.'
          : `Claim a gift so two people do not buy the same thing. ${nameOf(ownerId)} will not see the claim.`}
      </Muted>
      {mine ? <Button label="Add a wish" onPress={() => router.push('/(app)/item/edit')} /> : null}
      {list.length === 0 ? <Muted>Nothing here yet.</Muted> : null}
      {list.map((item) => {
        const claimer = item.claim ? members.find((member) => member.id === item.claim?.claimerId) : null;
        return (
          <Card key={item.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Heading>{item.title}</Heading>
              <Stars value={item.priority} />
            </View>
            {item.price != null ? <Muted>{money(item.price)}</Muted> : null}
            {item.notes ? <Text style={{ color: theme.colors.text, fontFamily: fonts.regular }}>{item.notes}</Text> : null}
            {item.link ? (
              <Pressable onPress={() => void Linking.openURL(item.link)}>
                <Text style={{ color: theme.colors.primary, fontFamily: fonts.semibold }}>Open link</Text>
              </Pressable>
            ) : null}
            {item.claim ? (
              <Muted>
                {item.claim.status === 'bought' ? 'Bought' : 'Claimed'} by {claimer?.displayName ?? nameOf(item.claim.claimerId)}
                {item.claim.pricePaid != null ? ` · ${money(item.claim.pricePaid)}` : ''}
              </Muted>
            ) : null}
            {mine ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Button label="Edit" tone="ghost" onPress={() => router.push(`/(app)/item/edit?id=${item.id}`)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Remove" tone="danger" onPress={() => void deleteItem(item.id)} />
                </View>
              </View>
            ) : item.claim && item.claim.claimerId !== user.id ? null : item.claim?.status === 'claimed' ? (
              <View style={{ gap: 8 }}>
                <Button
                  label="Mark bought"
                  onPress={() => {
                    void tap('success');
                    void markBought(item.id, item.price);
                  }}
                />
                <Button label="Let it go" tone="ghost" onPress={() => void release(item.id)} />
              </View>
            ) : item.claim ? (
              <Button label="Let it go" tone="ghost" onPress={() => void release(item.id)} />
            ) : (
              <View style={{ gap: 8 }}>
                <Button
                  label="Claim"
                  onPress={() => {
                    void tap('success');
                    void claim(item.id);
                  }}
                />
                <Button
                  label="I bought it"
                  tone="secondary"
                  onPress={() => {
                    void tap('success');
                    void claim(item.id).then((ok) => {
                      if (ok) void markBought(item.id, item.price);
                    });
                  }}
                />
              </View>
            )}
          </Card>
        );
      })}
      {!mine && members.every((member) => member.id !== ownerId) ? <Muted>That person is not in this group.</Muted> : null}
    </Screen>
  );
}
