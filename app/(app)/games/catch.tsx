import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { BackButton, Button, Heading, Muted, Screen, Title } from '@/src/components/ui';
import { tap } from '@/src/logic/feedback';
import { useTheme } from '@/src/theme/ThemeProvider';

type Flake = { id: number; x: number; y: number; speed: number; points: number; emoji: string };

export default function CatchGame() {
  const { theme, fonts } = useTheme();
  const { width } = useWindowDimensions();
  const field = Math.min(width, 560) - 32;
  const [flakes, setFlakes] = useState<Flake[]>([]);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(30);
  const [running, setRunning] = useState(false);
  const id = useRef(0);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setLeft((value) => {
        if (value <= 1) {
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
      setFlakes((current) => {
        const moved = current
          .map((flake) => ({ ...flake, y: flake.y + flake.speed }))
          .filter((flake) => flake.y < 460);
        if (Math.random() < 0.45) {
          const golden = Math.random() < 0.15;
          moved.push({
            id: id.current++,
            x: 12 + Math.random() * (field - 36),
            y: -10,
            speed: 6 + Math.random() * 7,
            points: golden ? 5 : 1,
            emoji: golden ? '⭐' : '❄️',
          });
        }
        return moved;
      });
    }, 80);
    return () => clearInterval(timer);
  }, [field, running]);

  function start() {
    setScore(0);
    setLeft(30);
    setFlakes([]);
    setRunning(true);
  }

  return (
    <Screen scroll={false}>
      <BackButton />
      <Title>Catch snow</Title>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Heading>{score} points</Heading>
        <Muted>{left}s</Muted>
      </View>
      <View
        style={{ flex: 1, borderRadius: 20, backgroundColor: theme.colors.surfaceAlt, overflow: 'hidden' }}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          const x = event.nativeEvent.locationX;
          const y = event.nativeEvent.locationY;
          setFlakes((current) => {
            const hit = current.find((flake) => Math.abs(flake.x + 12 - x) < 28 && Math.abs(flake.y + 12 - y) < 28);
            if (!hit) return current;
            setScore((value) => value + hit.points);
            void tap('light');
            return current.filter((flake) => flake.id !== hit.id);
          });
        }}
      >
        {flakes.map((flake) => (
          <Text key={flake.id} style={{ position: 'absolute', left: flake.x, top: flake.y, fontSize: 24 }}>
            {flake.emoji}
          </Text>
        ))}
        {!running ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Text style={{ color: theme.colors.text, fontFamily: fonts.bold }}>
              {left === 0 ? `Time. You caught ${score}.` : 'Tap the flakes before they melt.'}
            </Text>
            <Button label={left === 0 ? 'Play again' : 'Start'} onPress={start} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
