# Ace of Spades — 4-Player Bidding Card Game

A real-time multiplayer scaffold: React Native (Expo) client + Node.js/Socket.io
server, implementing the 13-round bidding trick-taking game from your rules
and scorecard.

## Project layout

```
ace-of-spades/
  server/     Node.js + Socket.io backend (game rules engine, room/lobby)
  mobile/     React Native (Expo) app — 4 players, one device each
```

## Running it locally

### 1. Server
```bash
cd server
npm install
npm run dev        # starts on http://localhost:4000
```

### 2. Mobile app
```bash
cd mobile
npm install
```
Edit `mobile/src/config.js` and set `SERVER_URL` to your computer's LAN IP
(e.g. `http://192.168.1.23:4000`) — `localhost` only works in a simulator on
the same machine, not on physical phones.

```bash
npx expo start
```
Scan the QR code with Expo Go (or run `npm run android` / `npm run ios`) on
four separate phones/simulators. One player creates a room, the other three
join with the room code.

## How the rules were implemented

- **Deck & dealing**: standard 52-card deck, dealt fresh each round with a
  Fisher–Yates shuffle. Round *N* deals *N* cards to each of the 4 players.
- **Trick resolution**: Spade is always trump. If any spade is played in a
  sub-round, the highest spade wins; otherwise the highest card of the suit
  that was led wins. Players must follow the led suit if they can.
- **Bidding tiers** (from your notes):
  | Rounds | Min bid | Points per sub-round won | Under-bid penalty |
  |---|---|---|---|
  | 1–4   | 0 | 10 | −10 × bid |
  | 5–8   | 1 | 20 | −10 × bid |
  | 9–11  | 2 | 30 | −30 × bid |
  | 12–13 | 3 | 40 | −10 × bid |
- **Overbid bonus**: if a player wins more sub-rounds than bid, they earn
  `bid × perWin + (won − bid) × (perWin / 2)` — matches your Round 8 example
  (bid 4, won 6 → 4×20 + 2×10 = 100).
- **Turn order**: bidding proceeds anticlockwise each round and ends on the
  seat that won the previous round's final sub-round (so that player bids
  last), per rule 6.

### Two things worth double-checking with your group before you rely on this build
1. **Rounds 9–11 penalty**: your notes say `-30 * bid` there, vs. `-10 * bid`
   everywhere else. I implemented it exactly as written — confirm it wasn't a
   slip of the pen.
2. **Rule 6, "reveals card last"**: I implemented the standard trick-taking
   convention (the previous round's winner leads the *first* sub-round of the
   next round, since they're last to *bid*). If you actually meant that
   player plays their card *last* in that first sub-round (not first), that's
   a small, clearly-marked change in `server/src/gameEngine.js` (see the
   comment block at the top of that file).

## What's here vs. what's next

**Implemented**: full rules engine (bidding, legal-card enforcement, trick
resolution, scoring incl. bonus/penalty), Socket.io room/lobby with 4-seat
matchmaking, all four core screens (lobby, bidding, play, scoreboard), and a
fancy shuffle animation between rounds.

**Not yet built** (natural next steps): persistent accounts/auth, reconnect
handling after a dropped connection, push notifications for "your turn",
spectator mode, and a deployed production server (Render/Fly.io/Railway all
work well for the Socket.io backend — just set `SERVER_URL` in the mobile app
to the deployed URL).
