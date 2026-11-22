import { useState } from 'react';

import { useApp } from '@/src/backend/AppState';
import { BackButton, Button, Card, Field, GroupPrompt, Heading, Muted, Screen, Title } from '@/src/components/ui';
import { uid } from '@/src/logic/format';

export default function Lights() {
  const { lights, group, user, saveLight, deleteLight, nameOf } = useApp();
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('');
  const [bestNight, setBestNight] = useState('After dark');
  const [notes, setNotes] = useState('');
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
      <Title>Light map</Title>
      <Muted>A list of displays worth the drive. Pins stay in the group, no map account required.</Muted>
      {lights.map((light) => (
        <Card key={light.id}>
          <Heading>📍 {light.title}</Heading>
          <Muted>
            {light.area} · {light.bestNight} · added by {nameOf(light.userId)}
          </Muted>
          {light.notes ? <Muted>{light.notes}</Muted> : null}
          {light.userId === user.id ? <Button label="Remove" tone="ghost" onPress={() => void deleteLight(light.id)} /> : null}
        </Card>
      ))}
      <Card>
        <Heading>Add a display</Heading>
        <Field label="Name" value={title} onChangeText={setTitle} placeholder="Reindeer on the roof" />
        <Field label="Neighborhood" value={area} onChangeText={setArea} placeholder="Oak Street" />
        <Field label="Best time" value={bestNight} onChangeText={setBestNight} />
        <Field label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Music starts at 6." />
        <Button
          label="Pin it"
          onPress={() => {
            void saveLight({
              id: uid(),
              groupId: group.id,
              userId: user.id,
              title,
              area,
              notes,
              bestNight,
              createdAt: new Date().toISOString(),
            }).then((ok) => {
              if (!ok) return;
              setTitle('');
              setArea('');
              setNotes('');
            });
          }}
        />
      </Card>
    </Screen>
  );
}
