import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { useApp } from '@/src/backend/AppState';
import { Button, Card, Field, Muted, Screen, Title } from '@/src/components/ui';
import { tap } from '@/src/logic/feedback';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function SignIn() {
  const { user, ready, mode, signInName, signInEmail, loadDemo } = useApp();
  const { theme, fonts } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (ready && user) return <Redirect href="/(app)/(tabs)" />;

  async function enter() {
    setBusy(true);
    const ok = email.trim()
      ? await signInEmail(email, password, name || undefined)
      : await signInName(name);
    setBusy(false);
    if (ok) await tap('success');
  }

  return (
    <Screen>
      <Text style={{ fontSize: 42 }}>🎄</Text>
      <Title>Christmas Family</Title>
      <Muted>
        {mode === 'supabase'
          ? 'This phone is connected to your Supabase project. Sign in and the family stays in sync.'
          : 'No account setup yet. Pick a name and everything stays on this phone until you add Supabase.'}
      </Muted>
      <Card>
        <Field label="Your name" value={name} onChangeText={setName} placeholder="Michael" />
        <Field
          label="Email, if you want a password"
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          keyboardType="email-address"
        />
        {email.trim() ? (
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 6 characters" />
        ) : null}
        <Button label={busy ? 'One moment…' : 'Come on in'} onPress={() => void enter()} disabled={busy || name.trim().length < 2} />
      </Card>
      {mode === 'phone' ? (
        <Card>
          <Text style={{ color: theme.colors.text, fontFamily: fonts.bold, fontSize: 16 }}>Try the Carlson family</Text>
          <Muted>
            Loads Michael, Emma, Lily, and Noah with wishlists, a hidden gift, and a Secret Santa that still needs drawing. You can switch people in Settings.
          </Muted>
          <Button
            label="Load the demo"
            tone="secondary"
            onPress={() => {
              void loadDemo();
            }}
          />
        </Card>
      ) : null}
      <View />
    </Screen>
  );
}
