import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { BackButton, Button, Card, Field, GroupPrompt, Heading, Muted, Screen, Title } from '@/src/components/ui';
import { uid } from '@/src/logic/format';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function Resolutions() {
  const { resolutions, group, user, saveResolution, deleteResolution, setProgress, cheer, nameOf } = useApp();
  const { theme, fonts } = useTheme();
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [shared, setShared] = useState(true);
  if (!group || !user) {
    return (
      <Screen>
        <BackButton />
        <GroupPrompt />
      </Screen>
    );
  }
  return (
    <Screen>
      <BackButton />
      <Title>New Year</Title>
      <Muted>Keep a private goal, or share one the family can cheer.</Muted>
      {resolutions.map((resolution) => (
        <Card key={resolution.id}>
          <Heading>{resolution.title}</Heading>
          <Muted>
            {nameOf(resolution.authorId)} · {resolution.shared ? 'shared' : 'just you'}
          </Muted>
          {resolution.details ? <Muted>{resolution.details}</Muted> : null}
          <View style={{ height: 10, borderRadius: 8, backgroundColor: theme.colors.surfaceAlt, overflow: 'hidden' }}>
            <View style={{ width: `${resolution.progress}%`, height: 10, backgroundColor: theme.colors.secondary }} />
          </View>
          <Text style={{ color: theme.colors.text, fontFamily: fonts.bold }}>{resolution.progress}%</Text>
          {resolution.authorId === user.id ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Button label="-10" tone="ghost" onPress={() => void setProgress(resolution.id, resolution.progress - 10)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="+10" onPress={() => void setProgress(resolution.id, resolution.progress + 10)} />
              </View>
            </View>
          ) : null}
          {resolution.shared ? (
            <Pressable onPress={() => void cheer(resolution.id)}>
              <Text style={{ color: theme.colors.primary, fontFamily: fonts.bold }}>
                {resolution.cheerIds.includes(user.id) ? 'Cheering' : 'Cheer'} · {resolution.cheerIds.length}
              </Text>
            </Pressable>
          ) : null}
          {resolution.authorId === user.id ? (
            <Button label="Remove" tone="ghost" onPress={() => void deleteResolution(resolution.id)} />
          ) : null}
        </Card>
      ))}
      <Card>
        <Field label="The goal" value={title} onChangeText={setTitle} placeholder="A walk after dinner" />
        <Field label="Details" value={details} onChangeText={setDetails} multiline />
        <Button label={shared ? 'Shared with the group' : 'Only me'} tone="ghost" onPress={() => setShared((value) => !value)} />
        <Button
          label="Add resolution"
          onPress={() =>
            void saveResolution({
              id: uid(),
              groupId: group.id,
              authorId: user.id,
              title,
              details,
              shared,
              progress: 0,
              cheerIds: [],
            }).then((ok) => {
              if (!ok) return;
              setTitle('');
              setDetails('');
            })
          }
        />
      </Card>
    </Screen>
  );
}
