export type DrawPoint = { x: number; y: number };

export const PENCIL_COLORS = [
  '#8E1B2C',
  '#C0392B',
  '#E74C3C',
  '#F1948A',
  '#1E4D3A',
  '#196F3D',
  '#27AE60',
  '#ABEBC6',
  '#C4A265',
  '#F1C40F',
  '#B7950B',
  '#D5D8DC',
  '#7F8C8D',
  '#1B4F72',
  '#5DADE2',
  '#D6EAF8',
  '#6C3483',
  '#BB8FCE',
  '#6E2C00',
  '#A04000',
  '#DC7633',
  '#FDEBD0',
  '#FFFFFF',
  '#1C1C1C',
] as const;

export const BRUSH_SIZES = [2, 4, 7, 11, 16, 22, 30, 42] as const;

function coord(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** Quadratic curves through midpoints, so a finger stroke does not look like a polyline. */
export function smoothStrokePath(points: DrawPoint[]): string {
  if (points.length === 0) return '';
  const first = points[0]!;
  if (points.length === 1) return `M ${coord(first.x)} ${coord(first.y)} L ${coord(first.x + 0.1)} ${coord(first.y)}`;
  if (points.length === 2) {
    const second = points[1]!;
    return `M ${coord(first.x)} ${coord(first.y)} L ${coord(second.x)} ${coord(second.y)}`;
  }
  let path = `M ${coord(first.x)} ${coord(first.y)}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const control = points[index]!;
    const next = points[index + 1]!;
    const midX = (control.x + next.x) / 2;
    const midY = (control.y + next.y) / 2;
    path += ` Q ${coord(control.x)} ${coord(control.y)} ${coord(midX)} ${coord(midY)}`;
  }
  const last = points[points.length - 1]!;
  path += ` L ${coord(last.x)} ${coord(last.y)}`;
  return path;
}
