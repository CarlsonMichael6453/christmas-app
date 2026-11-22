import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { defaultThemeId, findTheme, themes, type Theme } from '@/src/theme/themes';

const KEY = 'christmas-family-theme';

export type AppFonts = {
  regular?: string;
  semibold?: string;
  bold?: string;
  black?: string;
  display?: string;
};

type ThemeApi = {
  theme: Theme;
  themes: Theme[];
  setTheme: (id: string) => void;
  ready: boolean;
  fonts: AppFonts;
};

const ThemeContext = createContext<ThemeApi | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(defaultThemeId);
  const [stored, setStored] = useState(false);
  const [loaded] = useFonts({
    Nunito_400Regular: require('../../assets/fonts/Nunito_400Regular.ttf'),
    Nunito_600SemiBold: require('../../assets/fonts/Nunito_600SemiBold.ttf'),
    Nunito_700Bold: require('../../assets/fonts/Nunito_700Bold.ttf'),
    Nunito_800ExtraBold: require('../../assets/fonts/Nunito_800ExtraBold.ttf'),
    Fraunces_600SemiBold: require('../../assets/fonts/Fraunces_600SemiBold.ttf'),
    Fraunces_700Bold: require('../../assets/fonts/Fraunces_700Bold.ttf'),
  });

  useEffect(() => {
    void AsyncStorage.getItem(KEY).then((saved) => {
      if (saved && themes.some((entry) => entry.id === saved)) setThemeId(saved);
      setStored(true);
    });
  }, []);

  const value = useMemo<ThemeApi>(() => {
    const fonts: AppFonts = loaded
      ? {
          regular: 'Nunito_400Regular',
          semibold: 'Nunito_600SemiBold',
          bold: 'Nunito_700Bold',
          black: 'Nunito_800ExtraBold',
          display: 'Fraunces_700Bold',
        }
      : {};
    return {
      theme: findTheme(themeId),
      themes,
      setTheme: (id: string) => {
        setThemeId(id);
        void AsyncStorage.setItem(KEY, id);
      },
      ready: stored && loaded,
      fonts,
    };
  }, [loaded, stored, themeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeApi {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
