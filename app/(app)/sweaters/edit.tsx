import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { SweaterView } from '@/src/components/SweaterView';
import { BackButton, Button, Card, Field, Screen, Title } from '@/src/components/ui';
import { uid } from '@/src/logic/format';
import type { SweaterPattern } from '@/src/model/types';
import { useTheme } from '@/src/theme/ThemeProvider';

const bases = ['#8E1B2C', '#1E4D3A', '#F4F1EA', '#1F6F8A', '#6B332C', '#C86B84'];
const patterns: SweaterPattern[] = ['solid', 'stripes', 'dots', 'fairisle', 'trees'];
const decos = ['🎄', '⭐', '🦌', '❄️', '🔔', '🎁', '🧦', '🕯️'];

export default function SweaterEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { sweaters, saveSweater, deleteSweater, user, group } = useApp();
  const { theme, fonts } = useTheme();
  const existing = sweaters.find((sweater) => sweater.id === id);
  const [name, setName] = useState(existing?.name ?? 'My sweater');
  const [base, setBase] = useState(existing?.base ?? bases[0]!);
  const [pattern, setPattern] = useState<SweaterPattern>(existing?.pattern ?? 'stripes');
  const [patternColor, setPatternColor] = useState(existing?.patternColor ?? '#C4A265');
  const [collar, setCollar] = useState(existing?.collar ?? '#F4F1EA');
  const [deco, setDeco] = useState(existing?.deco ?? '🎄');

  if (!user || !group) return null;
  const familyId = group.id;
  const personId = user.id;
  const draft = { base, pattern, patternColor, collar, deco };

  async function save() {
    const ok = await saveSweater({
      id: existing?.id ?? uid(),
      groupId: familyId,
      designerId: existing?.designerId ?? personId,
      name,
      base,
      pattern,
      patternColor,
      collar,
      deco,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    if (ok) router.back();
  }

  return (
    <Screen>
      <BackButton />
      <Title>Sweater shop</Title>
      <View style={{ alignItems: 'center' }}>
        <SweaterView sweater={draft} size={190} />
      </View>
      <Card>
        <Field label="Name" value={name} onChangeText={setName} />
        <Text style={{ color: theme.colors.textMuted, fontFamily: fonts.semibold }}>Body</Text>
        <Swatches colors={bases} selected={base} onPick={setBase} />
        <Text style={{ color: theme.colors.textMuted, fontFamily: fonts.semibold }}>Pattern</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {patterns.map((entry) => (
            <Pressable
              key={entry}
              onPress={() => setPattern(entry)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: pattern === entry ? theme.colors.primary : theme.colors.surfaceAlt,
              }}
            >
              <Text style={{ color: pattern === entry ? theme.colors.onPrimary : theme.colors.text, fontFamily: fonts.semibold }}>
                {entry}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ color: theme.colors.textMuted, fontFamily: fonts.semibold }}>Pattern color</Text>
        <Swatches colors={['#C4A265', '#F4F1EA', '#8E1B2C', '#1E4D3A', '#E36CA6', '#7B6CFF']} selected={patternColor} onPick={setPatternColor} />
        <Text style={{ color: theme.colors.textMuted, fontFamily: fonts.semibold }}>Collar</Text>
        <Swatches colors={['#F4F1EA', '#8E1B2C', '#1E4D3A', '#C4A265']} selected={collar} onPick={setCollar} />
        <Text style={{ color: theme.colors.textMuted, fontFamily: fonts.semibold }}>Decoration</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {decos.map((entry) => (
            <Pressable key={entry} onPress={() => setDeco(entry)} style={{ padding: 6 }}>
              <Text style={{ fontSize: deco === entry ? 32 : 24 }}>{entry}</Text>
            </Pressable>
          ))}
        </View>
        <Button label="Save sweater" onPress={() => void save()} />
        {existing && existing.designerId === personId ? (
          <Button
            label="Delete"
            tone="danger"
            onPress={() => {
              void deleteSweater(existing.id).then((ok) => {
                if (ok) router.back();
              });
            }}
          />
        ) : null}
      </Card>
    </Screen>
  );
}

function Swatches({ colors, selected, onPick }: { colors: string[]; selected: string; onPick: (color: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {colors.map((color) => (
        <Pressable
          key={color}
          onPress={() => onPick(color)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: color,
            borderWidth: selected === color ? 3 : 1,
            borderColor: selected === color ? '#fff' : 'rgba(0,0,0,0.15)',
          }}
        />
      ))}
    </View>
  );
}
