import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { DrawingPad } from '@/src/components/DrawingPad';
import { DEFAULT_PAPER_ID, LETTER_PAPERS, LetterPaperBackdrop, findPaper } from '@/src/components/LetterPaper';
import { Button, Card, Field, Muted, Screen, Title } from '@/src/components/ui';
import { BRUSH_SIZES, PENCIL_COLORS } from '@/src/logic/drawing';
import { uid } from '@/src/logic/format';
import type { Stroke } from '@/src/model/types';

export default function LetterEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { letters, user, group, saveLetter } = useApp();
  const existing = letters.find((letter) => letter.id === id);
  const [title, setTitle] = useState(existing?.title ?? 'Dear Santa');
  const [body, setBody] = useState(existing?.body ?? '');
  const [strokes, setStrokes] = useState<Stroke[]>(existing?.strokes ?? []);
  const [paperId, setPaperId] = useState(existing?.paper ?? DEFAULT_PAPER_ID);
  const [color, setColor] = useState<string>(PENCIL_COLORS[0]);
  const [brush, setBrush] = useState<number>(BRUSH_SIZES[2]);
  const [erasing, setErasing] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const undone = useRef<Stroke[]>([]);
  const paper = findPaper(paperId);

  useEffect(() => {
    if (Platform.OS !== 'web' || !drawing) return;
    const root = document.documentElement;
    const previousBody = document.body.style.overscrollBehavior;
    const previousRoot = root.style.overscrollBehavior;
    document.body.style.overscrollBehavior = 'none';
    root.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overscrollBehavior = previousBody;
      root.style.overscrollBehavior = previousRoot;
    };
  }, [drawing]);

  if (!user || !group) return null;

  function addStroke(next: Stroke[]) {
    undone.current = [];
    setStrokes(next);
  }

  function undo() {
    setStrokes((current) => {
      const last = current[current.length - 1];
      if (!last) return current;
      undone.current.push(last);
      return current.slice(0, -1);
    });
  }

  function redo() {
    const stroke = undone.current.pop();
    if (!stroke) return;
    setStrokes((current) => [...current, stroke]);
  }

  function clearDrawing() {
    undone.current = [];
    setStrokes([]);
  }

  async function save() {
    const ok = await saveLetter({
      id: existing?.id ?? uid(),
      groupId: group!.id,
      authorId: existing?.authorId ?? user!.id,
      title,
      body,
      strokes,
      paper: paperId,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    if (ok) router.back();
  }

  return (
    <Screen scrollEnabled={!drawing}>
      <Title>{existing ? 'Edit letter' : 'New letter'}</Title>
      <Muted>Paper</Muted>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
        {LETTER_PAPERS.map((entry) => {
          const selected = entry.id === paperId;
          return (
            <Pressable key={entry.id} onPress={() => setPaperId(entry.id)} style={{ width: 92, gap: 4 }}>
              <View
                style={{
                  height: 56,
                  borderRadius: 12,
                  overflow: 'hidden',
                  borderWidth: selected ? 3 : 1,
                  borderColor: selected ? '#8E1B2C' : '#D9CBB8',
                }}
              >
                <LetterPaperBackdrop id={entry.id} width={92} height={56} />
              </View>
              <Text style={{ fontSize: 11, color: '#2A1814' }} numberOfLines={1}>
                {entry.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <DrawingPad
        strokes={strokes}
        paperId={paper.id}
        color={color}
        width={brush}
        erasing={erasing}
        onChange={addStroke}
        onDrawingChange={setDrawing}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {PENCIL_COLORS.map((swatch) => {
          const selected = !erasing && color === swatch;
          return (
            <Pressable
              key={swatch}
              accessibilityLabel={swatch}
              onPress={() => {
                setErasing(false);
                setColor(swatch);
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: swatch,
                borderWidth: selected ? 3 : 1,
                borderColor: selected ? '#1C1C1C' : '#D9CBB8',
              }}
            />
          );
        })}
        <Pressable
          accessibilityLabel="Eraser"
          onPress={() => setErasing(true)}
          style={{
            height: 32,
            paddingHorizontal: 10,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: erasing ? '#1C1C1C' : '#F7F1E8',
            borderWidth: 1,
            borderColor: '#1C1C1C',
          }}
        >
          <Text style={{ color: erasing ? '#fff' : '#1C1C1C', fontSize: 13 }}>Eraser</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, minHeight: 48 }}>
        {BRUSH_SIZES.map((size) => {
          const selected = brush === size;
          const preview = Math.max(4, Math.min(size, 28));
          return (
            <Pressable
              key={size}
              accessibilityLabel={`Size ${size}`}
              onPress={() => setBrush(size)}
              style={{
                width: 36,
                height: 44,
                alignItems: 'center',
                justifyContent: 'flex-end',
                borderRadius: 10,
                borderWidth: selected ? 2 : 0,
                borderColor: '#8E1B2C',
              }}
            >
              <View
                style={{
                  width: preview,
                  height: preview,
                  borderRadius: preview / 2,
                  backgroundColor: erasing ? paper.base : color,
                  borderWidth: 1,
                  borderColor: '#1C1C1C',
                }}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button label="Undo" tone="ghost" onPress={undo} disabled={strokes.length === 0} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Redo" tone="ghost" onPress={redo} disabled={undone.current.length === 0} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Clear" tone="ghost" onPress={clearDrawing} disabled={strokes.length === 0} />
        </View>
      </View>
      <Card>
        <Field label="Greeting" value={title} onChangeText={setTitle} />
        <Field label="The letter" value={body} onChangeText={setBody} multiline placeholder="I have been good, mostly." />
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
