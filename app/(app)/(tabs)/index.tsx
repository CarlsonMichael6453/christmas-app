import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useApp } from '@/src/backend/AppState';
import { Avatar, Button, Card, Heading, Muted, Row, Screen, Title } from '@/src/components/ui';
import { christmasCountdown } from '@/src/logic/countdown';
import { shareText, tap } from '@/src/logic/feedback';
import { useTheme } from '@/src/theme/ThemeProvider';

const links: { href: string; emoji: string; title: string; blurb: string }[] = [
  { href: '/(app)/(tabs)/wishes', emoji: '🎁', title: 'Wishlists', blurb: 'What everyone hopes for' },
  { href: '/(app)/(tabs)/santa', emoji: '🎅', title: 'Secret Santa', blurb: 'Draw names in private' },
  { href: '/(app)/(tabs)/advent', emoji: '📅', title: 'Advent', blurb: '24 doors' },
  { href: '/(app)/budget', emoji: '🪙', title: 'Budget', blurb: 'What you have spent' },
  { href: '/(app)/letters', emoji: '✉️', title: 'Letters', blurb: 'Notes to Santa' },
  { href: '/(app)/sweaters', emoji: '🧥', title: 'Sweaters', blurb: 'Make one and vote' },
  { href: '/(app)/lights', emoji: '💡', title: 'Lights', blurb: 'Displays worth a drive' },
  { href: '/(app)/cookies', emoji: '🍪', title: 'Cookies', blurb: 'Who is baking what' },
  { href: '/(app)/cards', emoji: '💌', title: 'Cards', blurb: 'Sent and thank-yous' },
  { href: '/(app)/bingo', emoji: '🎬', title: 'Movie bingo', blurb: 'Mark the tropes' },
  { href: '/(app)/party', emoji: '🎲', title: 'Party', blurb: 'White elephant and hot potato' },
  { href: '/(app)/games/catch', emoji: '❄️', title: 'Snow catch', blurb: 'A one-minute game' },
  { href: '/(app)/games/match', emoji: '🎀', title: 'Ornament match', blurb: 'A memory game' },
  { href: '/(app)/resolutions', emoji: '🌟', title: 'New Year', blurb: 'Shared goals' },
];

export default function Home() {
  const { user, group, members, mode } = useApp();
  const { theme, fonts } = useTheme();
  const { width } = useWindowDimensions();
  const [now, setNow] = useState(() => new Date());
  const countdown = christmasCountdown(now);
  const tileWidth = width > 720 ? '31%' : '48%';

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = now.getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Screen>
      <Muted>{hello}</Muted>
      <Title>{user?.displayName ?? 'Family'}</Title>
      <LinearGradient
        colors={theme.colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 18, gap: 8 }}
      >
        <Text style={{ color: theme.colors.onPrimary, fontFamily: fonts.semibold, opacity: 0.9 }}>
          {countdown.isChristmas ? 'It is Christmas Day' : 'Until Christmas'}
        </Text>
        {countdown.isChristmas ? (
          <Text style={{ color: theme.colors.onPrimary, fontFamily: fonts.display, fontSize: 40 }}>Merry Christmas</Text>
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Count label="Days" value={countdown.days} />
            <Count label="Hours" value={countdown.hours} />
            <Count label="Min" value={countdown.minutes} />
            <Count label="Sec" value={countdown.seconds} />
          </View>
        )}
        <Text style={{ color: theme.colors.onPrimary, fontFamily: fonts.regular, opacity: 0.85 }}>December 25</Text>
      </LinearGradient>

      {group ? (
        <Card>
          <Row>
            <View style={{ flex: 1 }}>
              <Heading>{group.name}</Heading>
              <Muted>Join code {group.joinCode}</Muted>
            </View>
            <Button
              label="Share"
              tone="ghost"
              onPress={() => {
                void tap();
                void shareText(
                  `Join our Christmas group "${group.name}" in Christmas Family.\n\nJoin code: ${group.joinCode}\n\nOpen the app, choose Join, and enter the code.`,
                );
              }}
            />
          </Row>
          <Row>
            {members.slice(0, 6).map((member) => (
              <Avatar key={member.id} name={member.displayName} />
            ))}
            <Pressable onPress={() => router.push('/(app)/group')}>
              <Muted>{members.length} {members.length === 1 ? 'person' : 'people'}</Muted>
            </Pressable>
          </Row>
        </Card>
      ) : (
        <Card>
          <Heading>No group yet</Heading>
          <Muted>Create the Carlson family, or join one with a code.</Muted>
          <Button label="Create or join" onPress={() => router.push('/(app)/group')} />
        </Card>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {links.map((link) => (
          <Pressable
            key={link.href}
            onPress={() => {
              void tap();
              router.push(link.href as never);
            }}
            style={{
              width: tileWidth,
              backgroundColor: theme.colors.card,
              borderRadius: 18,
              padding: 14,
              borderWidth: 1,
              borderColor: theme.colors.border,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 22 }}>{link.emoji}</Text>
            <Text style={{ color: theme.colors.text, fontFamily: fonts.bold, fontSize: 15 }}>{link.title}</Text>
            <Text style={{ color: theme.colors.textMuted, fontFamily: fonts.regular, fontSize: 12 }}>{link.blurb}</Text>
          </Pressable>
        ))}
      </View>
      <Muted>
        {mode === 'supabase'
          ? 'Changes sync to everyone signed into this Supabase project.'
          : 'Demo mode keeps the family on this phone. Switch people in Settings to try a second set of eyes.'}
      </Muted>
    </Screen>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  const { fonts } = useTheme();
  return (
    <View style={{ alignItems: 'center', minWidth: 64 }}>
      <Text style={{ color: '#fff', fontFamily: fonts.display, fontSize: 36 }}>{value}</Text>
      <Text style={{ color: '#fff', fontFamily: fonts.semibold, opacity: 0.85 }}>{label}</Text>
    </View>
  );
}
