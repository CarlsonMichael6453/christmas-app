import { useState } from 'react';
import { Text, View } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { BackButton, Button, Card, Field, GroupPrompt, Heading, Muted, Screen, Title } from '@/src/components/ui';
import { money } from '@/src/logic/format';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function Budget() {
  const { group, user, budgetTotal, setBudgetTotal, spending, nameOf } = useApp();
  const { theme, fonts } = useTheme();
  const [draft, setDraft] = useState(budgetTotal ? String(budgetTotal) : '');
  if (!group || !user) {
    return (
      <Screen>
        <BackButton />
        <Title>Budget</Title>
        <GroupPrompt />
      </Screen>
    );
  }
  const mine = spending.filter((line) => line.claimerId === user.id);
  const spent = mine.reduce((sum, line) => sum + line.pricePaid, 0);
  const byPerson = new Map<string, number>();
  for (const line of mine) byPerson.set(line.ownerId, (byPerson.get(line.ownerId) ?? 0) + line.pricePaid);
  const ratio = budgetTotal > 0 ? Math.min(1, spent / budgetTotal) : 0;

  return (
    <Screen>
      <BackButton />
      <Title>Gift budget</Title>
      <Muted>Gifts bought for you stay off this screen. You only see spending you are allowed to know about.</Muted>
      <Card>
        <Heading>{money(spent)} spent</Heading>
        <Muted>{budgetTotal ? `${money(Math.max(0, budgetTotal - spent))} still in the plan` : 'Set a total to track what is left.'}</Muted>
        <View style={{ height: 12, borderRadius: 8, backgroundColor: theme.colors.surfaceAlt, overflow: 'hidden' }}>
          <View style={{ width: `${ratio * 100}%`, height: 12, backgroundColor: theme.colors.primary }} />
        </View>
        <Field label="My total budget" value={draft} onChangeText={setDraft} keyboardType="decimal-pad" placeholder="150" />
        <Button label="Save budget" onPress={() => void setBudgetTotal(Number(draft) || 0)} />
      </Card>
      <Heading>What you bought</Heading>
      {[...byPerson.entries()].map(([ownerId, total]) => (
        <Card key={ownerId}>
          <Text style={{ color: theme.colors.text, fontFamily: fonts.bold }}>
            {nameOf(ownerId)} · {money(total)}
          </Text>
          {mine
            .filter((line) => line.ownerId === ownerId)
            .map((line) => (
              <Muted key={line.itemId}>
                {line.title} · {money(line.pricePaid)}
              </Muted>
            ))}
        </Card>
      ))}
      {mine.length === 0 ? <Muted>Mark a gift bought, with a price, and it lands here.</Muted> : null}
      <Heading>Visible family spending</Heading>
      <Muted>This leaves out anything bought for you.</Muted>
      {spending.length === 0 ? <Muted>Nothing visible yet.</Muted> : null}
      {spending.map((line) => (
        <Muted key={`${line.itemId}-${line.claimerId}`}>
          {nameOf(line.claimerId)} bought {line.title} for {nameOf(line.ownerId)} · {money(line.pricePaid)}
        </Muted>
      ))}
    </Screen>
  );
}
