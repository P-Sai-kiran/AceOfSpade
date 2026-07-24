# Ace of Spades — Production Build Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | https://nodejs.org |
| npm | ≥ 9 | bundled with Node |
| Expo CLI | latest | `npm i -g expo-cli` |
| EAS CLI | latest | `npm i -g eas-cli` |
| Expo account | — | https://expo.dev/signup |

---

## Step 1 — Set your server URL

Edit `mobile/src/config.js`:

```js
// For production, use your deployed server URL:
export const SERVER_URL = "https://your-server.com";

// For local testing on a physical device:
// export const SERVER_URL = "http://192.168.x.x:4000";  ← your LAN IP
```

---

## Step 2 — Deploy the server

The server runs on any Node.js host (Railway, Render, Fly.io, etc.).

```bash
cd server
npm install
npm start          # runs on PORT env variable or 4000
```

**Railway (recommended, free tier available):**
1. Push the `server/` folder to a GitHub repo
2. Connect to Railway → New Project → Deploy from GitHub
3. Railway auto-detects Node.js; start command is `npm start`
4. Copy the deployed URL into `mobile/src/config.js`

---

## Step 3 — Run the tests

```bash
cd server
node tests/unit.test.js       # 46 unit tests
node tests/scenarios.test.js  # 20 scenario tests
node tests/smoke.test.js      # 16 smoke tests
# Expected: 82 passed, 0 failed
```

---

## Step 4 — Build the APK / AAB

### 4a. One-time EAS setup (run once per machine)

```bash
cd mobile
npm install
eas login                       # sign in to your Expo account
eas init                        # creates/links your EAS project
```

After `eas init`, copy the generated `projectId` into `mobile/app.json`:
```json
"extra": { "eas": { "projectId": "PASTE_HERE" } }
```

### 4b. Build a preview APK (for direct install / testing)

```bash
cd mobile
eas build --platform android --profile preview
```

- EAS builds in the cloud (~10–15 min)
- Downloads a `.apk` file when done
- Install on Android: `adb install <file>.apk`  
  or share the download link with testers

### 4c. Build a production AAB (for Google Play Store)

```bash
eas build --platform android --profile production
```

Then submit:
```bash
eas submit --platform android
```

### 4d. Build for iOS (TestFlight / App Store)

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

---

## Step 5 — Quick local test (Expo Go)

For a fast dev loop without building:

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android/iOS) on the same Wi-Fi as your dev machine.

---

## Project structure

```
ace-of-spades/
├── server/                   Node.js + Socket.io backend
│   ├── src/
│   │   ├── gameEngine.js     Full rules engine (all 29 rules)
│   │   ├── deck.js           Card creation, shuffle, trick resolution
│   │   ├── rooms.js          Room/lobby management
│   │   └── index.js          Express + Socket.io entrypoint
│   └── tests/
│       ├── unit.test.js      46 unit tests
│       ├── scenarios.test.js 20 scenario tests
│       └── smoke.test.js     16 smoke tests
│
└── mobile/                   Expo React Native app
    ├── App.js                Root + phase-driven navigator
    ├── eas.json              EAS build profiles
    ├── src/
    │   ├── theme/index.js    Design tokens (dark green + gold)
    │   ├── context/          GameContext (socket state)
    │   ├── services/         socket.js (API layer + reconnect)
    │   ├── components/
    │   │   ├── PlayingCard.js  Card face + card back
    │   │   ├── OvalTable.js    Felt table with 4 player positions
    │   │   ├── TurnTimer.js    20s countdown ring
    │   │   └── ShuffleAnimation.js  Deal animation
    │   └── screens/
    │       ├── SplashScreen.js
    │       ├── HomeScreen.js
    │       ├── CreateJoinScreen.js
    │       ├── LobbyScreen.js
    │       ├── BiddingScreen.js       Private bid + order indicator
    │       ├── BidsDisclosedScreen.js  Simultaneous reveal (3s)
    │       ├── GameTableScreen.js      Oval table, trick play
    │       ├── RoundScoreScreen.js     Per-round results
    │       └── MatchSummaryScreen.js   Final standings + scorecard
```

---

## Environment variables (server)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4000 | HTTP + Socket.io port |
| `NODE_ENV` | development | Set to `production` for server |

---

## Test results (CI baseline — 82/82)

```
UNIT TESTS       46 passed, 0 failed
SCENARIO TESTS   20 passed, 0 failed
SMOKE TESTS      16 passed, 0 failed
─────────────────────────────────────
TOTAL            82 passed, 0 failed
```
