import { Text, View } from 'react-native';

import type { Sweater } from '@/src/model/types';

export function SweaterView({ sweater, size = 150 }: { sweater: Pick<Sweater, 'base' | 'pattern' | 'patternColor' | 'collar' | 'deco'>; size?: number }) {
  const bodyWidth = size * 0.62;
  const bodyHeight = size * 0.72;
  return (
    <View style={{ width: size, height: size, alignItems: 'center' }}>
      <View
        style={{
          position: 'absolute',
          top: size * 0.22,
          width: size * 0.92,
          height: size * 0.22,
          backgroundColor: sweater.base,
          borderRadius: 18,
        }}
      />
      <View
        style={{
          marginTop: size * 0.18,
          width: bodyWidth,
          height: bodyHeight,
          backgroundColor: sweater.base,
          borderBottomLeftRadius: 26,
          borderBottomRightRadius: 26,
          overflow: 'hidden',
          alignItems: 'center',
        }}
      >
        <Pattern sweater={sweater} width={bodyWidth} height={bodyHeight} />
        <Text style={{ fontSize: size * 0.26, marginTop: bodyHeight * 0.28 }}>{sweater.deco}</Text>
      </View>
      <View
        style={{
          position: 'absolute',
          top: size * 0.1,
          width: size * 0.28,
          height: size * 0.16,
          backgroundColor: sweater.collar,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}
      />
    </View>
  );
}

function Pattern({
  sweater,
  width,
  height,
}: {
  sweater: Pick<Sweater, 'pattern' | 'patternColor'>;
  width: number;
  height: number;
}) {
  if (sweater.pattern === 'solid') return null;
  if (sweater.pattern === 'stripes') {
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {Array.from({ length: 5 }, (_, index) => (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 12 + index * (height / 5),
              height: 8,
              backgroundColor: sweater.patternColor,
              opacity: 0.85,
            }}
          />
        ))}
      </View>
    );
  }
  if (sweater.pattern === 'dots') {
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {Array.from({ length: 8 }, (_, index) => (
          <View
            key={index}
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: sweater.patternColor,
              left: (index % 3) * (width / 3) + 8,
              top: Math.floor(index / 3) * (height / 3) + 16,
            }}
          />
        ))}
      </View>
    );
  }
  if (sweater.pattern === 'fairisle') {
    return (
      <View style={{ position: 'absolute', left: 0, right: 0, top: height * 0.18, gap: 6 }}>
        <View style={{ height: 8, backgroundColor: sweater.patternColor }} />
        <View style={{ height: 4, marginHorizontal: 10, backgroundColor: sweater.patternColor, opacity: 0.7 }} />
        <View style={{ height: 8, backgroundColor: sweater.patternColor }} />
      </View>
    );
  }
  return (
    <Text style={{ position: 'absolute', top: 8, right: 8, fontSize: 14, opacity: 0.9 }}>🌲</Text>
  );
}
