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

  const emailOn = email.trim().length > 0;
  const canEnter = name.trim().length >= 2 && (!emailOn || password.length >= 6);

  async function enter() {
    setBusy(true);
    const ok = emailOn ? await signInEmail(email, password, name || undefined) : await signInName(name);
    setBusy(false);
    if (ok) await tap('success');
  }

  return (
    <Screen>
      <Text style={{ fontSize: 42 }}>🎄</Text>
      <Title>Christmas Family</Title>
      <Muted>
        {mode === 'supabase'
          ? 'The family database is connected. Sign in with your name, or add an email and password so you can come back as the same person.'
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
        {emailOn ? (
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 6 characters" />
        ) : (
          <Muted>Leave email blank to sign in with just your name.</Muted>
        )}
        <Button label={busy ? 'One moment…' : 'Come on in'} onPress={() => void enter()} disabled={busy || !canEnter} />
      </Card>
      <Card>
        <Text style={{ color: theme.colors.text, fontFamily: fonts.bold, fontSize: 16 }}>Try the Carlson family</Text>
        <Muted>
          {mode === 'supabase'
            ? 'Stays in this browser only. Michael, Emma, Lily, and Noah come with wishlists and a Secret Santa that still needs drawing. Nothing is written to the shared database.'
            : 'Loads Michael, Emma, Lily, and Noah with wishlists, a hidden gift, and a Secret Santa that still needs drawing. You can switch people in Settings.'}
        </Muted>
        <Button
          label="Load the demo"
          tone="secondary"
          onPress={() => {
            void loadDemo();
          }}
        />
      </Card>
      <View />
    </Screen>
  );
}
