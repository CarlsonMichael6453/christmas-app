import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Screen, Title } from '@/src/components/ui';
import { useTheme } from '@/src/theme/ThemeProvider';

const rows = [
  { href: '/(app)/group', emoji: '👨‍👩‍👧‍👦', title: 'Family group', blurb: 'Code, members, switching' },
  { href: '/(app)/budget', emoji: '🪙', title: 'Gift budget', blurb: 'Spent and still to spend' },
  { href: '/(app)/letters', emoji: '✉️', title: 'Letters to Santa', blurb: 'Write or draw' },
  { href: '/(app)/sweaters', emoji: '🧥', title: 'Ugly sweaters', blurb: 'Design and vote' },
  { href: '/(app)/lights', emoji: '💡', title: 'Light map', blurb: 'A list of displays' },
  { href: '/(app)/cookies', emoji: '🍪', title: 'Cookie exchange', blurb: 'Sign-ups and recipes' },
  { href: '/(app)/cards', emoji: '💌', title: 'Cards and thank-yous', blurb: 'Who still needs one' },
  { href: '/(app)/bingo', emoji: '🎬', title: 'Holiday movie bingo', blurb: 'Five in a row' },
  { href: '/(app)/party', emoji: '🎲', title: 'Gift exchange party', blurb: 'White elephant and hot potato' },
  { href: '/(app)/games/catch', emoji: '❄️', title: 'Catch snowflakes', blurb: 'Thirty seconds' },
  { href: '/(app)/games/match', emoji: '🎀', title: 'Ornament match', blurb: 'Flip the pairs' },
  { href: '/(app)/resolutions', emoji: '🌟', title: 'New Year resolutions', blurb: 'Private or shared' },
  { href: '/(app)/settings', emoji: '🎨', title: 'Themes and settings', blurb: 'Colors, preview, people' },
];

export default function More() {
  const { theme, fonts } = useTheme();
  return (
    <Screen>
      <Title>More</Title>
      {rows.map((row) => (
        <Pressable
          key={row.href}
          onPress={() => router.push(row.href as never)}
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: 18,
            padding: 14,
            borderWidth: 1,
            borderColor: theme.colors.border,
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 26 }}>{row.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontFamily: fonts.bold, fontSize: 16 }}>{row.title}</Text>
            <Text style={{ color: theme.colors.textMuted, fontFamily: fonts.regular }}>{row.blurb}</Text>
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}
