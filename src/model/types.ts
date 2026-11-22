export type ClaimStatus = 'claimed' | 'bought';

export type User = {
  id: string;
  displayName: string;
  email?: string;
  passwordHash?: string;
  createdAt: string;
};

export type Group = {
  id: string;
  name: string;
  joinCode: string;
  ownerId: string;
  createdAt: string;
};

export type Membership = {
  groupId: string;
  userId: string;
  role: 'owner' | 'member';
  joinedAt: string;
};

export type WishItem = {
  id: string;
  groupId: string;
  ownerId: string;
  title: string;
  link: string;
  price: number | null;
  notes: string;
  priority: 1 | 2 | 3;
  createdAt: string;
};

export type Claim = {
  id: string;
  itemId: string;
  groupId: string;
  claimerId: string;
  status: ClaimStatus;
  pricePaid: number | null;
  updatedAt: string;
};

export type Exclusion = { a: string; b: string };

export type SantaEvent = {
  id: string;
  groupId: string;
  name: string;
  budget: number;
  exchangeDate: string;
  organizerId: string;
  participantIds: string[];
  exclusions: Exclusion[];
  drawn: boolean;
  createdAt: string;
};

export type Assignment = {
  id: string;
  eventId: string;
  giverId: string;
  receiverId: string;
};

export type Stroke = {
  color: string;
  points: { x: number; y: number }[];
};

export type Letter = {
  id: string;
  groupId: string;
  authorId: string;
  title: string;
  body: string;
  strokes: Stroke[];
  createdAt: string;
};

export type SweaterPattern = 'solid' | 'stripes' | 'dots' | 'fairisle' | 'trees';

export type Sweater = {
  id: string;
  groupId: string;
  designerId: string;
  name: string;
  base: string;
  pattern: SweaterPattern;
  patternColor: string;
  collar: string;
  deco: string;
  createdAt: string;
};

export type Vote = {
  sweaterId: string;
  userId: string;
  groupId: string;
};

export type LightPin = {
  id: string;
  groupId: string;
  userId: string;
  title: string;
  area: string;
  notes: string;
  bestNight: string;
  createdAt: string;
};

export type CookieSignup = {
  id: string;
  groupId: string;
  bakerId: string;
  name: string;
  recipe: string;
  dozens: number;
  notes: string;
};

export type CardTask = {
  id: string;
  groupId: string;
  userId: string;
  recipient: string;
  cardSent: boolean;
  giftGiven: boolean;
  thankYouNeeded: boolean;
  thankYouSent: boolean;
  notes: string;
};

export type BingoCard = {
  groupId: string;
  userId: string;
  marks: boolean[];
};

export type Resolution = {
  id: string;
  groupId: string;
  authorId: string;
  title: string;
  details: string;
  shared: boolean;
  progress: number;
  cheerIds: string[];
};

export type WeGift = {
  id: string;
  label: string;
  opened: boolean;
  holder: string | null;
  steals: number;
};

export type PartyState = {
  groupId: string;
  players: string[];
  gifts: WeGift[];
  phase: 'setup' | 'playing' | 'done';
  currentIndex: number;
  activePlayer: string | null;
  responding: boolean;
  stealBanId: string | null;
  maxSteals: number;
  turnSeconds: number;
  turnEndsAt: number | null;
  log: string[];
  passPlayers: string[];
  passHolding: number;
  passOut: string[];
  passEndsAt: number | null;
  passRunning: boolean;
  passSeconds: number;
  passLog: string[];
};

export type BudgetRow = {
  groupId: string;
  userId: string;
  total: number;
};

export type AdventOpen = {
  userId: string;
  days: number[];
};

export type SeenSlip = {
  userId: string;
  eventId: string;
};

export type ItemView = WishItem & {
  claim: null | {
    claimerId: string;
    status: ClaimStatus;
    pricePaid: number | null;
  };
};

export type SpendLine = {
  itemId: string;
  ownerId: string;
  claimerId: string;
  title: string;
  pricePaid: number;
};

export type ItemInput = {
  title: string;
  link: string;
  price: number | null;
  notes: string;
  priority: 1 | 2 | 3;
};

export type EventInput = {
  name: string;
  budget: number;
  exchangeDate: string;
  participantIds: string[];
  exclusions: Exclusion[];
};

export type RemoteIds = {
  bingo: Record<string, string>;
  budget: Record<string, string>;
  votes: Record<string, string>;
  adventId: string | null;
};

export type DB = {
  users: User[];
  sessionUserId: string | null;
  groups: Group[];
  memberships: Membership[];
  currentGroupId: string | null;
  items: WishItem[];
  claims: Claim[];
  events: SantaEvent[];
  assignments: Assignment[];
  letters: Letter[];
  sweaters: Sweater[];
  votes: Vote[];
  lights: LightPin[];
  cookies: CookieSignup[];
  cards: CardTask[];
  bingo: BingoCard[];
  resolutions: Resolution[];
  parties: PartyState[];
  budgets: BudgetRow[];
  advent: AdventOpen[];
  previewAdvent: boolean;
  seenSlips: SeenSlip[];
  recordIds: RemoteIds;
};
