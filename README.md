# Christmas Family

A Christmas app for one household. It keeps wishlists, hides gifts that are already bought, draws Secret Santa names, and holds the rest of the season: an advent calendar, a budget, letters to Santa, ugly-sweater voting, a light-display list, a cookie exchange, cards and thank-yous, movie bingo, white elephant, pass-the-present, two small snow games, and New Year goals.

It runs in Expo Go on an iPhone or Android phone. The default theme is classic red, green, and white. Settings has ten winter themes, and the choice sticks on the phone.

## Try it on an iPhone

You do not need a developer account for this.

1. On the iPhone, install **Expo Go** from the App Store.
2. On a computer, install Node.js 22 or newer.
3. Clone this repo and install:

```bash
npm install
npx expo start --tunnel
```

4. A QR code shows in the terminal. Open the iPhone camera, scan it, and choose Expo Go.

`--tunnel` works when the phone is not on the same Wi-Fi as the computer. That is the reliable way to open it from another network. The first time, Expo may ask you to install `@expo/ngrok` and to sign in to a free Expo account (`npx expo login`).

If the phone and the computer are on the same Wi-Fi, this is enough:

```bash
npx expo start
```

Then scan the QR code the same way. If the phone cannot connect, switch back to `--tunnel`.

### The Carlson family demo

On the sign-in screen, tap **Load the demo**. You come in as Michael, in a group called Carlson Family. The join code is `CARL26`.

Emma has already bought Michael's cordless drill. Lily has claimed Emma's skillet. Michael has bought Noah's headphones.

To check the hidden-gift rule:

1. Stay as Michael and open your own wishlist. The drill looks like a normal wish. There is no claim and no "bought" mark.
2. Open Emma's list. You can see that Lily claimed the skillet.
3. Open Settings and switch to Emma.
4. Open Michael's list. The drill now shows as bought by Emma.
5. Open Emma's own list. The skillet looks untouched.

That filter is in `src/logic/visibility.ts`, and the same rule is in `supabase/schema.sql` for the hosted database. On this phone, without Supabase, the app never hands the owner those rows. The raw demo file still sits in on-device storage, so a person who digs through the phone's data can find it. With Supabase, the database itself refuses to return those rows.

To try the name draw: open Santa. Michael and Emma are excluded from each other. Tap **Draw names**, then **Pull your slip**. Switch to another person and pull theirs. You only ever see your own match.

Advent doors stay locked until their day in December. Settings has **Preview advent doors** so you can read all 24 now.

## Scripts

```bash
npm start            # Expo, same Wi-Fi
npm run start:tunnel # Expo via a tunnel, for a phone on another network
npm test             # draw, visibility, countdown, white-elephant tests
npm run typecheck
npm run web          # browser preview
```

## What you need to sign up for

| Goal | Account | Cost |
| --- | --- | --- |
| Run it in Expo Go on a phone | Nothing, unless you use `--tunnel` | Free. Tunnel may ask for a free [Expo](https://expo.dev) account. |
| Two phones, live sync, real privacy rules | [Supabase](https://supabase.com) | Free tier is enough for a family. |
| Cloud builds for the stores | Expo account | Free tier covers occasional builds. |
| App Store | [Apple Developer Program](https://developer.apple.com/programs/) | $99 a year. A Mac is not required if you use Expo's cloud build. |
| Google Play | [Play Console](https://play.google.com/console) | $25 once. |

Without those env vars the app is complete on one device, including switching between family members. The public web build already has them.

## Supabase

The shared database is already live. The GitHub Pages build at https://carlsonmichael6453.github.io/christmas-app/ sets these public client values when it exports:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://lqkffrqtkykuirarnrkq.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_GJGsmtk47WBbzXwn5fPSUg_NJHSjzSK
```

The same names are in `.env.example`. They are the publishable key, not a secret. Sign-in on that site uses Supabase. **Load the demo** is still there and stays in the browser; it does not write to the database.

Authentication on the live project:

- **Anonymous** sign-in is on, so a name alone calls `signInAnonymously`.
- **Confirm email** is off, so an email and password can sign in immediately.
- Site URL and redirect are `https://carlsonmichael6453.github.io/christmas-app/`.

`supabase/schema.sql` is the script applied to that project. `create_group` draws the join code with `extensions.gen_random_bytes`, and `join_group` no longer shadows the `FOUND` flag. Row level security is unchanged in intent: claims stay hidden from the gift owner, and a Secret Santa slip is readable only by the giver.

To point a local Expo Go session at the same project, copy `.env.example` to `.env.local` and restart Expo. Leave both values blank if you want the phone to stay on-device only.

Do not put the service role key or the database password in the app. The publishable key is meant to ship in the client. Row level security is what keeps claims and Secret Santa slips private:

- A person cannot read a claim on their own wishlist item.
- A person cannot insert a claim on their own item.
- Secret Santa is drawn inside Postgres (`draw_secret_santa`). The client only receives the row where `giver_id` is that person.
- Letters, sweaters, lights, cookies, and the party state are shared with the group. Cards, bingo, budgets, and advent progress stay with the person who wrote them.

After the SQL is applied, Supabase's table list should include `profiles`, `groups`, `memberships`, `wish_items`, `claims`, `santa_events`, `santa_assignments`, and `group_records`. Realtime is enabled for those tables so a second phone sees new wishes and claims without a refresh.

## Themes

Settings → color themes. Classic Christmas is the default. Also included: Candy Cane, Winter Wonderland, Gingerbread, Midnight Snow, Evergreen & Gold, Frosty Pastel, Northern Lights, Hot Cocoa, and Silver Bells. Add another by appending an object to `themes` in `src/theme/themes.ts`. The id is what gets saved on the phone.

## App Store and Google Play

Expo builds the native apps in the cloud. You do not need Xcode installed to produce an iOS build, but the Apple Developer account has to be yours.

```bash
npm install -g eas-cli
eas login
eas init
eas build:configure
```

`eas.json` already has development, preview, and production profiles. The preview profile makes an Android APK you can install without the Play Store.

```bash
eas build -p android --profile preview
eas build -p ios --profile production
eas build -p android --profile production
```

Submit after a production build:

```bash
eas submit -p ios
eas submit -p android
```

Store listing notes worth having ready:

- The app stores family names, wishlists, and gift claims. Say that in the privacy policy.
- There are no ads and no in-app purchases in this version.
- iOS bundle id: `com.carlson.christmasfamily`
- Android package: `com.carlson.christmasfamily`

For the iPhone install from a production build, Apple will ask for TestFlight or App Store review. TestFlight is the faster way for the family to try a real install outside Expo Go.

## Project map

- `app/` screens (Expo Router)
- `src/logic/derangement.ts` Secret Santa draw
- `src/logic/visibility.ts` who may see a claim or a purchase
- `src/logic/party.ts` white elephant and pass-the-present
- `src/backend/` on-device database, the local demo, and the Supabase client used when the public env vars are set
- `src/theme/` the ten themes
- `src/content/` advent doors, cookie recipes, bingo squares
- `supabase/schema.sql` tables, the server-side draw, and row level security

## Tests

```bash
npm test
```

Covers the draw (including exclusions and impossible groups), the hidden-claim rule, the budget filter, the SQL policies that match those rules, the countdown, and a white-elephant steal lock.

## Known limits

- Without Supabase, two phones do not share data. Switching users on one phone is how you test the privacy rule.
- In that on-phone mode, a technical person can still read the saved JSON on the device. Supabase row level security is the version that holds up if someone modifies the app.
- The light list is a list, not a map.
- White elephant and pass-the-present are meant to be run from one phone in the room. With Supabase they do sync, but the timers are happier on a single screen.
- Letter drawings are simple finger strokes, not a full art tool.
- There is no push notification when a door unlocks or when someone claims a gift.
