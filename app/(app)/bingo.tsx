import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { BackButton, Button, GroupPrompt, Heading, Muted, Screen, Title } from '@/src/components/ui';
import { bingoFreeIndex, bingoSquares, hasBingo } from '@/src/content/bingo';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function Bingo() {
  const { bingoMarks, toggleBingo, resetBingo, group, user } = useApp();
  const { theme, fonts } = useTheme();
  const { width } = useWindowDimensions();
  if (!group || !user) {
    return (
      <Screen>
        <BackButton />
        <GroupPrompt />
      </Screen>
    );
  }
  const size = Math.floor((Math.min(width, 560) - 32 - 16) / 5);
  const won = hasBingo(bingoMarks);
  return (
    <Screen>
      <BackButton />
      <Title>Movie bingo</Title>
      <Muted>Put on a holiday movie and tap a square when it happens. Five in a row wins.</Muted>
      {won ? <Heading>Bingo. Pass the cocoa.</Heading> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {bingoSquares.map((square, index) => {
          const marked = bingoMarks[index];
          const free = index === bingoFreeIndex;
          return (
            <Pressable
              key={square}
              onPress={() => void toggleBingo(index)}
              style={{
                width: size,
                height: size,
                borderRadius: 10,
                padding: 4,
                backgroundColor: marked ? theme.colors.primary : theme.colors.card,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: marked ? theme.colors.onPrimary : theme.colors.text,
                  fontFamily: fonts.semibold,
                  fontSize: 10,
                  textAlign: 'center',
                }}
              >
                {free ? 'Free cocoa' : square}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Button label="Clear the card" tone="ghost" onPress={() => void resetBingo()} />
    </Screen>
  );
}
