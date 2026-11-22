import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { Avatar, BackButton, Button, Card, Field, Heading, Muted, Row, Screen, Title } from '@/src/components/ui';
import { shareText } from '@/src/logic/feedback';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function GroupScreen() {
  const { group, groups, members, user, createGroup, joinGroup, selectGroup } = useApp();
  const { theme, fonts } = useTheme();
  const [name, setName] = useState('Carlson Family');
  const [code, setCode] = useState('');

  return (
    <Screen>
      <BackButton />
      <Title>Your group</Title>
      {group ? (
        <Card>
          <Heading>{group.name}</Heading>
          <Muted>Share this code. Anyone with the app can join.</Muted>
          <Text style={{ color: theme.colors.primary, fontFamily: fonts.black, fontSize: 32, letterSpacing: 4 }}>
            {group.joinCode}
          </Text>
          <Button
            label="Share the code"
            onPress={() =>
              void shareText(
                `Join "${group.name}" in Christmas Family. Code: ${group.joinCode}`,
              )
            }
          />
          {members.map((member) => (
            <Row key={member.id}>
              <Avatar name={member.displayName} />
              <Text style={{ color: theme.colors.text, fontFamily: fonts.semibold, flex: 1 }}>
                {member.displayName}
                {member.id === user?.id ? ' · you' : ''}
                {member.id === group.ownerId ? ' · started the group' : ''}
              </Text>
            </Row>
          ))}
        </Card>
      ) : (
        <Muted>You are not in a group yet.</Muted>
      )}
      {groups.length > 1 ? (
        <Card>
          <Heading>Switch group</Heading>
          {groups.map((entry) => (
            <Pressable key={entry.id} onPress={() => void selectGroup(entry.id)}>
              <Text style={{ color: entry.id === group?.id ? theme.colors.primary : theme.colors.text, fontFamily: fonts.semibold }}>
                {entry.name}
              </Text>
            </Pressable>
          ))}
        </Card>
      ) : null}
      <Card>
        <Heading>Create another</Heading>
        <Field label="Group name" value={name} onChangeText={setName} />
        <Button label="Create group" onPress={() => void createGroup(name)} />
      </Card>
      <Card>
        <Heading>Join with a code</Heading>
        <Field label="Code" value={code} onChangeText={setCode} placeholder="CARL26" />
        <Button label="Join" tone="secondary" onPress={() => void joinGroup(code)} />
      </Card>
    </Screen>
  );
}
