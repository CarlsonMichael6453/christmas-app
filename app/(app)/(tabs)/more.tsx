import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Heading, Muted, Screen, Title } from '@/src/components/ui';
import { useTheme } from '@/src/theme/ThemeProvider';

const sections: {
  title: string;
  blurb: string;
  rows: { href: string; emoji: string; title: string; blurb: string }[];
}[] = [
  {
    title: 'The household',
    blurb: 'The join code and the people in this Christmas.',
    rows: [
      {
        href: '/(app)/group',
        emoji: '🏠',
        title: 'Family group',
        blurb: 'Share the code, see members, or join another group',
      },
    ],
  },
  {
    title: 'Look and account',
    blurb: 'Colors, the advent preview, and who is signed in.',
    rows: [
      {
        href: '/(app)/settings',
        emoji: '🎨',
        title: 'Themes and sign-in',
        blurb: 'Winter themes, string lights, preview doors, switch people, sign out',
      },
    ],
  },
];

export default function More() {
  const { theme, fonts } = useTheme();
  return (
    <Screen>
      <Title>Settings</Title>
      <Muted>Wishlists, Santa, advent, and the rest of the season live on Home. This tab is the household and how the app looks.</Muted>
      {sections.map((section) => (
        <View key={section.title} style={{ gap: 8 }}>
          <Heading>{section.title}</Heading>
          <Muted>{section.blurb}</Muted>
          {section.rows.map((row) => (
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
        </View>
      ))}
    </Screen>
  );
}
