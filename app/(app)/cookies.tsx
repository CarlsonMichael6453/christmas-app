import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { BackButton, Button, Card, Field, GroupPrompt, Heading, Muted, Screen, Title } from '@/src/components/ui';
import { recipeById, recipes } from '@/src/content/recipes';
import { uid } from '@/src/logic/format';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function Cookies() {
  const { cookies, group, user, saveCookie, deleteCookie, nameOf } = useApp();
  const { theme, fonts } = useTheme();
  const [openId, setOpenId] = useState<string | null>(null);
  const [custom, setCustom] = useState('');
  const [dozens, setDozens] = useState('2');
  const recipe = openId ? recipeById(openId) : undefined;
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
      <Title>Cookie exchange</Title>
      <Muted>Claim a tin so the table is not six plates of the same shortbread.</Muted>
      <Heading>Who is bringing what</Heading>
      {cookies.map((cookie) => (
        <Card key={cookie.id}>
          <Heading>{cookie.name}</Heading>
          <Muted>
            {nameOf(cookie.bakerId)} · {cookie.dozens} dozen
            {cookie.notes ? ` · ${cookie.notes}` : ''}
          </Muted>
          {cookie.bakerId === user.id ? <Button label="I cannot bring these" tone="ghost" onPress={() => void deleteCookie(cookie.id)} /> : null}
        </Card>
      ))}
      {cookies.length === 0 ? <Muted>Nobody has signed up yet.</Muted> : null}
      <Heading>Recipes</Heading>
      {recipes.map((entry) => (
        <Pressable key={entry.id} onPress={() => setOpenId(entry.id === openId ? null : entry.id)}>
          <Card>
            <Heading>{entry.name}</Heading>
            <Muted>
              {entry.blurb} · {entry.time} · {entry.makes}
            </Muted>
          </Card>
        </Pressable>
      ))}
      {recipe ? (
        <Card>
          <Heading>{recipe.name}</Heading>
          {recipe.ingredients.map((line) => (
            <Text key={line} style={{ color: theme.colors.text, fontFamily: fonts.regular }}>
              • {line}
            </Text>
          ))}
          {recipe.steps.map((step, index) => (
            <Text key={step} style={{ color: theme.colors.text, fontFamily: fonts.regular }}>
              {index + 1}. {step}
            </Text>
          ))}
          <Field label="Dozens you will bring" value={dozens} onChangeText={setDozens} keyboardType="number-pad" />
          <Button
            label="I'll bring these"
            onPress={() =>
              void saveCookie({
                id: uid(),
                groupId: group.id,
                bakerId: user.id,
                name: recipe.name,
                recipe: recipe.id,
                dozens: Number(dozens) || 1,
                notes: '',
              })
            }
          />
        </Card>
      ) : null}
      <Card>
        <Heading>Something else</Heading>
        <Field label="Cookie name" value={custom} onChangeText={setCustom} placeholder="Grandma's spritz" />
        <Button
          label="Sign me up"
          tone="secondary"
          onPress={() =>
            void saveCookie({
              id: uid(),
              groupId: group.id,
              bakerId: user.id,
              name: custom,
              recipe: '',
              dozens: Number(dozens) || 1,
              notes: '',
            }).then((ok) => {
              if (ok) setCustom('');
            })
          }
        />
      </Card>
    </Screen>
  );
}
