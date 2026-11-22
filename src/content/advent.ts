export type DoorKind = 'joke' | 'challenge' | 'recipe' | 'fact' | 'reward';

export type Door = {
  day: number;
  kind: DoorKind;
  title: string;
  body: string;
};

export const doorKinds: Record<DoorKind, { label: string; emoji: string }> = {
  joke: { label: 'Joke', emoji: '😄' },
  challenge: { label: 'Challenge', emoji: '🎯' },
  recipe: { label: 'Recipe', emoji: '🍪' },
  fact: { label: 'Fact', emoji: '✨' },
  reward: { label: 'Reward', emoji: '🎁' },
};

export const adventDoors: Door[] = [
  {
    day: 1,
    kind: 'joke',
    title: 'Root canal',
    body: 'Why did the Christmas tree go to the dentist? It needed a root canal. Tell it at breakfast and see who groans first.',
  },
  {
    day: 2,
    kind: 'challenge',
    title: 'Something red',
    body: 'Everyone wears one red thing to dinner tonight. A sock counts. A Santa hat is showing off, and that is allowed.',
  },
  {
    day: 3,
    kind: 'fact',
    title: 'Straight candy canes',
    body: 'The first candy canes were straight white sticks. The hook came later, supposedly so they could hang on a tree. The stripes showed up after that.',
  },
  {
    day: 4,
    kind: 'recipe',
    title: 'Stovetop cocoa',
    body: 'For two mugs: 2 cups milk, 2 tablespoons cocoa, 2 tablespoons sugar, a pinch of salt. Whisk over medium heat until it steams. Finish with a splash of vanilla. Marshmallows are not optional.',
  },
  {
    day: 5,
    kind: 'reward',
    title: 'You pick the movie',
    body: 'The person who opened this door chooses tonight’s movie. Everyone else puts their phone face down until the opening credits are over.',
  },
  {
    day: 6,
    kind: 'joke',
    title: 'Elf employment',
    body: 'What do elves learn in school? The elf-abet. Bonus round: what do you call a snowman in July? A puddle.',
  },
  {
    day: 7,
    kind: 'challenge',
    title: 'Ten-minute tidy',
    body: 'Set a timer for ten minutes. Everyone picks one surface — table, couch, entryway — and clears it. When the timer ends, stop even if you want to keep going.',
  },
  {
    day: 8,
    kind: 'fact',
    title: 'Reindeer noses',
    body: 'Reindeer noses really are built for the cold. The blood vessels in them help warm the air they breathe. Rudolph’s glow is still artistic license.',
  },
  {
    day: 9,
    kind: 'recipe',
    title: 'Peppermint bark',
    body: 'Melt 8 ounces of dark chocolate and spread it on parchment. Chill until set. Melt 8 ounces of white chocolate, spread it on top, and crush 6 candy canes over it. Chill, then break into shards.',
  },
  {
    day: 10,
    kind: 'reward',
    title: 'Off dish duty',
    body: 'The opener is excused from dishes tonight. They still have to clear their own cup. Fair is fair.',
  },
  {
    day: 11,
    kind: 'joke',
    title: 'The grape one',
    body: 'What kind of bike does Santa ride when the sleigh is in the shop? A Holly Davidson. If that one misses, try: what does the gingerbread man put on his bed? Cookie sheets.',
  },
  {
    day: 12,
    kind: 'challenge',
    title: 'A note for someone',
    body: 'Write one specific kind sentence to someone in the house and leave it where they will find it. “Thanks for driving” beats “you’re nice.”',
  },
  {
    day: 13,
    kind: 'fact',
    title: 'Where Advent comes from',
    body: 'Advent means arrival. The four weeks before Christmas were marked in churches long before paper doors and chocolate. The 24-door calendar kids know got popular in Germany in the early 1900s.',
  },
  {
    day: 14,
    kind: 'recipe',
    title: 'Cinnamon oranges',
    body: 'Slice two oranges. Dust them with cinnamon and a little sugar. Broil a few minutes until the sugar bubbles. Eat them warm, preferably over the sink.',
  },
  {
    day: 15,
    kind: 'reward',
    title: 'Game night captain',
    body: 'You choose the game tonight. Cards, charades, or the snowflake game in this app all count. The captain also explains the rules, even if they are making them up.',
  },
  {
    day: 16,
    kind: 'joke',
    title: 'Stable jokes',
    body: 'Why are Christmas trees so bad at sewing? They always drop their needles. And why did the ornament go to school? To get a little more polished.',
  },
  {
    day: 17,
    kind: 'challenge',
    title: 'Call someone',
    body: 'Call or video a relative or friend who is not in the room. Keep it under ten minutes if you want, but actually dial. A text does not unlock the door.',
  },
  {
    day: 18,
    kind: 'fact',
    title: 'Poinsettias',
    body: 'The red parts of a poinsettia are leaves, not flowers. The real flowers are the tiny yellow buds in the center. The plant is from Mexico, where it is called flor de nochebuena.',
  },
  {
    day: 19,
    kind: 'recipe',
    title: 'Spiced nuts',
    body: 'Heat 1 tablespoon butter, 2 tablespoons sugar, 1 teaspoon cinnamon, a pinch of salt, and a pinch of cayenne. Toss with 2 cups of mixed nuts. Spread on a pan and bake at 325°F for about 12 minutes.',
  },
  {
    day: 20,
    kind: 'reward',
    title: 'Playlist boss',
    body: 'You control the speaker until bedtime. Carols, jazz, or the same three songs on repeat — the household has agreed by opening this door.',
  },
  {
    day: 21,
    kind: 'joke',
    title: 'Shortest day',
    body: 'What do snowmen eat for breakfast? Frosted flakes. What do they sing? Freeze a jolly good fellow. You may now close the door.',
  },
  {
    day: 22,
    kind: 'challenge',
    title: 'Blanket fort',
    body: 'Build a fort big enough for two people and a plate of cookies. Read one page of something, or one door from this calendar, from inside it.',
  },
  {
    day: 23,
    kind: 'fact',
    title: 'The quiet night',
    body: 'A lot of the world really does slow down on Christmas Eve. In some countries gifts arrive tonight, not in the morning. If your house does it the other way, you still get the late-night feeling of looking out at the dark.',
  },
  {
    day: 24,
    kind: 'reward',
    title: 'Christmas Eve',
    body: 'Last door. Leave something for Santa, or for whoever plays Santa in your house — cookies, a note, a drawing. Then put the lights on a timer, or turn them off together, and call it a night.',
  },
];

export function doorByDay(day: number): Door | undefined {
  return adventDoors.find((door) => door.day === day);
}
