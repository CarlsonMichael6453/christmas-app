import { memo, useEffect, useRef, useState } from 'react';
import { PanResponder, Platform, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { LetterPaperBackdrop, findPaper } from '@/src/components/LetterPaper';
import { smoothStrokePath, type DrawPoint } from '@/src/logic/drawing';
import type { Stroke } from '@/src/model/types';

const FinishedStrokes = memo(function FinishedStrokes({
  strokes,
  eraseColor,
}: {
  strokes: Stroke[];
  eraseColor: string;
}) {
  return (
    <>
      {strokes.map((stroke, index) => (
        <Path
          key={`${index}-${stroke.points.length}-${stroke.color}-${stroke.width ?? 4}`}
          d={smoothStrokePath(stroke.points)}
          fill="none"
          stroke={stroke.erase ? eraseColor : stroke.color}
          strokeWidth={stroke.width ?? 4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </>
  );
});

export function DrawingPad({
  strokes,
  paperId,
  color,
  width,
  erasing,
  onChange,
  onDrawingChange,
}: {
  strokes: Stroke[];
  paperId: string;
  color: string;
  width: number;
  erasing: boolean;
  onChange: (strokes: Stroke[]) => void;
  onDrawingChange?: (drawing: boolean) => void;
}) {
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const toolRef = useRef({ color, width, erasing });
  toolRef.current = { color, width, erasing };
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onDrawingChangeRef = useRef(onDrawingChange);
  onDrawingChangeRef.current = onDrawingChange;
  const pointsRef = useRef<DrawPoint[]>([]);
  const frameRef = useRef<number | null>(null);
  const strokeToken = useRef(0);
  const nodeRef = useRef<any>(null);
  const [live, setLive] = useState<Stroke | null>(null);
  const [size, setSize] = useState({ width: 0, height: 300 });
  const paper = findPaper(paperId);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = nodeRef.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== 'function') return;
    const block = (event: TouchEvent) => {
      if (event.cancelable) event.preventDefault();
    };
    node.addEventListener('touchmove', block, { passive: false });
    return () => node.removeEventListener('touchmove', block);
  }, [size.width]);

  useEffect(() => {
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  function publishLive() {
    frameRef.current = null;
    const token = strokeToken.current;
    const points = pointsRef.current.slice();
    if (token !== strokeToken.current || points.length === 0) return;
    const tool = toolRef.current;
    setLive({
      color: tool.color,
      width: tool.width,
      erase: tool.erasing,
      points,
    });
  }

  function queueLive() {
    if (frameRef.current != null) return;
    frameRef.current = requestAnimationFrame(publishLive);
  }

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (event) => {
        onDrawingChangeRef.current?.(true);
        const point = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
        pointsRef.current = [point];
        publishLive();
      },
      onPanResponderMove: (event) => {
        const point = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
        const previous = pointsRef.current[pointsRef.current.length - 1];
        if (previous) {
          const dx = point.x - previous.x;
          const dy = point.y - previous.y;
          if (dx * dx + dy * dy < 1.5) return;
        }
        pointsRef.current.push(point);
        queueLive();
      },
      onPanResponderRelease: () => finish(),
      onPanResponderTerminate: () => finish(),
    }),
  ).current;

  function finish() {
    strokeToken.current += 1;
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    const points = pointsRef.current;
    pointsRef.current = [];
    setLive(null);
    onDrawingChangeRef.current?.(false);
    if (points.length === 0) return;
    const tool = toolRef.current;
    onChangeRef.current([
      ...strokesRef.current,
      { color: tool.color, width: tool.width, erase: tool.erasing, points },
    ]);
  }

  const webLock =
    Platform.OS === 'web'
      ? ({ touchAction: 'none', overscrollBehavior: 'none', userSelect: 'none' } as const)
      : null;

  return (
    <View
      ref={nodeRef}
      onLayout={(event) => {
        const next = event.nativeEvent.layout;
        setSize({ width: next.width, height: next.height });
      }}
      {...responder.panHandlers}
      style={[{ height: 300, borderRadius: 16, overflow: 'hidden', backgroundColor: paper.base }, webLock]}
    >
      <Svg width={size.width} height={size.height}>
        <LetterPaperBackdrop id={paper.id} width={size.width} height={size.height} />
        <FinishedStrokes strokes={strokes} eraseColor={paper.base} />
        {live ? (
          <Path
            d={smoothStrokePath(live.points)}
            fill="none"
            stroke={live.erase ? paper.base : live.color}
            strokeWidth={live.width ?? 4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </Svg>
    </View>
  );
}
