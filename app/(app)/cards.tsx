import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { BackButton, Button, Card, Field, GroupPrompt, Heading, Muted, Screen, Title } from '@/src/components/ui';
import { uid } from '@/src/logic/format';
import type { CardTask } from '@/src/model/types';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function Cards() {
  const { cards, group, user, saveCard, deleteCard } = useApp();
  const [recipient, setRecipient] = useState('');
  if (!group || !user) {
    return (
      <Screen>
        <BackButton />
        <GroupPrompt />
      </Screen>
    );
  }
  const waiting = cards.filter((card) => !card.cardSent || (card.thankYouNeeded && !card.thankYouSent)).length;
  return (
    <Screen>
      <BackButton />
      <Title>Cards</Title>
      <Muted>
        {waiting} still need attention. This list is yours. The rest of the group does not see it.
      </Muted>
      {cards.map((card) => (
        <Card key={card.id}>
          <Heading>{card.recipient}</Heading>
          {card.notes ? <Muted>{card.notes}</Muted> : null}
          <Toggle label="Card sent" on={card.cardSent} onPress={() => void saveCard({ ...card, cardSent: !card.cardSent })} />
          <Toggle label="Gift given" on={card.giftGiven} onPress={() => void saveCard({ ...card, giftGiven: !card.giftGiven })} />
          <Toggle
            label="Thank-you needed"
            on={card.thankYouNeeded}
            onPress={() => void saveCard({ ...card, thankYouNeeded: !card.thankYouNeeded })}
          />
          <Toggle
            label="Thank-you sent"
            on={card.thankYouSent}
            onPress={() => void saveCard({ ...card, thankYouSent: !card.thankYouSent })}
          />
          <Button label="Remove" tone="ghost" onPress={() => void deleteCard(card.id)} />
        </Card>
      ))}
      <Card>
        <Field label="Who is it for?" value={recipient} onChangeText={setRecipient} placeholder="Grandma Carlson" />
        <Button
          label="Add to the list"
          onPress={() => {
            const card: CardTask = {
              id: uid(),
              groupId: group.id,
              userId: user.id,
              recipient,
              cardSent: false,
              giftGiven: false,
              thankYouNeeded: true,
              thankYouSent: false,
              notes: '',
            };
            void saveCard(card).then((ok) => {
              if (ok) setRecipient('');
            });
          }}
        />
      </Card>
    </Screen>
  );
}

function Toggle({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const { theme, fonts } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ color: theme.colors.text, fontFamily: fonts.regular }}>{label}</Text>
      <Text style={{ color: on ? theme.colors.success : theme.colors.textMuted, fontFamily: fonts.bold }}>{on ? 'Yes' : 'Not yet'}</Text>
    </Pressable>
  );
}
