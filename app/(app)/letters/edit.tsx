import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { PanResponder, Pressable, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { useApp } from '@/src/backend/AppState';
import { BackButton, Button, Card, Field, Screen, Title } from '@/src/components/ui';
import { uid } from '@/src/logic/format';
import type { Stroke } from '@/src/model/types';

const colors = ['#8E1B2C', '#1E4D3A', '#C4A265', '#1F6F8A', '#2A1814'];

export default function LetterEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { letters, user, group, saveLetter } = useApp();
  const existing = letters.find((letter) => letter.id === id);
  const [title, setTitle] = useState(existing?.title ?? 'Dear Santa');
  const [body, setBody] = useState(existing?.body ?? '');
  const [strokes, setStrokes] = useState<Stroke[]>(existing?.strokes ?? []);
  const [color, setColor] = useState(colors[0]!);
  const colorRef = useRef(colors[0]!);
  colorRef.current = color;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event: { nativeEvent: { locationX: number; locationY: number } }) => {
        const point = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
        setStrokes((current) => [...current, { color: colorRef.current, points: [point] }]);
      },
      onPanResponderMove: (event: { nativeEvent: { locationX: number; locationY: number } }) => {
        const point = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
        setStrokes((current) => {
          if (current.length === 0) return current;
          const next = current.slice();
          const last = next[next.length - 1]!;
          next[next.length - 1] = { ...last, points: [...last.points, point] };
          return next;
        });
      },
    }),
  ).current;

  if (!user || !group) return null;

  async function save() {
    const ok = await saveLetter({
      id: existing?.id ?? uid(),
      groupId: group!.id,
      authorId: existing?.authorId ?? user!.id,
      title,
      body,
      strokes,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    if (ok) router.back();
  }

  return (
    <Screen>
      <BackButton />
      <Title>{existing ? 'Edit letter' : 'New letter'}</Title>
      <Card>
        <Field label="Greeting" value={title} onChangeText={setTitle} />
        <Field label="The letter" value={body} onChangeText={setBody} multiline placeholder="I have been good, mostly." />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {colors.map((swatch) => (
            <Pressable
              key={swatch}
              onPress={() => setColor(swatch)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: swatch,
                borderWidth: color === swatch ? 3 : 0,
                borderColor: '#fff',
              }}
            />
          ))}
        </View>
        <View
          {...responder.panHandlers}
          style={{ height: 220, borderRadius: 16, backgroundColor: '#fff', overflow: 'hidden' }}
        >
          <Svg width="100%" height="100%">
            {strokes.map((stroke, index) => (
              <Polyline
                key={`${index}-${stroke.points.length}`}
                points={stroke.points.map((point) => `${point.x},${point.y}`).join(' ')}
                fill="none"
                stroke={stroke.color}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </Svg>
        </View>
        <Button label="Clear drawing" tone="ghost" onPress={() => setStrokes([])} />
        <Button label="Save letter" onPress={() => void save()} />
        {body.trim() ? (
          <Button
            label="Turn the first line into a wish"
            tone="secondary"
            onPress={() => router.push(`/(app)/item/edit?title=${encodeURIComponent(body.split('\n')[0]?.slice(0, 80) ?? '')}`)}
          />
        ) : null}
      </Card>
    </Screen>
  );
}
