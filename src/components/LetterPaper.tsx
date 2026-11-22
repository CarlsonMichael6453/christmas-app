import { useId } from 'react';
import Svg, { Circle, Defs, Line, Path, Pattern, Polygon, Rect } from 'react-native-svg';

export type LetterPaper = {
  id: string;
  name: string;
  base: string;
};

export const LETTER_PAPERS: LetterPaper[] = [
  { id: 'classic-stripes', name: 'Classic stripes', base: '#F7F1E8' },
  { id: 'candy-cane', name: 'Candy cane', base: '#FFF8F8' },
  { id: 'snowy-night', name: 'Snowy night', base: '#0E1A2B' },
  { id: 'north-pole', name: 'North Pole', base: '#F3E6C8' },
  { id: 'gingerbread', name: 'Gingerbread', base: '#C47A45' },
  { id: 'frosty', name: 'Frosty blue', base: '#E7F4FA' },
  { id: 'evergreen-plaid', name: 'Evergreen plaid', base: '#1E4D3A' },
  { id: 'gold-stars', name: 'Gold stars', base: '#1A1428' },
  { id: 'ugly-sweater', name: 'Ugly sweater', base: '#8E1B2C' },
  { id: 'cozy-cocoa', name: 'Cozy cocoa', base: '#4A2C2A' },
  { id: 'nordic-knit', name: 'Nordic knit', base: '#F4F1EA' },
  { id: 'winter-forest', name: 'Winter forest', base: '#16302A' },
  { id: 'lined', name: 'Lined letter', base: '#FFFDF8' },
];

export const DEFAULT_PAPER_ID = 'lined';

export function findPaper(id: string | undefined): LetterPaper {
  return LETTER_PAPERS.find((paper) => paper.id === id) ?? LETTER_PAPERS.find((paper) => paper.id === DEFAULT_PAPER_ID)!;
}

function starPoints(cx: number, cy: number, outer: number, inner: number) {
  const points: string[] = [];
  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    points.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`);
  }
  return points.join(' ');
}

export function LetterPaperBackdrop({ id, width, height }: { id: string; width: number; height: number }) {
  const paper = findPaper(id);
  const patternId = `${useId().replace(/:/g, '')}-${paper.id}`;
  return (
    <Svg width={width} height={height} pointerEvents="none">
      <Defs>
        {paper.id === 'classic-stripes' ? (
          <Pattern id={patternId} width="28" height="28" patternUnits="userSpaceOnUse">
            <Rect width="28" height="28" fill="#F7F1E8" />
            <Rect width="14" height="28" fill="#8E1B2C" />
            <Rect x="14" width="14" height="28" fill="#1E4D3A" />
          </Pattern>
        ) : null}
        {paper.id === 'candy-cane' ? (
          <Pattern id={patternId} width="18" height="18" patternUnits="userSpaceOnUse">
            <Rect width="18" height="18" fill="#FFF8F8" />
            <Path d="M-4 18 L18 -4 L24 2 L2 24 Z" fill="#C0392B" />
            <Path d="M6 18 L18 6 L24 12 L12 24 Z" fill="#C0392B" />
          </Pattern>
        ) : null}
        {paper.id === 'snowy-night' ? (
          <Pattern id={patternId} width="46" height="46" patternUnits="userSpaceOnUse">
            <Rect width="46" height="46" fill="#0E1A2B" />
            <Circle cx="8" cy="10" r="1.4" fill="#F7FBFF" />
            <Circle cx="30" cy="6" r="1" fill="#D6EAF8" />
            <Circle cx="22" cy="28" r="1.6" fill="#FFFFFF" />
            <Circle cx="40" cy="34" r="1.1" fill="#F7FBFF" />
          </Pattern>
        ) : null}
        {paper.id === 'gingerbread' ? (
          <Pattern id={patternId} width="36" height="36" patternUnits="userSpaceOnUse">
            <Rect width="36" height="36" fill="#C47A45" />
            <Circle cx="8" cy="8" r="2" fill="#FFF6E8" />
            <Circle cx="26" cy="20" r="2.2" fill="#FFF6E8" />
            <Circle cx="14" cy="28" r="1.4" fill="#F4D6A0" />
          </Pattern>
        ) : null}
        {paper.id === 'frosty' ? (
          <Pattern id={patternId} width="40" height="40" patternUnits="userSpaceOnUse">
            <Rect width="40" height="40" fill="#E7F4FA" />
            <Circle cx="10" cy="12" r="6" fill="#FFFFFF" opacity="0.7" />
            <Circle cx="28" cy="26" r="8" fill="#D6EAF8" />
            <Line x1="10" y1="12" x2="10" y2="2" stroke="#7FB3C8" strokeWidth="1" />
            <Line x1="10" y1="12" x2="2" y2="16" stroke="#7FB3C8" strokeWidth="1" />
            <Line x1="10" y1="12" x2="18" y2="16" stroke="#7FB3C8" strokeWidth="1" />
          </Pattern>
        ) : null}
        {paper.id === 'evergreen-plaid' ? (
          <Pattern id={patternId} width="32" height="32" patternUnits="userSpaceOnUse">
            <Rect width="32" height="32" fill="#1E4D3A" />
            <Rect y="12" width="32" height="6" fill="#C4A265" />
            <Rect x="8" width="6" height="32" fill="#F7F1E8" opacity="0.85" />
            <Rect y="22" width="32" height="2" fill="#8E1B2C" />
          </Pattern>
        ) : null}
        {paper.id === 'gold-stars' ? (
          <Pattern id={patternId} width="48" height="48" patternUnits="userSpaceOnUse">
            <Rect width="48" height="48" fill="#1A1428" />
            <Polygon points={starPoints(14, 16, 7, 3)} fill="#F1C40F" />
            <Polygon points={starPoints(36, 34, 5, 2)} fill="#C4A265" />
          </Pattern>
        ) : null}
        {paper.id === 'ugly-sweater' ? (
          <Pattern id={patternId} width="28" height="28" patternUnits="userSpaceOnUse">
            <Rect width="28" height="28" fill="#8E1B2C" />
            <Path d="M0 8 L7 2 L14 8 L21 2 L28 8" stroke="#F1C40F" strokeWidth="2" fill="none" />
            <Circle cx="7" cy="18" r="2.2" fill="#1E4D3A" />
            <Circle cx="20" cy="20" r="2.2" fill="#F7F1E8" />
          </Pattern>
        ) : null}
        {paper.id === 'cozy-cocoa' ? (
          <Pattern id={patternId} width="42" height="42" patternUnits="userSpaceOnUse">
            <Rect width="42" height="42" fill="#4A2C2A" />
            <Circle cx="14" cy="16" r="8" fill="#6E3B32" />
            <Circle cx="14" cy="14" r="5" fill="#F3E6C8" opacity="0.9" />
            <Circle cx="32" cy="30" r="3" fill="#C4A265" />
          </Pattern>
        ) : null}
        {paper.id === 'nordic-knit' ? (
          <Pattern id={patternId} width="24" height="24" patternUnits="userSpaceOnUse">
            <Rect width="24" height="24" fill="#F4F1EA" />
            <Path d="M12 2 L16 12 L12 22 L8 12 Z" fill="#1C1C1C" />
            <Circle cx="2" cy="2" r="1.2" fill="#8E1B2C" />
            <Circle cx="22" cy="22" r="1.2" fill="#1E4D3A" />
          </Pattern>
        ) : null}
        {paper.id === 'winter-forest' ? (
          <Pattern id={patternId} width="44" height="44" patternUnits="userSpaceOnUse">
            <Rect width="44" height="44" fill="#16302A" />
            <Polygon points="10,28 18,8 26,28" fill="#1E4D3A" />
            <Polygon points="16,30 22,16 28,30" fill="#0E2420" />
            <Rect x="20" y="30" width="2" height="6" fill="#6E3B32" />
            <Circle cx="8" cy="8" r="1" fill="#FFFFFF" />
          </Pattern>
        ) : null}
        {paper.id === 'lined' ? (
          <Pattern id={patternId} width="28" height="28" patternUnits="userSpaceOnUse">
            <Rect width="28" height="28" fill="#FFFDF8" />
            <Line x1="0" y1="27" x2="28" y2="27" stroke="#C5D4E8" strokeWidth="1" />
          </Pattern>
        ) : null}
      </Defs>
      {paper.id === 'north-pole' ? (
        <>
          <Rect width={width} height={height} fill="#F3E6C8" />
          <Rect x="10" y="10" width={Math.max(width - 20, 0)} height={Math.max(height - 20, 0)} fill="none" stroke="#C4A265" strokeWidth="2" />
          <Rect x="16" y="16" width={Math.max(width - 32, 0)} height={Math.max(height - 32, 0)} fill="none" stroke="#8E1B2C" strokeWidth="1" />
        </>
      ) : paper.id === 'lined' ? (
        <>
          <Rect width={width} height={height} fill={`url(#${patternId})`} />
          <Rect x="36" width="2" height={height} fill="#E6B0B0" />
        </>
      ) : (
        <Rect width={width} height={height} fill={`url(#${patternId})`} />
      )}
    </Svg>
  );
}
