import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

import { useTheme } from '@/src/theme/ThemeProvider';

const FLAKES = Array.from({ length: 16 }, (_, index) => ({
  id: index,
  left: `${(index * 17) % 100}%` as `${number}%`,
  size: 10 + (index % 4) * 4,
  duration: 8000 + (index % 6) * 1200,
  delay: (index % 8) * 350,
  drift: (index % 2 === 0 ? 1 : -1) * (10 + (index % 5) * 4),
  opacity: 0.35 + (index % 4) * 0.12,
}));

function Flake({
  flake,
  color,
}: {
  flake: (typeof FLAKES)[number];
  color: string;
}) {
  const y = useRef(new Animated.Value(-30)).current;
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(y, {
          toValue: 900,
          duration: flake.duration,
          delay: flake.delay,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.sequence([
          Animated.timing(x, { toValue: flake.drift, duration: flake.duration / 2, useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(x, { toValue: -flake.drift / 2, duration: flake.duration / 2, useNativeDriver: Platform.OS !== 'web' }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flake.delay, flake.drift, flake.duration, x, y]);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: flake.left,
        top: 0,
        color,
        fontSize: flake.size,
        opacity: flake.opacity,
        transform: [{ translateY: y }, { translateX: x }],
      }}
    >
      ❄
    </Animated.Text>
  );
}

export function Snow() {
  const { theme } = useTheme();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {FLAKES.map((flake) => (
        <Flake key={flake.id} flake={flake} color={theme.colors.snow} />
      ))}
    </View>
  );
}
