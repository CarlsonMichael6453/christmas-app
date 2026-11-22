import { useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { BackButton, Button, Heading, Muted, Screen, Title } from '@/src/components/ui';
import { tap } from '@/src/logic/feedback';
import { useTheme } from '@/src/theme/ThemeProvider';

const faces = ['🎄', '⭐', '🎁', '🧦', '🔔', '🦌', '❄️', '🕯️'];

function deck() {
  const cards = faces.flatMap((face) => [
    { id: `${face}-a`, face },
    { id: `${face}-b`, face },
  ]);
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = cards[index]!;
    cards[index] = cards[swap]!;
    cards[swap] = current;
  }
  return cards;
}

export default function MatchGame() {
  const { theme, fonts } = useTheme();
  const { width } = useWindowDimensions();
  const [cards, setCards] = useState(deck);
  const [up, setUp] = useState<string[]>([]);
  const [known, setKnown] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false);
  const size = Math.floor((Math.min(width, 560) - 32 - 18) / 4);
  const won = known.length === cards.length && cards.length > 0;
  const facesById = useMemo(() => new Map(cards.map((card) => [card.id, card.face])), [cards]);

  function reset() {
    setCards(deck());
    setUp([]);
    setKnown([]);
    setMoves(0);
    setLock(false);
  }

  function flip(id: string) {
    if (lock || known.includes(id) || up.includes(id) || up.length === 2) return;
    const next = [...up, id];
    setUp(next);
    if (next.length < 2) return;
    setMoves((value) => value + 1);
    const [first, second] = next;
    if (facesById.get(first!) === facesById.get(second!)) {
      setKnown((current) => [...current, first!, second!]);
      setUp([]);
      void tap('success');
      return;
    }
    setLock(true);
    setTimeout(() => {
      setUp([]);
      setLock(false);
    }, 700);
  }

  return (
    <Screen>
      <BackButton />
      <Title>Ornament match</Title>
      <Muted>{won ? `All pairs found in ${moves} turns.` : `${moves} turns. Find the matching ornaments.`}</Muted>
      {won ? <Heading>The tree is complete.</Heading> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {cards.map((card) => {
          const shown = up.includes(card.id) || known.includes(card.id);
          return (
            <Pressable
              key={card.id}
              onPress={() => flip(card.id)}
              style={{
                width: size,
                height: size,
                borderRadius: 14,
                backgroundColor: shown ? theme.colors.card : theme.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <Text style={{ fontSize: 28, fontFamily: fonts.bold, color: theme.colors.onPrimary }}>{shown ? card.face : '✶'}</Text>
            </Pressable>
          );
        })}
      </View>
      <Button label="Shuffle again" tone="ghost" onPress={reset} />
    </Screen>
  );
}
