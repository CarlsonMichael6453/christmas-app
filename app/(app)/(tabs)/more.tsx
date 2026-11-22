import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { LightPreview } from '@/src/components/StringLights';
import { Avatar, Button, Card, Field, Heading, Muted, Row, Screen, Title } from '@/src/components/ui';
import { shareText } from '@/src/logic/feedback';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function More() {
  const app = useApp();
  const { theme, themes, setTheme, lights, lightOptions, setLights, snow, setSnow, fonts } = useTheme();
  const [name, setName] = useState(app.user?.displayName ?? '');
  const [groupName, setGroupName] = useState('Carlson Family');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    setName(app.user?.displayName ?? '');
  }, [app.user?.id, app.user?.displayName]);

  return (
    <Screen>
      <Title>Settings</Title>
      <Muted>The household, the look of the app, and who is signed in. Everything else is on Home.</Muted>

      <Heading>The household</Heading>
      {app.group ? (
        <Card>
          <Heading>{app.group.name}</Heading>
          <Muted>Share this code. Anyone with the app can join.</Muted>
          <Text style={{ color: theme.colors.primary, fontFamily: fonts.black, fontSize: 32, letterSpacing: 4 }}>
            {app.group.joinCode}
          </Text>
          <Button
            label="Share the code"
            onPress={() => void shareText(`Join "${app.group?.name}" in Christmas Family. Code: ${app.group?.joinCode}`)}
          />
          {app.members.map((member) => (
            <Row key={member.id}>
              <Avatar name={member.displayName} />
              <Text style={{ color: theme.colors.text, fontFamily: fonts.semibold, flex: 1 }}>
                {member.displayName}
                {member.id === app.user?.id ? ' · you' : ''}
                {member.id === app.group?.ownerId ? ' · started the group' : ''}
              </Text>
            </Row>
          ))}
        </Card>
      ) : (
        <Muted>You are not in a group yet.</Muted>
      )}
      {app.groups.length > 1 ? (
        <Card>
          <Heading>Switch group</Heading>
          {app.groups.map((entry) => (
            <Pressable key={entry.id} onPress={() => void app.selectGroup(entry.id)}>
              <Text
                style={{
                  color: entry.id === app.group?.id ? theme.colors.primary : theme.colors.text,
                  fontFamily: fonts.semibold,
                  paddingVertical: 6,
                }}
              >
                {entry.name}
              </Text>
            </Pressable>
          ))}
        </Card>
      ) : null}
      <Card>
        <Heading>Create another</Heading>
        <Field label="Group name" value={groupName} onChangeText={setGroupName} />
        <Button label="Create group" onPress={() => void app.createGroup(groupName)} />
      </Card>
      <Card>
        <Heading>Join with a code</Heading>
        <Field label="Code" value={joinCode} onChangeText={setJoinCode} placeholder="CARL26" />
        <Button label="Join" tone="secondary" onPress={() => void app.joinGroup(joinCode)} />
      </Card>

      <Heading>How it looks</Heading>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Heading>Preview advent doors</Heading>
            <Muted>Open all 24 before December, for testing or reading ahead.</Muted>
          </View>
          <Switch
            accessibilityLabel="Preview advent doors"
            value={app.previewAdvent}
            onValueChange={(value) => void app.setPreviewAdvent(value)}
            trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
          />
        </View>
      </Card>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Heading>Falling snow</Heading>
            <Muted>Keeps drifting while you change screens. Turn it off for a clear view.</Muted>
          </View>
          <Switch
            accessibilityLabel="Falling snow"
            value={snow}
            onValueChange={setSnow}
            trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
          />
        </View>
      </Card>
      <Heading>String lights</Heading>
      <Muted>A garland across the top of the app. None turns it off.</Muted>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {lightOptions.map((option) => {
          const selected = option.id === lights.id;
          return (
            <Pressable
              key={option.id}
              accessibilityLabel={option.name}
              onPress={() => setLights(option.id)}
              style={{
                width: '48%',
                backgroundColor: theme.colors.card,
                borderRadius: 16,
                padding: 10,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? theme.colors.primary : theme.colors.border,
                gap: 6,
              }}
            >
              <View style={{ height: 36, borderRadius: 10, overflow: 'hidden', backgroundColor: theme.colors.bg }}>
                <LightPreview id={option.id} width={150} />
              </View>
              <Text style={{ color: theme.colors.text, fontFamily: fonts.bold, fontSize: 14 }}>{option.name}</Text>
            </Pressable>
          );
        })}
      </View>
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

      <Heading>Your account</Heading>
      <Card>
        <Heading>Your name</Heading>
        <Field label="Display name" value={name} onChangeText={setName} />
        <Button label="Save name" tone="ghost" onPress={() => void app.updateName(name)} />
      </Card>
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
      ) : (
        <Muted>
          {app.mode === 'supabase'
            ? 'Signed in through Supabase. Gift claims and Secret Santa slips follow the database rules.'
            : 'This device is the whole backend.'}
        </Muted>
      )}
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
