import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { findLights, type LightOption } from '@/src/theme/lights';
import { useTheme } from '@/src/theme/ThemeProvider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function wirePath(width: number, step: number) {
  const crest = 6;
  const sag = 16;
  let path = `M 0 ${crest}`;
  for (let x = 0; x < width; x += step) {
    const end = Math.min(x + step, width);
    const mid = x + (end - x) / 2;
    path += ` Q ${mid} ${crest + sag * 2} ${end} ${crest}`;
  }
  return path;
}

function bulbCenters(width: number, step: number) {
  const centers: { x: number; y: number }[] = [];
  const crest = 6;
  const sag = 16;
  for (let x = 0; x + step <= width + 8; x += step) {
    const end = Math.min(x + step, width);
    const mid = x + (end - x) / 2;
    centers.push({ x: mid, y: crest + sag });
  }
  return centers;
}

export function StringLights({
  width,
  option,
  animated = true,
}: {
  width: number;
  option?: LightOption;
  animated?: boolean;
}) {
  const { lights } = useTheme();
  const choice = option ?? lights;
  const [reduceMotion, setReduceMotion] = useState(false);
  const step = choice.bulb === 'c9' ? 54 : 34;
  const radius = choice.bulb === 'c9' ? 9 : 5;
  const centers = useMemo(() => (choice.id === 'none' ? [] : bulbCenters(Math.max(width, 1), step)), [choice.id, step, width]);
  const opacities = useRef<Animated.Value[]>([]);
  if (opacities.current.length !== centers.length) {
    opacities.current = centers.map(() => new Animated.Value(1));
  }

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(Boolean(enabled));
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduceMotion(Boolean(enabled));
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const values = opacities.current;
    if (!animated || reduceMotion) {
      values.forEach((value) => value.setValue(1));
      return;
    }
    const low = choice.twinkle === 'fade' ? 0.12 : 0.4;
    const duration = choice.twinkle === 'fade' ? 1500 : 780;
    const loops = values.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay((index % 5) * 160),
          Animated.timing(value, { toValue: low, duration, useNativeDriver: false }),
          Animated.timing(value, { toValue: 1, duration, useNativeDriver: false }),
        ]),
      ),
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [animated, centers.length, choice.twinkle, reduceMotion]);

  if (choice.id === 'none' || width < 24) return null;
  const height = choice.bulb === 'c9' ? 48 : 36;

  return (
    <View pointerEvents="none" style={{ width, height }}>
      <Svg width={width} height={height}>
        <Path d={wirePath(width, step)} stroke="#6b5344" strokeWidth={choice.bulb === 'c9' ? 2.5 : 1.6} fill="none" />
        {centers.map((center, index) => {
          const color = choice.colors[index % choice.colors.length] ?? '#F1C40F';
          return (
            <AnimatedCircle
              key={`${center.x}-${index}`}
              cx={center.x}
              cy={center.y}
              r={radius}
              fill={color}
              stroke="rgba(0,0,0,0.25)"
              strokeWidth={1}
              opacity={opacities.current[index]}
            />
          );
        })}
      </Svg>
    </View>
  );
}

export function LightPreview({ id, width = 150 }: { id: string; width?: number }) {
  const option = findLights(id);
  if (option.id === 'none') {
    return (
      <View style={{ width, height: 28, justifyContent: 'center' }}>
        <View style={{ height: 2, backgroundColor: '#C5B8A8', borderRadius: 1 }} />
      </View>
    );
  }
  return <StringLights width={width} option={option} animated={false} />;
}
