# RailLens Mobile

> **Going live?** Follow [`DEPLOYMENT.md`](DEPLOYMENT.md): one step-by-step guide for the backend, website, Android app and RailOps, with a tracker of what's merged vs. live.

React Native (CLI, bare, TypeScript) client for RailLens. Not a companion app —
every feature in train-db-frontend has a home here too, reusing the same
train-db REST API. See ../MOBILE_FEATURE_PARITY.md for the full checklist and
../MOBILE_AUDIT.md for the full audit history (findings + fixes).

## Stack

- React Native CLI (bare) + TypeScript
- React Navigation (native-stack + bottom-tabs)
- TanStack Query for server state/caching
- Axios for HTTP, one shared client with JWT refresh interceptor (src/api/client.ts)
- Zustand for client state (auth session, preferences, favorites, history, saved journeys, admin key)
- React Native Paper (Material Design 3) for UI components/theming
- React Native MMKV for fast local storage (favorites, history, preferences)
- React Native Keychain for secure storage (JWT/refresh token, admin key)
- React Hook Form + Zod for form validation

## Project layout

```
src/
  api/          shared axios client + TanStack Query client
  config/       environment (API base URL)
  lib/          storage (MMKV), secureStorage (Keychain), jwt helpers
  store/        cross-cutting app state (auth session, theme preference)
  theme/        Paper MD3 light/dark themes
  components/   shared UI (DataCard, etc.)
  navigation/   React Navigation stacks/tabs, one file per navigator
  features/     one folder per feature area (auth, trains, stations,
                 journeys, savedJourneys, smartSearch, stats, network,
                 favorites, history, account, settings, admin) - each has
                 its own api.ts (thin axios wrapper around the matching
                 backend endpoints) and screen components. No business
                 logic lives here beyond UI state; anything resembling a
                 rule (search matching, scoring, graph analytics) stays on
                 the backend, same as the web app.
```

## Prerequisites: generating the native android/ios folders

This repo ships the full `src/` TypeScript layer, all config files
(package.json, tsconfig, babel, metro, eslint, prettier), `App.tsx`, and
`index.js` — everything that's genuinely hand-written project logic. It does
**not** ship the generated `android/` and `ios/` native project folders
(Gradle wrapper, Xcode project, CocoaPods files, etc.), because those are
large generated artifacts that require the actual React Native CLI running
against a real native toolchain (Android SDK / Xcode) to produce correctly —
not something safely hand-authored.

One-time setup on your machine (needs Node 20+, and Android Studio and/or
Xcode installed per the [React Native environment setup guide](https://reactnative.dev/docs/set-up-your-environment)):

```bash
# From the RailLens repo root, generate a fresh RN 0.82 TS template into a
# scratch folder, then copy its native folders into this project.
npx @react-native-community/cli init TrainDbMobileScratch --version 0.82.0 --skip-install
cp -R TrainDbMobileScratch/android train-db-mobile/android
rm -rf TrainDbMobileScratch

cd train-db-mobile
npm install
```

Only the `android/` folder is copied over — **iOS is deliberately skipped**
for this project (demo-only, not worth the $99/year Apple Developer
Program fee; Apple doesn't allow free sideloading beyond your own device).
If that ever changes, `TrainDbMobileScratch/ios` from the same scratch
template above can still be copied in later — nothing about the app code
depends on iOS being skipped.

After that, treat `android/` as a normal generated native project (rename
the app display name / package id there to match `app.json` if you want it
fully aligned — not required to run).

## Deploying the backend (do this first)

The app talks to the live backend (`src/config/env.ts`), so the backend must be deployed before the app is useful on a real phone. The full, current steps (Render + Neon) are in [`DEPLOYMENT.md`](DEPLOYMENT.md), Sections 6 and 8. Render's free plan sleeps when idle, so the first request after a while can take up to a minute.

## Configuration

`src/config/env.ts` is the single source of truth for the API base URL —
see step 6 above. Flip `USE_LOCAL_BACKEND` to `true` there only when you
want an emulator talking to a `train-db` running on your own machine
instead of the live deployment (Android emulator reaches the host via
`10.0.2.2`). `.env.example` documents the same values for when
react-native-config gets wired up later (deliberately deferred for now).

### Single login (Phase 4D): `src/config/login.ts`

`LOGIN_PROVIDER` chooses who handles sign-in. It is built into the APK, so changing it means building a new one.

- `'raillens'` (default): RailLens' own accounts, exactly as before.
- `'railops'`: the RailOps login shared with the website. `src/features/auth/railops.ts` signs in at RailOps
  (`RAILOPS_BASE_URL`, the gateway; app endpoints that return the refresh token in the body), then asks the RailLens
  backend's `/auth/me` for the profile and admin role. Tokens stay in the Keychain as before.
  - Sign in with **email**. Registration asks for a **phone number** instead of a username; passwords need **10+
    characters**. Staff admins tap "Staff? Add your one-time code" and send it with the password; MFA setup happens
    in the RailOps staff app.
  - Change password and delete account are unchanged: RailLens forwards them to RailOps for linked accounts.
  - Each saved session remembers which login issued it. After an update that switches login, the old tokens are
    dropped (never sent to the other service) and the person signs in once more.

Switch it only after the website has switched (`DEPLOYMENT.md` Section 9b). Rollback: set `'raillens'`, build a new APK.

## Running on your own phone (Android)

1. Complete the native-folder bootstrap above once.
2. Connect your phone via USB and enable Developer Options → USB debugging.
3. Confirm the device is detected: `adb devices`.
4. With `LIVE_BASE_URL` pointed at your deployed Render backend (see above):
   ```bash
   npm install
   npm run android   # installs and launches on the connected Android device
   ```
5. The app now talks to the real backend over the internet, not your dev machine — works over wifi/cellular, no port-forwarding or same-network requirement.

## Sharing the app as a demo (no Play Store needed)

For a demo-only project, a Play Store listing isn't worth the $25 fee.
Instead, build a release APK and share the file directly:

```bash
cd android && ./gradlew assembleRelease
```

The output `.apk` (under `android/app/build/outputs/apk/release/`) can be
shared via any file link (Drive, email, etc.). The person installing it
just needs to enable "install from unknown sources" once on their phone —
no developer account, no store review, no cost.

## iOS — intentionally not built

This project skips iOS. Reasoning: a free Apple ID can only run a build on
your own registered device (7-day-renewable, via Xcode), and cannot be
shared with anyone else's phone — actual distribution (TestFlight or the
App Store) requires the $99/year Apple Developer Program. For a demo
project this isn't worth it. The app itself has no iOS-specific blocker if
that decision changes later — see the native-folder bootstrap section
above.

## Status

Functionally at full parity with train-db-frontend:

- Navigation shell, auth flow, API client with token refresh
- Trains and Stations fully wired (search, details, intelligence, favorites, route comparison, partial-journey planner)
- Journeys: source→destination search, plus the Saved Journeys screen for boarding/de-boarding segments planned from a train's route
- Auth is no longer app-wide gated: every tab is browsable signed out, matching the web app; only the Account screen prompts for sign-in
- Default-From-station preference (mirrors web's AccountClient PreferencesCard), reusable `StationAutocomplete`
- Home tab: branded hero (greeting, logo mark, stat cards, CTA buttons matching web's DashboardHeader), Quick Access, Search, Explore, Popular (view-count tracking via `popularityStore`), Railway Insights - ports web's `/` Dashboard
- Assistant: floating action button + chat dialog, byte-equivalent port of web's regex intent resolver - the mobile replacement for web's Cmd/Ctrl+K shortcut
- Rankings/Fun Facts/Achievements/Network/Stats: bespoke screens with real field-accurate UI (not a generic data dump), matching web's dedicated grid components
- Popular Searches chips (typed-query popularity, separate from viewed-entity popularity) on Train/Station search screens, plus an on-device-activity clear control on Account, both mirroring web's PopularSearchChips/PrivacyCard
- Favorites/History: per-item navigate + remove, confirm-before-clear-all, richer empty states, matching web's FavoritesList/SearchHistoryList
- Developers screen (Account → Developers): API base URL, auth/rate-limit info, endpoint examples, Swagger link
- Theme colors matched exactly to web's `globals.css` (blue primary, orange CTA accent)
- Admin Portal: stats, Dataset Health, Clear Cache, **Run Import** (confirm → trigger `POST /admin/import` → success/failure result with rows imported/failed, stats refresh on success), Forget key — full parity with web's AdminDashboard

**2026-07-30 build verification:** the app has now actually been installed and type-checked (`npm install` + `npx tsc --noEmit`), not just hand-reviewed. That surfaced a few real issues, all fixed: `@testing-library/react-native@^13.4.0` didn't exist as a published version; `@hookform/resolvers@^3.10.0` predates zod v4's API with no declared peer dep to catch it, bumped to `^5.4.1`; `react-native-vector-icons` ships no bundled types, added `@types/react-native-vector-icons`; `src/lib/jwt.ts` relied on `global.atob`/`Buffer`, neither reliably present/typed in bare Hermes - replaced with a dependency-free base64 decoder; `navigationRef.ts` needed an explicit `<any>` generic for the Assistant's cross-tab navigation calls to type-check. `tsc --noEmit` now passes clean. This repo is now a git repository with everything committed.

## Audit history

Two audit passes have been done on this app so far (2026-07-30); every
finding was fixed. Full detail in `../MOBILE_AUDIT.md`. Summary:

**Correctness pass:** `src/types/api.ts` had several response-type
mismatches against the actual backend (fields guessed instead of read from
the Java source), plus one real request bug:
- Field names fixed: `RouteStopResponse.sequenceNo`/`distance` (not `sequenceNumber`/`distanceKm`); `JourneyTrainResponse.duration` is a formatted string, not minutes; `RouteComparisonResponse` uses `trainNumberA`/`trainNumberB`; `StationResponse` is one flat `trains` list with origin/destination flags, not three separate arrays; `SmartSearchResponse` uses `recognized`/`interpretedAs`/`matchCount`
- Login was sending `{ username, password }` but the backend's `LoginRequest` requires `usernameOrEmail` - every login attempt would have 400'd
- Saved Journeys was originally built as a from→to search bookmark; it's actually a boarding/de-boarding segment on a specific train's route - rebuilt to match
- `historyStore` and `popularSearchStore` were silently writing to the same MMKV key with different shapes - fixed by removing the duplicate tracking from `historyStore`

**Follow-up pass:** a full file-by-file re-audit found one remaining gap -
mobile's Admin Portal had no "Run import" trigger at all, while web's
`AdminDashboard.tsx` has a working confirm → run → result flow against
`POST /admin/import`. Added `ImportResult` type, `triggerImport()`, and the
matching confirm-before-run UI (plus Forget key / manual refresh, also
missing). Every other file in `src/` was re-checked against backend source
or its web equivalent and found correct - see `MOBILE_AUDIT.md` for the
full "reviewed, no issue" list.

## Release status

See the release tracker in [`DEPLOYMENT.md`](DEPLOYMENT.md), Section 2.
