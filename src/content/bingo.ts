export const bingoSquares = [
  'Snow falls at the perfect moment',
  'A small town saves the day',
  'Someone learns the spirit',
  'Hot cocoa close-up',
  'A near-miss at the airport',
  'Baking montage',
  'An ugly sweater appears',
  'A kid explains Christmas',
  'The villain hates tinsel',
  'Ice skating scene',
  'A pause under mistletoe',
  'Last-minute gift panic',
  'Free cocoa',
  'Career versus going home',
  'A magical old stranger',
  'Carol sing-along',
  'The useless gift matters',
  'Snowball fight',
  'A red truck or old car',
  'Dinner goes sideways',
  'A talking animal',
  'Christmas Eve deadline',
  'A parent mentioned softly',
  'A shop with twinkle lights',
  'Credits roll over a carol',
];

export const bingoFreeIndex = 12;

const lines: number[][] = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

export function hasBingo(marks: boolean[]): boolean {
  return lines.some((line) => line.every((index) => marks[index]));
}
