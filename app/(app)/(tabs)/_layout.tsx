import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/src/theme/ThemeProvider';

export default function TabLayout() {
  const { theme, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.border,
          height: 74 + bottom,
          paddingBottom: bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={typeof color === 'string' ? color : theme.colors.primary} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishes"
        options={{
          title: 'Wishes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="gift" color={typeof color === 'string' ? color : theme.colors.primary} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="santa"
        options={{
          title: 'Santa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles" color={typeof color === 'string' ? color : theme.colors.primary} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="advent"
        options={{
          title: 'Advent',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" color={typeof color === 'string' ? color : theme.colors.primary} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" color={typeof color === 'string' ? color : theme.colors.primary} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
