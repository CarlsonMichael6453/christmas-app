import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { useApp } from '@/src/backend/AppState';
import { BackButton, Button, Card, Field, Screen, Stars, Title } from '@/src/components/ui';
import type { ItemInput } from '@/src/model/types';

export default function EditItem() {
  const { id, title: starter } = useLocalSearchParams<{ id?: string; title?: string }>();
  const { items, addItem, updateItem } = useApp();
  const existing = items.find((item) => item.id === id);
  const [title, setTitle] = useState(existing?.title ?? (typeof starter === 'string' ? starter : ''));
  const [link, setLink] = useState(existing?.link ?? '');
  const [price, setPrice] = useState(existing?.price != null ? String(existing.price) : '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [priority, setPriority] = useState<1 | 2 | 3>(existing?.priority ?? 2);

  async function save() {
    const input: ItemInput = {
      title,
      link,
      notes,
      priority,
      price: price.trim() ? Number(price) : null,
    };
    const ok = existing ? await updateItem(existing.id, input) : await addItem(input);
    if (ok) router.back();
  }

  return (
    <Screen>
      <BackButton />
      <Title>{existing ? 'Edit wish' : 'New wish'}</Title>
      <Card>
        <Field label="What is it?" value={title} onChangeText={setTitle} placeholder="Wool socks" />
        <Field label="Link" value={link} onChangeText={setLink} placeholder="https://" keyboardType="url" />
        <Field label="Price" value={price} onChangeText={setPrice} placeholder="18" keyboardType="decimal-pad" />
        <Field label="Size, color, notes" value={notes} onChangeText={setNotes} placeholder="Size L, charcoal" multiline />
        <Stars value={priority} onChange={setPriority} />
        <Button label="Save" onPress={() => void save()} />
      </Card>
    </Screen>
  );
}
