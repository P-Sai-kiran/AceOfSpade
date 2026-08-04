// gameEngine.js — Ace of Spades rules engine (final)
//
// Bidding is SEQUENTIAL and VISIBLE (custom rule, by request): players bid in
// turn order (trickPlayOrder), and each locked bid is immediately visible to
// everyone — not blind/simultaneous as the original rulebook specified.
//
// Rule 20 play order: the winner of the LAST trick of round N bids AND plays
// LAST in round N+1. Play order is fixed for every trick in the round.

const { dealRound, resolveTrick } = require("./deck");
const SEATS = [0, 1, 2, 3];

function buildPlayOrder(advantageSeat) {
  return [(advantageSeat+1)%4, (advantageSeat+2)%4, (advantageSeat+3)%4, advantageSeat];
}
const buildBiddingOrder = buildPlayOrder;

function tierForRound(round) {
  if (round >= 1 && round <= 4)  return { minBid:0, perWin:10, penaltyMult:10 };
  if (round >= 5 && round <= 8)  return { minBid:1, perWin:20, penaltyMult:20 };
  if (round >= 9 && round <= 11) return { minBid:2, perWin:30, penaltyMult:30 };
  if (round >= 12 && round <= 13)return { minBid:3, perWin:40, penaltyMult:40 };
  throw new Error(`Invalid round number: ${round}`);
}

function scoreForPlayer(round, bid, won) {
  const { perWin, penaltyMult } = tierForRound(round);
  if (won >= bid) return bid * perWin + (won - bid) * (perWin / 2);
  return -(penaltyMult * bid);
}

function createGame(gameId, playerNames) {
  if (playerNames.length !== 4) throw new Error("Requires exactly 4 players");
  return {
    gameId,
    players: playerNames.map((name, seat) => ({ seat, name, totalScore:0, totalTricksWon:0, accurateBids:0 })),
    round: 0,
    phase: "lobby",
    hands: [[], [], [], []],
    bids: {},
    bidsSubmitted: {},
    advantageSeat: null,
    trickPlayOrder: [],
    currentTrick: { plays: [], baseSuit: null },
    lastTrickWinner: null,
    history: [],
    finalRankings: null,
  };
}

function startRound(game) {
  game.round += 1;
  if (game.advantageSeat === null) game.advantageSeat = Math.floor(Math.random()*4);
  game.hands = dealRound(game.round);
  game.bids = {};
  game.bidsSubmitted = {};
  game.tricksWonThisRound = { 0:0, 1:0, 2:0, 3:0 };
  game.currentTrick = { plays: [], baseSuit: null };
  game.lastTrickWinner = null;
  game.trickPlayOrder = buildPlayOrder(game.advantageSeat);
  game.phase = "bidding";
  return game;
}

// Whose turn it is to bid — follows trickPlayOrder, same as card play order.
function currentBidder(game) {
  if (game.phase !== "bidding") return null;
  const count = Object.keys(game.bidsSubmitted).length;
  return game.trickPlayOrder[count] ?? null;
}

function placeBid(game, seat, bid) {
  if (game.phase !== "bidding") throw new Error("Not in bidding phase");
  const expected = currentBidder(game);
  if (expected !== seat) throw new Error("Not your turn to bid yet");

  const { minBid } = tierForRound(game.round);
  if (bid < minBid || bid > game.round) {
    throw new Error(`Bid must be between ${minBid} and ${game.round} for this round`);
  }

  game.bids[seat] = bid;
  game.bidsSubmitted[seat] = true;

  if (Object.keys(game.bidsSubmitted).length === 4) {
    game.phase = "bids-revealed"; // server advances to "playing" after 3s
  }
  return game;
}

function currentSeatToPlay(game) {
  if (game.phase !== "playing") return null;
  return game.trickPlayOrder[game.currentTrick.plays.length];
}

function legalCards(hand, baseSuit) {
  if (!baseSuit) return hand;
  const followSuit = hand.filter(c => c.suit === baseSuit);
  return followSuit.length > 0 ? followSuit : hand;
}

function playCard(game, seat, cardId) {
  if (game.phase !== "playing") throw new Error("Not in playing phase");
  const expected = currentSeatToPlay(game);
  if (expected !== seat) throw new Error(`Not your turn (expected seat ${expected})`);

  const hand = game.hands[seat];
  const cardIdx = hand.findIndex(c => c.id === cardId);
  if (cardIdx === -1) throw new Error("Card not in your hand");
  const card = hand[cardIdx];

  const legal = legalCards(hand, game.currentTrick.baseSuit);
  if (!legal.some(c => c.id === cardId)) throw new Error("Must follow lead suit when you have it");

  hand.splice(cardIdx, 1);
  if (game.currentTrick.plays.length === 0) game.currentTrick.baseSuit = card.suit;
  game.currentTrick.plays.push({ seat, card });

  if (game.currentTrick.plays.length === 4) {
    const winnerSeat = resolveTrick(game.currentTrick.plays, game.currentTrick.baseSuit);
    game.tricksWonThisRound[winnerSeat] += 1;
    game.lastTrickWinner = winnerSeat;

    const tricksPlayed = Object.values(game.tricksWonThisRound).reduce((a,b)=>a+b,0);
    if (tricksPlayed === game.round) finishRound(game);
    else game.currentTrick = { plays: [], baseSuit: null };
  }
  return game;
}

function finishRound(game) {
  const round = game.round;
  const summary = { round, bids:{...game.bids}, tricksWon:{...game.tricksWonThisRound}, scores:{} };

  for (const seat of SEATS) {
    const bid = game.bids[seat];
    const won = game.tricksWonThisRound[seat];
    const pts = scoreForPlayer(round, bid, won);
    summary.scores[seat] = pts;
    game.players[seat].totalScore += pts;
    game.players[seat].totalTricksWon += won;
    if (won === bid) game.players[seat].accurateBids += 1;
  }

  game.history.push(summary);
  game.advantageSeat = game.lastTrickWinner;
  game.phase = round >= 13 ? "game-end" : "round-end";
  if (game.phase === "game-end") game.finalRankings = computeRankings(game.players);
  return game;
}

function computeRankings(players) {
  return [...players]
    .sort((a,b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.totalTricksWon !== a.totalTricksWon) return b.totalTricksWon - a.totalTricksWon;
      if (b.accurateBids !== a.accurateBids) return b.accurateBids - a.accurateBids;
      return 0;
    })
    .map((p,i) => ({ seat:p.seat, name:p.name, rank:i+1 }));
}

function startPlaying(game) {
  game.phase = "playing";
  return game;
}

module.exports = {
  createGame, startRound, placeBid, playCard, startPlaying,
  currentSeatToPlay, currentBidder, legalCards, scoreForPlayer, tierForRound,
  buildPlayOrder, buildBiddingOrder, computeRankings,
};