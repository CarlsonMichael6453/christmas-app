import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { BackButton, Button, Card, Field, GroupPrompt, Heading, Muted, Screen, Title } from '@/src/components/ui';
import { uid } from '@/src/logic/format';
import {
  openGift,
  passTimerEnded,
  passToNext,
  startPass,
  startWhiteElephant,
  stealGift,
  timeoutTurn,
} from '@/src/logic/party';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function Party() {
  const { party, saveParty, group, members } = useApp();
  const { theme, fonts } = useTheme();
  const [mode, setMode] = useState<'elephant' | 'pass'>('elephant');
  const [player, setPlayer] = useState('');
  const [gift, setGift] = useState('');
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(Date.now());
  const acting = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!party || acting.current) return;
    const elephantDue = party.phase === 'playing' && party.turnEndsAt != null && now >= party.turnEndsAt;
    const passDue = party.passRunning && party.passEndsAt != null && now >= party.passEndsAt;
    if (!elephantDue && !passDue) return;
    acting.current = true;
    const next = elephantDue ? timeoutTurn(party, now) : passTimerEnded(party, now);
    void saveParty(next).finally(() => {
      acting.current = false;
    });
  }, [now, party, saveParty]);

  if (!group || !party) {
    return (
      <Screen>
        <BackButton />
        <GroupPrompt />
      </Screen>
    );
  }

  function act(make: () => ReturnType<typeof openGift>) {
    try {
      void saveParty(make());
      setNotice('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'That move is not allowed.');
    }
  }
  const elephantLeft = party.turnEndsAt ? Math.max(0, Math.ceil((party.turnEndsAt - now) / 1000)) : 0;
  const passLeft = party.passEndsAt ? Math.max(0, Math.ceil((party.passEndsAt - now) / 1000)) : 0;
  const holder = party.passPlayers[party.passHolding];

  return (
    <Screen>
      <BackButton />
      <Title>Gift exchange</Title>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button label="White elephant" tone={mode === 'elephant' ? 'primary' : 'ghost'} onPress={() => setMode('elephant')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Pass the present" tone={mode === 'pass' ? 'primary' : 'ghost'} onPress={() => setMode('pass')} />
        </View>
      </View>

      {mode === 'elephant' ? (
        <Card>
          <Heading>White elephant</Heading>
          <Muted>Open a gift or steal one. A stolen gift cannot come straight back, and it locks after {party.maxSteals} steals.</Muted>
          {party.phase === 'setup' ? (
            <View style={{ gap: 8 }}>
              <Field label="Add a player" value={player} onChangeText={setPlayer} placeholder="Name" />
              <Button
                label="Add player"
                tone="ghost"
                onPress={() => {
                  const name = player.trim();
                  if (!name) return;
                  void saveParty({ ...party, players: [...party.players, name] });
                  setPlayer('');
                }}
              />
              <Button
                label="Use the group"
                tone="ghost"
                onPress={() => void saveParty({ ...party, players: members.map((member) => member.displayName) })}
              />
              <Muted>{party.players.join(', ') || 'No players yet.'}</Muted>
              <Field label="Wrapped gift" value={gift} onChangeText={setGift} placeholder="Red box" />
              <Button
                label="Add gift"
                tone="ghost"
                onPress={() => {
                  const label = gift.trim();
                  if (!label) return;
                  void saveParty({
                    ...party,
                    gifts: [...party.gifts, { id: uid(), label, opened: false, holder: null, steals: 0 }],
                  });
                  setGift('');
                }}
              />
              {party.gifts.map((entry) => (
                <Muted key={entry.id}>{entry.label}</Muted>
              ))}
              <Button
                label="Start"
                onPress={() => act(() => startWhiteElephant(party))}
              />
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <Text style={{ color: theme.colors.text, fontFamily: fonts.display, fontSize: 28 }}>
                {party.phase === 'done' ? 'That is the game' : `${party.activePlayer}'s turn`}
              </Text>
              {party.phase === 'playing' ? <Muted>{elephantLeft}s left on the clock</Muted> : null}
              {notice ? <Muted>{notice}</Muted> : null}
              {party.gifts.map((entry) => (
                <View key={entry.id} style={{ gap: 6, paddingVertical: 4 }}>
                  <Text style={{ color: theme.colors.text, fontFamily: fonts.bold }}>
                    {entry.opened ? entry.label : 'Wrapped gift'} · {entry.opened ? entry.holder : 'still shut'}
                    {entry.opened ? ` · ${entry.steals}/${party.maxSteals} steals` : ''}
                  </Text>
                  {party.phase === 'playing' && !entry.opened ? (
                    <Button label={`Open ${entry.label}`} tone="secondary" onPress={() => act(() => openGift(party, entry.id, now))} />
                  ) : null}
                  {party.phase === 'playing' && entry.opened && entry.holder !== party.activePlayer && entry.steals < party.maxSteals ? (
                    <Button label="Steal it" onPress={() => act(() => stealGift(party, entry.id, now))} />
                  ) : null}
                </View>
              ))}
              {party.log.slice(-4).map((line, index) => (
                <Muted key={`${line}-${index}`}>{line}</Muted>
              ))}
              <Button
                label="Back to setup"
                tone="ghost"
                onPress={() =>
                  void saveParty({
                    ...party,
                    phase: 'setup',
                    gifts: party.gifts.map((entry) => ({ ...entry, opened: false, holder: null, steals: 0 })),
                    log: [],
                    activePlayer: null,
                    turnEndsAt: null,
                  })
                }
              />
            </View>
          )}
        </Card>
      ) : (
        <Card>
          <Heading>Pass the present</Heading>
          <Muted>Pass it while the timer runs. Whoever is holding it when time stops is out. Last person wins.</Muted>
          <Field label="Add a player" value={player} onChangeText={setPlayer} />
          <Button
            label="Add player"
            tone="ghost"
            onPress={() => {
              const name = player.trim();
              if (!name) return;
              void saveParty({ ...party, passPlayers: [...party.passPlayers, name] });
              setPlayer('');
            }}
          />
          <Button
            label="Use the group"
            tone="ghost"
            onPress={() => void saveParty({ ...party, passPlayers: members.map((member) => member.displayName) })}
          />
          <Muted>{party.passPlayers.join(', ') || 'No players yet.'}</Muted>
          {!party.passRunning && party.passOut.length === 0 ? (
            <Button label="Start the music" onPress={() => act(() => startPass(party))} />
          ) : null}
          {party.passRunning ? (
            <View style={{ gap: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 48 }}>🎁</Text>
              <Text style={{ color: theme.colors.text, fontFamily: fonts.display, fontSize: 32 }}>{holder}</Text>
              <Muted>{passLeft}s</Muted>
              <Button label="Pass it" onPress={() => void saveParty(passToNext(party))} />
            </View>
          ) : null}
          {party.passLog.slice(-5).map((line, index) => (
            <Muted key={`${line}-${index}`}>{line}</Muted>
          ))}
          <Button
            label="Reset"
            tone="ghost"
            onPress={() =>
              void saveParty({ ...party, passRunning: false, passOut: [], passEndsAt: null, passHolding: 0, passLog: [] })
            }
          />
        </Card>
      )}
    </Screen>
  );
}
