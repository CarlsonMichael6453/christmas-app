import type { DB } from '@/src/model/types';
import { emptyParty } from '@/src/logic/party';
import { emptyDB } from '@/src/backend/mutate';

const michael = '11111111-1111-4111-8111-111111111111';
const emma = '22222222-2222-4222-8222-222222222222';
const lily = '33333333-3333-4333-8333-333333333333';
const noah = '44444444-4444-4444-8444-444444444444';
const groupId = '55555555-5555-4555-8555-555555555555';

export const demoNames = {
  michael,
  emma,
  lily,
  noah,
};

export function demoDatabase(): DB {
  const db = emptyDB();
  const created = '2026-11-01T15:00:00.000Z';
  db.users = [
    { id: michael, displayName: 'Michael', createdAt: created },
    { id: emma, displayName: 'Emma', createdAt: created },
    { id: lily, displayName: 'Lily', createdAt: created },
    { id: noah, displayName: 'Noah', createdAt: created },
  ];
  db.sessionUserId = michael;
  db.groups = [
    { id: groupId, name: 'Carlson Family', joinCode: 'CARL26', ownerId: michael, createdAt: created },
  ];
  db.memberships = [michael, emma, lily, noah].map((userId) => ({
    groupId,
    userId,
    role: userId === michael ? ('owner' as const) : ('member' as const),
    joinedAt: created,
  }));
  db.currentGroupId = groupId;
  db.items = [
    item('66666666-6666-4666-8666-666666666661', michael, 'Cordless drill', 89, 'https://example.com/drill', '18 volt is plenty', 3),
    item('66666666-6666-4666-8666-666666666662', michael, 'Wool socks', 18, '', 'Size L, charcoal', 2),
    item('66666666-6666-4666-8666-666666666663', michael, 'Paperback mystery', 16, '', 'Nothing too grim', 1),
    item('66666666-6666-4666-8666-666666666664', emma, 'Cast iron skillet', 48, '', '10 inch', 3),
    item('66666666-6666-4666-8666-666666666665', emma, 'Afternoon with no errands', 0, '', 'A free Saturday', 2),
    item('66666666-6666-4666-8666-666666666666', lily, 'Watercolor set', 22, '', 'The ones with a brush', 3),
    item('66666666-6666-4666-8666-666666666667', lily, 'Soccer ball', 20, '', 'Size 4', 2),
    item('66666666-6666-4666-8666-666666666668', noah, 'Lego botanical set', 50, '', 'Any plant is fine', 3),
    item('66666666-6666-4666-8666-666666666669', noah, 'Over-ear headphones', 40, '', 'Wired is okay', 2),
  ];
  db.claims = [
    {
      id: '88888888-8888-4888-8888-888888888881',
      itemId: '66666666-6666-4666-8666-666666666661',
      groupId,
      claimerId: emma,
      status: 'bought',
      pricePaid: 79,
      updatedAt: '2026-11-18T00:00:00.000Z',
    },
    {
      id: '88888888-8888-4888-8888-888888888882',
      itemId: '66666666-6666-4666-8666-666666666664',
      groupId,
      claimerId: lily,
      status: 'claimed',
      pricePaid: null,
      updatedAt: '2026-11-19T00:00:00.000Z',
    },
    {
      id: '88888888-8888-4888-8888-888888888883',
      itemId: '66666666-6666-4666-8666-666666666669',
      groupId,
      claimerId: michael,
      status: 'bought',
      pricePaid: 35,
      updatedAt: '2026-11-19T00:00:00.000Z',
    },
  ];
  db.events = [
    {
      id: '77777777-7777-4777-8777-777777777777',
      groupId,
      name: 'Carlson Secret Santa',
      budget: 40,
      exchangeDate: '2026-12-20',
      organizerId: michael,
      participantIds: [michael, emma, lily, noah],
      exclusions: [{ a: michael, b: emma }],
      drawn: false,
      createdAt: created,
    },
  ];
  db.letters = [
    {
      id: '99999999-9999-4999-8999-999999999991',
      groupId,
      authorId: lily,
      title: 'Dear Santa',
      body: 'I have been pretty good. I would like paints and maybe a soccer ball if it fits. Thank you.',
      strokes: [],
      createdAt: '2026-11-15T00:00:00.000Z',
    },
  ];
  db.sweaters = [
    {
      id: '99999999-9999-4999-8999-999999999992',
      groupId,
      designerId: noah,
      name: 'Tree on a red sweater',
      base: '#8E1B2C',
      pattern: 'trees',
      patternColor: '#1E4D3A',
      collar: '#F4F1EA',
      deco: '🎄',
      createdAt: created,
    },
  ];
  db.votes = [{ sweaterId: '99999999-9999-4999-8999-999999999992', userId: lily, groupId }];
  db.lights = [
    {
      id: '99999999-9999-4999-8999-999999999993',
      groupId,
      userId: emma,
      title: 'The house with the reindeer on the roof',
      area: 'Oak Street',
      notes: 'They sync the lights to music after 6.',
      bestNight: 'Any clear night',
      createdAt: created,
    },
  ];
  db.cookies = [
    {
      id: '99999999-9999-4999-8999-999999999994',
      groupId,
      bakerId: emma,
      name: 'Gingerbread people',
      recipe: 'gingerbread',
      dozens: 3,
      notes: 'Icing buttons, no raisins.',
    },
  ];
  db.cards = [
    {
      id: '99999999-9999-4999-8999-999999999995',
      groupId,
      userId: michael,
      recipient: 'Grandma Carlson',
      cardSent: false,
      giftGiven: false,
      thankYouNeeded: true,
      thankYouSent: false,
      notes: 'She likes the photo cards.',
    },
  ];
  db.resolutions = [
    {
      id: '99999999-9999-4999-8999-999999999996',
      groupId,
      authorId: michael,
      title: 'A walk after dinner',
      details: 'Even a short one, phones left on the table.',
      shared: true,
      progress: 20,
      cheerIds: [lily],
    },
  ];
  db.budgets = [{ groupId, userId: michael, total: 150 }];
  const party = emptyParty(groupId);
  party.players = ['Michael', 'Emma', 'Lily', 'Noah'];
  party.passPlayers = ['Michael', 'Emma', 'Lily', 'Noah'];
  db.parties = [party];
  return db;
}

function item(
  id: string,
  ownerId: string,
  title: string,
  price: number | null,
  link: string,
  notes: string,
  priority: 1 | 2 | 3,
) {
  return {
    id,
    groupId,
    ownerId,
    title,
    link,
    price,
    notes,
    priority,
    createdAt: '2026-11-02T00:00:00.000Z',
  };
}
