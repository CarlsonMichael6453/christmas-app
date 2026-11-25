import type {
  CardTask,
  CookieSignup,
  DB,
  EventInput,
  ItemInput,
  Letter,
  LightPin,
  PartyState,
  Resolution,
  SantaEvent,
  Sweater,
  User,
} from '@/src/model/types';
import type { viewItems, visibleSpending } from '@/src/logic/visibility';

export type Match = { receiver: User; eventId: string };

export type AppApi = {
  ready: boolean;
  mode: 'phone' | 'supabase';
  user: User | null;
  group: DB['groups'][number] | null;
  groups: DB['groups'];
  members: User[];
  error: string | null;
  clearError: () => void;
  signInName: (name: string) => Promise<boolean>;
  signInEmail: (email: string, password: string, name?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  loadDemo: () => Promise<boolean>;
  switchUser: (userId: string) => Promise<boolean>;
  localUsers: User[];
  updateName: (name: string) => Promise<boolean>;
  createGroup: (name: string) => Promise<boolean>;
  joinGroup: (code: string) => Promise<boolean>;
  selectGroup: (id: string) => Promise<boolean>;
  items: ReturnType<typeof viewItems>;
  addItem: (input: ItemInput) => Promise<boolean>;
  updateItem: (id: string, input: ItemInput) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  claim: (itemId: string) => Promise<boolean>;
  markBought: (itemId: string, price: number | null) => Promise<boolean>;
  release: (itemId: string) => Promise<boolean>;
  events: SantaEvent[];
  createEvent: (input: EventInput) => Promise<boolean>;
  updateEvent: (id: string, input: EventInput) => Promise<boolean>;
  draw: (eventId: string) => Promise<{ ok: boolean; reason?: string }>;
  resetDraw: (eventId: string) => Promise<boolean>;
  myMatch: (eventId: string) => Match | null;
  slipSeen: (eventId: string) => boolean;
  markSlipSeen: (eventId: string) => void;
  doorsOpen: number[];
  previewAdvent: boolean;
  setPreviewAdvent: (value: boolean) => Promise<void>;
  markDoorOpen: (day: number) => Promise<void>;
  budgetTotal: number;
  setBudgetTotal: (total: number) => Promise<boolean>;
  spending: ReturnType<typeof visibleSpending>;
  letters: Letter[];
  saveLetter: (letter: Letter) => Promise<boolean>;
  deleteLetter: (id: string) => Promise<boolean>;
  sweaters: Sweater[];
  saveSweater: (sweater: Sweater) => Promise<boolean>;
  deleteSweater: (id: string) => Promise<boolean>;
  votesFor: (sweaterId: string) => { count: number; mine: boolean };
  toggleVote: (sweaterId: string) => Promise<boolean>;
  lights: LightPin[];
  saveLight: (light: LightPin) => Promise<boolean>;
  deleteLight: (id: string) => Promise<boolean>;
  cookies: CookieSignup[];
  saveCookie: (cookie: CookieSignup) => Promise<boolean>;
  deleteCookie: (id: string) => Promise<boolean>;
  cards: CardTask[];
  saveCard: (card: CardTask) => Promise<boolean>;
  deleteCard: (id: string) => Promise<boolean>;
  bingoMarks: boolean[];
  toggleBingo: (index: number) => Promise<boolean>;
  resetBingo: () => Promise<boolean>;
  resolutions: Resolution[];
  saveResolution: (resolution: Resolution) => Promise<boolean>;
  deleteResolution: (id: string) => Promise<boolean>;
  setProgress: (id: string, progress: number) => Promise<boolean>;
  cheer: (id: string) => Promise<boolean>;
  party: PartyState | null;
  saveParty: (party: PartyState) => Promise<boolean>;
  nameOf: (userId: string) => string;
};
