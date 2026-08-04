// deck.js — card model, deck creation, shuffling, trick resolution
const SUITS = ["spade", "diamond", "club", "heart"];
const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

function buildDeck() {
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ id:`${rank}_${suit}`, rank, suit });
  return deck;
}

function shuffle(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function dealRound(roundNumber) {
  const shuffled = shuffle(buildDeck());
  const hands = [[], [], [], []];
  const dealt = shuffled.slice(0, roundNumber * 4);
  dealt.forEach((card, idx) => hands[idx % 4].push(card));
  return hands;
}

function rankValue(rank) { return RANKS.indexOf(rank); }

// Spade is always trump. Highest spade wins if any spade played;
// otherwise highest card of the led suit wins.
function resolveTrick(plays, baseSuit) {
  const spadesPlayed = plays.filter(p => p.card.suit === "spade");
  const pool = spadesPlayed.length > 0 ? spadesPlayed : plays.filter(p => p.card.suit === baseSuit);
  let winner = pool[0];
  for (const p of pool) if (rankValue(p.card.rank) > rankValue(winner.card.rank)) winner = p;
  return winner.seat;
}

module.exports = { SUITS, RANKS, buildDeck, shuffle, dealRound, rankValue, resolveTrick };