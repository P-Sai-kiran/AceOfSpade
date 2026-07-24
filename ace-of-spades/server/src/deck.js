// deck.js — card model, deck creation, shuffling, and rank/suit priority helpers

const SUITS = ["spade", "diamond", "club", "heart"];
// Trick-taking priority within a suit (index = strength, higher = stronger)
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

function buildDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${rank}_${suit}`, rank, suit });
    }
  }
  return deck;
}

// Fisher-Yates shuffle. Returns a new array — does not mutate input.
function shuffle(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Deal `roundNumber` cards to each of the 4 players from a freshly shuffled deck.
// Returns { hands: [ [cards], [cards], [cards], [cards] ] }
function dealRound(roundNumber) {
  const shuffled = shuffle(buildDeck());
  const hands = [[], [], [], []];
  const cardsNeeded = roundNumber * 4;
  const dealt = shuffled.slice(0, cardsNeeded);
  dealt.forEach((card, idx) => {
    hands[idx % 4].push(card);
  });
  return hands;
}

function rankValue(rank) {
  return RANKS.indexOf(rank);
}

// Determines the winner of a single sub-round (trick).
// plays: array of { seat, card } in the order they were played.
// baseSuit: the suit of the first card played (the "base card").
// Rule: Spade is always trump. If any spade was played, the highest spade wins.
// Otherwise, the highest card of the base suit wins.
function resolveTrick(plays, baseSuit) {
  const spadesPlayed = plays.filter((p) => p.card.suit === "spade");
  const pool = spadesPlayed.length > 0
    ? spadesPlayed
    : plays.filter((p) => p.card.suit === baseSuit);

  let winner = pool[0];
  for (const p of pool) {
    if (rankValue(p.card.rank) > rankValue(winner.card.rank)) {
      winner = p;
    }
  }
  return winner.seat;
}

module.exports = { SUITS, RANKS, buildDeck, shuffle, dealRound, rankValue, resolveTrick };
