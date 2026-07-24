// Unit tests — gameEngine pure functions and deck utilities
"use strict";
const { describe, it, expect, expectThrow, summary } = require("./runner");
const {
  tierForRound, scoreForPlayer, buildPlayOrder,
  createGame, startRound, placeBid, playCard,
  currentSeatToPlay, legalCards,
} = require("../src/gameEngine");
const { resolveTrick, dealRound, shuffle, rankValue } = require("../src/deck");

// ─── tierForRound ──────────────────────────────────────────────────────────
describe("tierForRound — all 4 tiers (Rulebook §19)", () => {
  it("Round 1 → 10pts, penalty 10×, minBid 0", () =>
    expect(tierForRound(1)).toEqual({ minBid:0, perWin:10, penaltyMult:10 }));
  it("Round 4 → same as round 1", () =>
    expect(tierForRound(4)).toEqual({ minBid:0, perWin:10, penaltyMult:10 }));
  it("Round 5 → 20pts, penalty 20×, minBid 1", () =>
    expect(tierForRound(5)).toEqual({ minBid:1, perWin:20, penaltyMult:20 }));
  it("Round 8 → same as round 5", () =>
    expect(tierForRound(8)).toEqual({ minBid:1, perWin:20, penaltyMult:20 }));
  it("Round 9 → 30pts, penalty 30×, minBid 2", () =>
    expect(tierForRound(9)).toEqual({ minBid:2, perWin:30, penaltyMult:30 }));
  it("Round 11 → same as round 9", () =>
    expect(tierForRound(11)).toEqual({ minBid:2, perWin:30, penaltyMult:30 }));
  it("Round 12 → 40pts, penalty 40×, minBid 3", () =>
    expect(tierForRound(12)).toEqual({ minBid:3, perWin:40, penaltyMult:40 }));
  it("Round 13 → same as round 12", () =>
    expect(tierForRound(13)).toEqual({ minBid:3, perWin:40, penaltyMult:40 }));
  it("Invalid round throws", () => expectThrow(() => tierForRound(14)));
});

// ─── scoreForPlayer ────────────────────────────────────────────────────────
describe("scoreForPlayer — Rulebook §20 bonus + §21 penalty", () => {
  // Rulebook §20 example: Round 8, bid=4, won=6 → 4×20 + 2×10 = 100
  it("Round 8 bid=4 won=6 → 100 (rulebook bonus example)", () =>
    expect(scoreForPlayer(8, 4, 6)).toBe(100));
  // Rulebook §21 example: Round 10, bid=5, won=3 → -(5×30) = -150
  it("Round 10 bid=5 won=3 → -150 (rulebook penalty example)", () =>
    expect(scoreForPlayer(10, 5, 3)).toBe(-150));
  // Exact bid (won === bid) — no bonus, no penalty
  it("Round 1 bid=1 won=1 → 10 (hit bid exactly)", () =>
    expect(scoreForPlayer(1, 1, 1)).toBe(10));
  it("Round 5 bid=3 won=3 → 60 (hit bid exactly)", () =>
    expect(scoreForPlayer(5, 3, 3)).toBe(60));
  // Bid=0 scenarios
  it("Round 1 bid=0 won=0 → 0 (bid 0, won 0, rounds 1-4)", () =>
    expect(scoreForPlayer(1, 0, 0)).toBe(0));
  it("Round 1 bid=0 won=1 → 5 (overbid bonus: 0×10 + 1×5)", () =>
    expect(scoreForPlayer(1, 0, 1)).toBe(5));
  // Penalty cases
  it("Round 3 bid=2 won=0 → -20 (penalty: 2×10)", () =>
    expect(scoreForPlayer(3, 2, 0)).toBe(-20));
  it("Round 6 bid=3 won=1 → -60 (penalty: 3×20)", () =>
    expect(scoreForPlayer(6, 3, 1)).toBe(-60));
  it("Round 13 bid=3 won=0 → -120 (penalty: 3×40)", () =>
    expect(scoreForPlayer(13, 3, 0)).toBe(-120));
  // Overwin in high-value round
  it("Round 12 bid=4 won=6 → 4×40 + 2×20 = 200", () =>
    expect(scoreForPlayer(12, 4, 6)).toBe(200));
});

// ─── buildPlayOrder ────────────────────────────────────────────────────────
describe("buildPlayOrder — Rule 22/23 (advantage player always last)", () => {
  // Rulebook example: A(0) wins → B→C→D→A = [1,2,3,0]
  it("advantageSeat=0 → [1,2,3,0]", () => expect(buildPlayOrder(0)).toEqual([1,2,3,0]));
  it("advantageSeat=1 → [2,3,0,1]", () => expect(buildPlayOrder(1)).toEqual([2,3,0,1]));
  // Rulebook example: C(2) wins → D→A→B→C = [3,0,1,2]
  it("advantageSeat=2 → [3,0,1,2]", () => expect(buildPlayOrder(2)).toEqual([3,0,1,2]));
  it("advantageSeat=3 → [0,1,2,3]", () => expect(buildPlayOrder(3)).toEqual([0,1,2,3]));
  it("advantage seat is always last in order", () => {
    [0,1,2,3].forEach(s => {
      const order = buildPlayOrder(s);
      expect(order[3]).toBe(s);
    });
  });
  it("all 4 seats appear exactly once", () => {
    const order = buildPlayOrder(2);
    expect([...order].sort((a,b)=>a-b)).toEqual([0,1,2,3]);
  });
});

// ─── resolveTrick ──────────────────────────────────────────────────────────
describe("resolveTrick — Rules 17/18 (trump + lead-suit logic)", () => {
  const c = (rank, suit, seat) => ({ seat, card: { id:`${rank}_${suit}`, rank, suit } });

  it("No spades: highest lead-suit wins (♦A beats ♦Q)", () => {
    const plays = [c("A","diamond",0), c("Q","diamond",1), c("5","diamond",2), c("7","diamond",3)];
    expect(resolveTrick(plays, "diamond")).toBe(0);
  });
  it("No spades: non-lead suit cards lose (♥A loses to ♣J)", () => {
    // Lead is club, heart and diamond don't count
    const plays = [c("10","club",0), c("A","heart",1), c("K","diamond",2), c("J","club",3)];
    expect(resolveTrick(plays, "club")).toBe(3); // ♣J wins
  });
  it("One spade beats any non-spade including ♦A", () => {
    const plays = [c("A","diamond",0), c("Q","diamond",1), c("2","spade",2), c("K","diamond",3)];
    expect(resolveTrick(plays, "diamond")).toBe(2); // ♠2 wins
  });
  it("Multiple spades: highest spade wins (♠K beats ♠2)", () => {
    const plays = [c("A","diamond",0), c("Q","diamond",1), c("2","spade",2), c("K","spade",3)];
    expect(resolveTrick(plays, "diamond")).toBe(3); // ♠K wins
  });
  it("Ace of Spades is highest card in game", () => {
    const plays = [c("A","spade",0), c("K","spade",1), c("Q","spade",2), c("J","spade",3)];
    expect(resolveTrick(plays, "spade")).toBe(0); // ♠A wins
  });
  it("Lead is spade: all non-spades lose to ♠2", () => {
    const plays = [c("2","spade",0), c("A","heart",1), c("A","diamond",2), c("A","club",3)];
    expect(resolveTrick(plays, "spade")).toBe(0); // ♠2 still wins
  });
});

// ─── legalCards ────────────────────────────────────────────────────────────
describe("legalCards — Rule 15 (must follow lead suit)", () => {
  const card = (r, s) => ({ id:`${r}_${s}`, rank:r, suit:s });
  const hand = [card("A","diamond"), card("K","spade"), card("Q","club")];

  it("No base suit (leading): all cards legal", () =>
    expect(legalCards(hand, null).length).toBe(3));
  it("Has lead suit: only that suit is legal", () => {
    const result = legalCards(hand, "diamond");
    expect(result.length).toBe(1);
    expect(result[0].suit).toBe("diamond");
  });
  it("No cards of lead suit: all cards legal (any can be played)", () => {
    const noClub = [card("A","diamond"), card("K","spade")];
    expect(legalCards(noClub, "club").length).toBe(2);
  });
  it("Spade in hand does not force spade play when lead is diamond", () => {
    // Player must follow diamond, not forced to play spade (spade is only trump in winning)
    const result = legalCards(hand, "diamond");
    expect(result.every(c => c.suit === "diamond")).toBe(true);
  });
});

// ─── placeBid validation ───────────────────────────────────────────────────
describe("placeBid — bid range enforcement (Rule 11)", () => {
  function freshGame(round) {
    const g = createGame("t", ["A","B","C","D"]);
    // Manually set round and phase to test bid validation
    g.round = round;
    g.trickPlayOrder = buildPlayOrder(0);
    g.phase = "bidding";
    g.hands = dealRound(round);
    return g;
  }

  it("Bid below minimum for rounds 5-8 rejected", () => {
    const g = freshGame(5); // minBid = 1
    expectThrow(() => placeBid(g, 0, 0), "1");
  });
  it("Bid above round number rejected", () => {
    const g = freshGame(3); // max = 3
    expectThrow(() => placeBid(g, 0, 4));
  });
  it("Valid bid accepted", () => {
    const g = freshGame(5);
    placeBid(g, 0, 1);
    expect(g.bidsSubmitted[0]).toBe(true);
    expect(g.bids[0]).toBe(1);
  });
  it("Duplicate bid rejected", () => {
    const g = freshGame(3);
    placeBid(g, 0, 0);
    expectThrow(() => placeBid(g, 0, 0), "already");
  });
  it("Phase stays 'bidding' until all 4 bids submitted", () => {
    const g = freshGame(3);
    placeBid(g, 0, 0); placeBid(g, 1, 0); placeBid(g, 2, 0);
    expect(g.phase).toBe("bidding");
  });
  it("Phase becomes 'bids-revealed' when 4th bid submitted", () => {
    const g = freshGame(3);
    placeBid(g, 0, 0); placeBid(g, 1, 0); placeBid(g, 2, 0); placeBid(g, 3, 0);
    expect(g.phase).toBe("bids-revealed");
  });
});

// ─── deck ──────────────────────────────────────────────────────────────────
describe("deck utilities", () => {
  it("dealRound(1) gives 1 card to each of 4 seats", () => {
    const hands = dealRound(1);
    expect(hands.length).toBe(4);
    hands.forEach(h => expect(h.length).toBe(1));
  });
  it("dealRound(13) gives 13 cards to each seat = 52 total", () => {
    const hands = dealRound(13);
    const total = hands.reduce((s, h) => s + h.length, 0);
    expect(total).toBe(52);
  });
  it("No duplicate cards in a deal", () => {
    const hands = dealRound(13);
    const ids = hands.flat().map(c => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(52);
  });
  it("shuffle returns array of same length", () => {
    const d = dealRound(13).flat();
    const s = shuffle(d);
    expect(s.length).toBe(d.length);
  });
  it("rankValue: A > K > Q > 2", () => {
    expect(rankValue("A") > rankValue("K")).toBe(true);
    expect(rankValue("K") > rankValue("Q")).toBe(true);
    expect(rankValue("Q") > rankValue("2")).toBe(true);
  });
});

summary();
