import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, Text, View } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { Button, Card, Field, GroupPrompt, Heading, Muted, Screen, Title } from '@/src/components/ui';
import { money, prettyDate } from '@/src/logic/format';
import { tap } from '@/src/logic/feedback';
import type { Exclusion } from '@/src/model/types';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function Santa() {
  const app = useApp();
  const { theme, fonts } = useTheme();
  const [name, setName] = useState('Secret Santa');
  const [budget, setBudget] = useState('40');
  const [date, setDate] = useState('2026-12-20');
  const [picked, setPicked] = useState<string[]>([]);
  const [pairs, setPairs] = useState<Exclusion[]>([]);
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [notice, setNotice] = useState('');

  if (!app.group || !app.user) {
    return (
      <Screen>
        <Title>Secret Santa</Title>
        <GroupPrompt />
      </Screen>
    );
  }

  function togglePerson(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  }

  async function create() {
    const ok = await app.createEvent({
      name,
      budget: Number(budget) || 0,
      exchangeDate: date,
      participantIds: picked.length ? picked : app.members.map((member) => member.id),
      exclusions: pairs,
    });
    if (ok) {
      setNotice('');
      await tap('success');
    }
  }

  return (
    <Screen>
      <Title>Secret Santa</Title>
      <Muted>Each person pulls a slip on their own phone. Nobody else, including the organizer, gets that name from the app.</Muted>
      {app.events.map((event) => {
        const match = app.myMatch(event.id);
        const seen = app.slipSeen(event.id);
        return (
          <Card key={event.id}>
            <Heading>{event.name}</Heading>
            <Muted>
              Budget {money(event.budget)}
              {event.exchangeDate ? ` · ${prettyDate(event.exchangeDate)}` : ''}
            </Muted>
            <Muted>
              {event.participantIds.map((id) => app.nameOf(id)).join(', ')}
            </Muted>
            {event.exclusions.length ? (
              <Muted>
                Excluded:{' '}
                {event.exclusions.map((pair) => `${app.nameOf(pair.a)} & ${app.nameOf(pair.b)}`).join(', ')}
              </Muted>
            ) : null}
            {event.drawn && match ? (
              seen ? (
                <View style={{ gap: 8 }}>
                  <Text style={{ color: theme.colors.text, fontFamily: fonts.display, fontSize: 28 }}>
                    You have {match.receiver.displayName}
                  </Text>
                  <Button
                    label="Open their wishlist"
                    onPress={() => router.push(`/(app)/list/${match.receiver.id}`)}
                  />
                </View>
              ) : (
                <SlipPull
                  onPull={() => {
                    void tap('success');
                    app.markSlipSeen(event.id);
                  }}
                />
              )
            ) : event.drawn ? (
              <Muted>The names are drawn. Your slip is not in yet — ask the organizer to reset if you were added late.</Muted>
            ) : (
              <Muted>
                {event.organizerId === app.user?.id
                  ? 'Names are not drawn yet.'
                  : `Names are not drawn yet. ${app.nameOf(event.organizerId)} runs the draw, then you pull your own slip here.`}
              </Muted>
            )}
            {event.organizerId === app.user?.id ? (
              <View style={{ gap: 8 }}>
                {!event.drawn ? (
                  <Button
                    label="Draw names"
                    onPress={() => {
                      void app.draw(event.id).then((result) => {
                        if (!result.ok) setNotice(result.reason ?? 'No valid draw.');
                        else {
                          setNotice('Names are drawn. Each person pulls their own slip.');
                          void tap('success');
                        }
                      });
                    }}
                  />
                ) : (
                  <Button
                    label="Reset the draw"
                    tone="ghost"
                    onPress={() => {
                      void app.resetDraw(event.id);
                      setNotice('Matches cleared.');
                    }}
                  />
                )}
              </View>
            ) : null}
          </Card>
        );
      })}
      {notice ? <Muted>{notice}</Muted> : null}
      <Card>
        <Heading>New drawing</Heading>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Budget" value={budget} onChangeText={setBudget} keyboardType="decimal-pad" />
        <Field label="Exchange date" value={date} onChangeText={setDate} placeholder="2026-12-20" />
        <Muted>Who is in? Leave everyone off to include the whole group.</Muted>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {app.members.map((member) => {
            const on = picked.includes(member.id);
            return (
              <Pressable
                key={member.id}
                onPress={() => togglePerson(member.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: on ? theme.colors.primary : theme.colors.surfaceAlt,
                }}
              >
                <Text style={{ color: on ? theme.colors.onPrimary : theme.colors.text, fontFamily: fonts.semibold }}>
                  {member.displayName}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Muted>Couples and other exclusions go both ways. Nobody can draw themselves.</Muted>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Field label="Person" value={left} onChangeText={setLeft} placeholder="Name" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="And" value={right} onChangeText={setRight} placeholder="Name" />
          </View>
        </View>
        <Button
          label="Add exclusion"
          tone="ghost"
          onPress={() => {
            const a = app.members.find((member) => member.displayName.toLowerCase() === left.trim().toLowerCase());
            const b = app.members.find((member) => member.displayName.toLowerCase() === right.trim().toLowerCase());
            if (!a || !b || a.id === b.id) {
              setNotice('Use two different names from the group.');
              return;
            }
            setPairs((current) => [...current, { a: a.id, b: b.id }]);
            setLeft('');
            setRight('');
            setNotice(`${a.displayName} and ${b.displayName} will not draw each other.`);
          }}
        />
        {pairs.map((pair) => (
          <Muted key={`${pair.a}-${pair.b}`}>
            {app.nameOf(pair.a)} ↔ {app.nameOf(pair.b)}
          </Muted>
        ))}
        <Button label="Create drawing" onPress={() => void create()} />
      </Card>
      <Card>
        <Heading>Party games</Heading>
        <Muted>White elephant and pass-the-present live on one phone the room can share.</Muted>
        <Button label="Open party modes" tone="secondary" onPress={() => router.push('/(app)/party')} />
      </Card>
    </Screen>
  );
}

function SlipPull({ onPull }: { onPull: () => void }) {
  const spin = useRef(new Animated.Value(0)).current;
  const { theme, fonts } = useTheme();
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(spin, { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(spin, { toValue: -1, duration: 180, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(spin, { toValue: 0, duration: 180, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] });
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }}>
      <Animated.Text style={{ fontSize: 64, transform: [{ rotate }] }}>🎅</Animated.Text>
      <Text style={{ color: theme.colors.text, fontFamily: fonts.bold }}>The hat is ready.</Text>
      <Button label="Pull your slip" onPress={onPull} />
    </View>
  );
}
