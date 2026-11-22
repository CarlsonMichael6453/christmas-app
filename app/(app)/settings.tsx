import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { BackButton, Button, Card, Field, Heading, Muted, Screen, Title } from '@/src/components/ui';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function Settings() {
  const app = useApp();
  const { theme, themes, setTheme, fonts } = useTheme();
  const [name, setName] = useState(app.user?.displayName ?? '');

  return (
    <Screen>
      <BackButton />
      <Title>Settings</Title>
      <Muted>
        {app.mode === 'supabase'
          ? 'Signed in through Supabase. Gift claims and Secret Santa slips follow the database rules.'
          : 'This phone is the whole backend. Switch family members here to see what someone else is allowed to see.'}
      </Muted>
      <Card>
        <Heading>Your name</Heading>
        <Field label="Display name" value={name} onChangeText={setName} />
        <Button label="Save name" tone="ghost" onPress={() => void app.updateName(name)} />
      </Card>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Heading>Preview advent doors</Heading>
            <Muted>Open all 24 before December, for testing or reading ahead.</Muted>
          </View>
          <Switch
            value={app.previewAdvent}
            onValueChange={(value) => void app.setPreviewAdvent(value)}
            trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
          />
        </View>
      </Card>
      <Heading>Color themes</Heading>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {themes.map((entry) => {
          const selected = entry.id === theme.id;
          return (
            <Pressable
              key={entry.id}
              onPress={() => setTheme(entry.id)}
              style={{
                width: '48%',
                backgroundColor: theme.colors.card,
                borderRadius: 16,
                padding: 12,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? theme.colors.primary : theme.colors.border,
                gap: 6,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {entry.swatches.map((swatch) => (
                  <View key={swatch} style={{ flex: 1, height: 22, borderRadius: 8, backgroundColor: swatch }} />
                ))}
              </View>
              <Text style={{ color: theme.colors.text, fontFamily: fonts.bold }}>{entry.name}</Text>
              <Text style={{ color: theme.colors.textMuted, fontFamily: fonts.regular, fontSize: 12 }}>{entry.description}</Text>
            </Pressable>
          );
        })}
      </View>
      {app.mode === 'phone' && app.localUsers.length > 0 ? (
        <Card>
          <Heading>People on this phone</Heading>
          <Muted>Tap a name to see the app as they do. Hidden gifts stay hidden for the person they belong to.</Muted>
          {app.localUsers.map((person) => (
            <Pressable key={person.id} onPress={() => void app.switchUser(person.id)}>
              <Text
                style={{
                  color: person.id === app.user?.id ? theme.colors.primary : theme.colors.text,
                  fontFamily: fonts.semibold,
                  paddingVertical: 6,
                }}
              >
                {person.displayName}
                {person.id === app.user?.id ? ' · viewing now' : ''}
              </Text>
            </Pressable>
          ))}
          <Button label="Load the Carlson demo again" tone="ghost" onPress={() => void app.loadDemo()} />
        </Card>
      ) : null}
      <Button
        label="Sign out"
        tone="danger"
        onPress={() => {
          void app.signOut().then(() => router.replace('/sign-in'));
        }}
      />
    </Screen>
  );
}
