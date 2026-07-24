// gameEngine.js — Official Rulebook v1.0 compliant engine
//
// Rule 20 play order: the player who wins the LAST trick of round N gets two
// advantages for round N+1:
//   1. They bid LAST (others bid in order, advantage seat bids last).
//   2. They play LAST in EVERY trick of round N+1 — the play order is FIXED
//      for the whole round and does NOT change when someone wins an internal trick.
//
// Bidding is SIMULTANEOUS (Rule 11): all 4 players submit their bid in secret;
// the server reveals all bids at once after the last player submits.
//
// For round 1, a random seat is chosen as the initial "advantage" player.

const { dealRound, resolveTrick } = require("./deck");

const SEATS = [0, 1, 2, 3];

// ─── Order helpers ────────────────────────────────────────────────────────────
// Rule 20 example: A(0) wins last trick → Round next order: B→C→D→A = [1,2,3,0]
// Pattern: start at (advantageSeat+1)%4, go +1 mod 4, end at advantageSeat.
function buildPlayOrder(advantageSeat) {
  return [
    (advantageSeat + 1) % 4,
    (advantageSeat + 2) % 4,
    (advantageSeat + 3) % 4,
    advantageSeat,
  ];
}
// Bidding order is identical to play order (Rule 20: bid last = play last).
const buildBiddingOrder = buildPlayOrder;

// ─── Scoring tiers ────────────────────────────────────────────────────────────
// Source: Rulebook section 18 (all four tiers fully specified).
function tierForRound(round) {
  if (round >= 1 && round <= 4)  return { minBid: 0, perWin: 10, penaltyMult: 10 };
  if (round >= 5 && round <= 8)  return { minBid: 1, perWin: 20, penaltyMult: 20 };
  if (round >= 9 && round <= 11) return { minBid: 2, perWin: 30, penaltyMult: 30 };
  if (round >= 12 && round <= 13)return { minBid: 3, perWin: 40, penaltyMult: 40 };
  throw new Error(`Invalid round number: ${round}`);
}

// Rule 18 + Rule 19 (bonus).
// If won >= bid: bid×perWin + (won−bid)×(perWin÷2)   [Rule 19 bonus example verified]
// If won < bid : −(penaltyMult × bid)
function scoreForPlayer(round, bid, won) {
  const { perWin, penaltyMult } = tierForRound(round);
  if (won >= bid) {
    return bid * perWin + (won - bid) * (perWin / 2);
  }
  return -(penaltyMult * bid);
}

// ─── Game creation ────────────────────────────────────────────────────────────
function createGame(gameId, playerNames) {
  if (playerNames.length !== 4) throw new Error("Requires exactly 4 players");
  return {
    gameId,
    players: playerNames.map((name, seat) => ({
      seat,
      name,
      totalScore: 0,
      totalTricksWon: 0, // tie-breaker 1 (Rule 22)
      accurateBids: 0,   // tie-breaker 2 (Rule 22)
    })),
    round: 0,
    phase: "lobby",
    hands: [[], [], [], []],
    // Bidding — blind simultaneous submission
    bids: {},           // seat → bid value (hidden until all 4 submitted)
    bidsSubmitted: {},  // seat → true (public: shows who has submitted)
    // Round-level order (fixed for all tricks in the round)
    advantageSeat: null,   // null until round 1 random pick
    trickPlayOrder: [],    // [first, second, third, last=advantageSeat]
    // Current trick
    currentTrick: { plays: [], baseSuit: null },
    lastTrickWinner: null,
    history: [],
    finalRankings: null,
  };
}

// ─── Round lifecycle ──────────────────────────────────────────────────────────
function startRound(game) {
  game.round += 1;

  // Round 1: server picks a random advantage seat (Rule 9).
  if (game.advantageSeat === null) {
    game.advantageSeat = Math.floor(Math.random() * 4);
  }

  game.hands = dealRound(game.round);
  game.bids = {};
  game.bidsSubmitted = {};
  game.tricksWonThisRound = { 0: 0, 1: 0, 2: 0, 3: 0 };
  game.currentTrick = { plays: [], baseSuit: null };
  game.lastTrickWinner = null;
  game.trickPlayOrder = buildPlayOrder(game.advantageSeat);
  game.phase = "bidding";
  return game;
}

// ─── Bidding ─────────────────────────────────────────────────────────────────
// Any player may submit their bid at any time during the bidding phase.
// Bids are revealed simultaneously when all 4 have submitted (Rule 11).
function placeBid(game, seat, bid) {
  if (game.phase !== "bidding") throw new Error("Not in bidding phase");
  if (game.bidsSubmitted[seat])  throw new Error("You have already submitted a bid");

  const { minBid } = tierForRound(game.round);
  if (bid < minBid || bid > game.round) {
    throw new Error(`Bid must be between ${minBid} and ${game.round} for this round`);
  }

  game.bids[seat] = bid;
  game.bidsSubmitted[seat] = true;

  if (Object.keys(game.bidsSubmitted).length === 4) {
    // All bids in — reveal and start playing (Rule 11).
    game.phase = "bids-revealed"; // server advances to "playing" after 3s
  }
  return game;
}

// ─── Card play ────────────────────────────────────────────────────────────────
// The play order is FIXED for every trick in the round (Rule 20).
// trickPlayOrder[plays.length] tells us whose turn it is.
function currentSeatToPlay(game) {
  if (game.phase !== "playing") return null;
  return game.trickPlayOrder[game.currentTrick.plays.length];
}

function legalCards(hand, baseSuit) {
  if (!baseSuit) return hand; // leading — any card legal
  const followSuit = hand.filter((c) => c.suit === baseSuit);
  return followSuit.length > 0 ? followSuit : hand; // must follow if possible (Rule 14)
}

function playCard(game, seat, cardId) {
  if (game.phase !== "playing") throw new Error("Not in playing phase");

  const expected = currentSeatToPlay(game);
  if (expected !== seat) throw new Error(`Not your turn (expected seat ${expected})`);

  const hand = game.hands[seat];
  const cardIdx = hand.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) throw new Error("Card not in your hand");
  const card = hand[cardIdx];

  const legal = legalCards(hand, game.currentTrick.baseSuit);
  if (!legal.some((c) => c.id === cardId)) {
    throw new Error("Must follow lead suit when you have it (Rule 14)");
  }

  // Remove from hand, record play.
  hand.splice(cardIdx, 1);
  if (game.currentTrick.plays.length === 0) {
    game.currentTrick.baseSuit = card.suit; // first card sets lead suit
  }
  game.currentTrick.plays.push({ seat, card });

  // Trick complete?
  if (game.currentTrick.plays.length === 4) {
    const winnerSeat = resolveTrick(game.currentTrick.plays, game.currentTrick.baseSuit);
    game.tricksWonThisRound[winnerSeat] += 1;
    game.lastTrickWinner = winnerSeat;

    const tricksPlayed = Object.values(game.tricksWonThisRound).reduce((a, b) => a + b, 0);
    if (tricksPlayed === game.round) {
      finishRound(game);
    } else {
      // Next trick — same fixed play order, fresh plays array (Rule 20).
      game.currentTrick = { plays: [], baseSuit: null };
    }
  }
  return game;
}

// ─── Round end ────────────────────────────────────────────────────────────────
function finishRound(game) {
  const round = game.round;
  const summary = {
    round,
    bids: { ...game.bids },
    tricksWon: { ...game.tricksWonThisRound },
    scores: {},
  };

  for (const seat of SEATS) {
    const bid = game.bids[seat];
    const won = game.tricksWonThisRound[seat];
    const pts  = scoreForPlayer(round, bid, won);
    summary.scores[seat] = pts;
    game.players[seat].totalScore      += pts;
    game.players[seat].totalTricksWon  += won;
    if (won === bid) game.players[seat].accurateBids += 1;
  }

  game.history.push(summary);

  // Rule 20: winner of the LAST trick of this round gets advantage next round.
  game.advantageSeat = game.lastTrickWinner;
  game.phase = round >= 13 ? "game-end" : "round-end";

  if (game.phase === "game-end") {
    game.finalRankings = computeRankings(game.players);
  }
  return game;
}

// Rule 22: tie-breaking order.
function computeRankings(players) {
  return [...players]
    .sort((a, b) => {
      if (b.totalScore      !== a.totalScore)      return b.totalScore      - a.totalScore;
      if (b.totalTricksWon  !== a.totalTricksWon)  return b.totalTricksWon  - a.totalTricksWon;
      if (b.accurateBids    !== a.accurateBids)     return b.accurateBids    - a.accurateBids;
      return 0; // shared position
    })
    .map((p, i) => ({ seat: p.seat, name: p.name, rank: i + 1 }));
}

module.exports = {
  createGame, startRound, placeBid, playCard,
  currentSeatToPlay, legalCards, scoreForPlayer, tierForRound,
  buildPlayOrder, buildBiddingOrder, computeRankings,
};

// Called by the server 3 seconds after bids-revealed to start card play.
function startPlaying(game) {
  game.phase = "playing";
  return game;
}
module.exports.startPlaying = startPlaying;
