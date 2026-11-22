import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/src/backend/AppState';
import { Snow } from '@/src/components/Snow';
import { useTheme } from '@/src/theme/ThemeProvider';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={{
        padding: 16,
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 28,
        gap: 12,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <ErrorNote />
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, padding: 16, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }}>
      <ErrorNote />
      {children}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 560 }}>{body}</View>
      <Snow />
    </View>
  );
}

export function ErrorNote() {
  const { error, clearError } = useApp();
  const { theme, fonts } = useTheme();
  if (!error) return null;
  return (
    <Pressable
      onPress={clearError}
      style={{ backgroundColor: theme.colors.danger, borderRadius: 14, padding: 12 }}
    >
      <Text style={{ color: '#fff', fontFamily: fonts.semibold }}>{error}</Text>
    </Pressable>
  );
}

export function Title({ children }: { children: ReactNode }) {
  const { theme, fonts } = useTheme();
  return (
    <Text style={{ color: theme.colors.text, fontFamily: fonts.display, fontSize: 32, lineHeight: 38 }}>
      {children}
    </Text>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  const { theme, fonts } = useTheme();
  return (
    <Text style={{ color: theme.colors.text, fontFamily: fonts.bold, fontSize: 20 }}>{children}</Text>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  const { theme, fonts } = useTheme();
  return (
    <Text style={{ color: theme.colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 }}>
      {children}
    </Text>
  );
}

export function Card({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 10,
      }}
    >
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  tone = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const { theme, fonts } = useTheme();
  const background =
    tone === 'primary'
      ? theme.colors.primary
      : tone === 'secondary'
        ? theme.colors.secondary
        : tone === 'danger'
          ? theme.colors.danger
          : 'transparent';
  const color =
    tone === 'primary'
      ? theme.colors.onPrimary
      : tone === 'secondary'
        ? theme.colors.onSecondary
        : tone === 'danger'
          ? '#fff'
          : theme.colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: background,
        borderRadius: 16,
        paddingVertical: 13,
        paddingHorizontal: 16,
        alignItems: 'center',
        opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
        borderWidth: tone === 'ghost' ? 1 : 0,
        borderColor: theme.colors.border,
      })}
    >
      <Text style={{ color, fontFamily: fonts.bold, fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  secureTextEntry?: boolean;
}) {
  const { theme, fonts } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: theme.colors.textMuted, fontFamily: fonts.semibold, fontSize: 13 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        style={{
          backgroundColor: theme.colors.input,
          color: theme.colors.text,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 11,
          minHeight: multiline ? 96 : 46,
          fontFamily: fonts.regular,
          fontSize: 16,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

export function Stars({ value, onChange }: { value: number; onChange?: (value: 1 | 2 | 3) => void }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3].map((star) => (
        <Pressable key={star} disabled={!onChange} onPress={() => onChange?.(star as 1 | 2 | 3)} hitSlop={6}>
          <Text style={{ fontSize: 18, color: star <= value ? theme.colors.star : theme.colors.border }}>
            {star <= value ? '★' : '☆'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const { theme, fonts } = useTheme();
  const letter = name.trim().slice(0, 1).toUpperCase() || '?';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: theme.colors.onSecondary, fontFamily: fonts.bold, fontSize: size * 0.42 }}>{letter}</Text>
    </View>
  );
}

export function BackButton() {
  const router = useRouter();
  const { theme, fonts } = useTheme();
  return (
    <Pressable onPress={() => router.back()} hitSlop={10} style={{ alignSelf: 'flex-start' }}>
      <Text style={{ color: theme.colors.primary, fontFamily: fonts.bold, fontSize: 16 }}>‹ Back</Text>
    </Pressable>
  );
}

export function GroupPrompt() {
  const router = useRouter();
  return (
    <Card>
      <Heading>Start with a family</Heading>
      <Muted>Wishlists, Secret Santa, cookies, and the rest all live inside one group.</Muted>
      <Button label="Create or join" onPress={() => router.push('/(app)/group')} />
    </Card>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>{children}</View>;
}
