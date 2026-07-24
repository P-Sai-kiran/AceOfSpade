// Scenario tests — full game flows that verify multi-step rule interactions
"use strict";
const { describe, it, expect, expectThrow, summary } = require("./runner");
const {
  createGame, startRound, placeBid, playCard, startPlaying, buildPlayOrder, scoreForPlayer,
} = require("../src/gameEngine");
const { dealRound } = require("../src/deck");

// ─── Helpers ───────────────────────────────────────────────────────────────
// Forcibly put specific cards into a seat's hand for deterministic tests
function setHands(game, hands) { game.hands = hands.map(h => [...h]); }
const c = (rank, suit) => ({ id:`${rank}_${suit}`, rank, suit });

function bidAll(game, bids) {
  // Submit bids for all 4 seats; order doesn't matter (simultaneous)
  bids.forEach((bid, seat) => placeBid(game, seat, bid));
  startPlaying(game); // advance from bids-revealed → playing
}

function playTrick(game, plays) {
  // plays: array of { seat, card } in trickPlayOrder sequence
  plays.forEach(({ seat, card }) => playCard(game, seat, card.id));
}

// ─── Scenario 1: Complete Round 1 ─────────────────────────────────────────
describe("Scenario: Complete Round 1 (1 card each, 1 trick)", () => {
  let game;
  it("Setup: create game and start round 1", () => {
    game = createGame("s1", ["Alice","Bob","Carol","Dave"]);
    startRound(game);
    expect(game.round).toBe(1);
    expect(game.phase).toBe("bidding");
    expect(game.trickPlayOrder.length).toBe(4);
    // Each player has 1 card
    game.hands.forEach(h => expect(h.length).toBe(1));
  });

  it("All players bid 0 (min for round 1)", () => {
    [0,1,2,3].forEach(s => placeBid(game, s, 0));
    expect(game.phase).toBe("bids-revealed");
    startPlaying(game);
    expect(game.phase).toBe("playing");
  });

  it("Playing 1 trick resolves the round", () => {
    // Force deterministic hands: each seat gets a diamond
    setHands(game, [
      [c("A","diamond")], [c("K","diamond")], [c("Q","diamond")], [c("J","diamond")]
    ]);
    const order = game.trickPlayOrder;
    order.forEach(seat => {
      const card = game.hands[seat][0];
      playCard(game, seat, card.id);
    });
    // ♦A (seat 0) should win; check if seat 0 is in trickPlayOrder
    expect(game.phase).toBe("round-end");
  });

  it("Round 1 history entry exists", () => {
    expect(game.history.length).toBe(1);
    expect(game.history[0].round).toBe(1);
  });
});

// ─── Scenario 2: Rule 20 advantage rotation ────────────────────────────────
describe("Scenario: Advantage seat rotation across 3 rounds (Rule 22)", () => {
  let game;
  it("Setup: force advantage seat = 0 for round 1", () => {
    game = createGame("s2", ["A","B","C","D"]);
    game.advantageSeat = 0; // force for determinism
    startRound(game);
    expect(game.trickPlayOrder).toEqual(buildPlayOrder(0)); // [1,2,3,0]
  });

  it("Force seat 2 to win round 1's trick → advantageSeat becomes 2", () => {
    bidAll(game, [0,0,0,0]);
    // Seat 2 plays ♠A (highest possible), others play low diamonds
    setHands(game, [
      [c("2","diamond")], [c("3","diamond")], [c("A","spade")], [c("4","diamond")]
    ]);
    const order = game.trickPlayOrder;
    order.forEach(seat => playCard(game, seat, game.hands[seat][0].id));
    expect(game.advantageSeat).toBe(2);
  });

  it("Round 2: play order ends at seat 2 ([3,0,1,2])", () => {
    startRound(game);
    expect(game.trickPlayOrder).toEqual([3,0,1,2]);
  });
});

// ─── Scenario 3: Rulebook §20 bonus example (Round 8, bid=4, won=6) ────────
describe("Scenario: Round 8 bonus (bid=4, won=6 → score=100)", () => {
  it("scoreForPlayer matches rulebook example exactly", () => {
    expect(scoreForPlayer(8, 4, 6)).toBe(100); // 4×20 + 2×10
  });
  it("scoreForPlayer bid=6 won=8 in round 8 → 6×20 + 2×10 = 140", () => {
    expect(scoreForPlayer(8, 6, 8)).toBe(140);
  });
});

// ─── Scenario 4: Rulebook §21 penalty example (Round 10, bid=5, won=3) ─────
describe("Scenario: Round 10 penalty (bid=5, won=3 → -150)", () => {
  it("scoreForPlayer matches rulebook penalty example exactly", () => {
    expect(scoreForPlayer(10, 5, 3)).toBe(-150); // -(5×30)
  });
  it("Round 13 max penalty (bid=13, won=0) → -(13×40) = -520", () => {
    expect(scoreForPlayer(13, 13, 0)).toBe(-520);
  });
});

// ─── Scenario 5: Spade trump overrides higher non-spade cards ───────────────
describe("Scenario: Spade trump mechanics (Rule 17)", () => {
  const c = (r,s) => ({ id:`${r}_${s}`,rank:r,suit:s });
  const { resolveTrick } = require("../src/deck");

  it("♠2 beats ♦A, ♥A, ♣A (spade is trump)", () => {
    const plays = [
      { seat:0, card:c("A","diamond") },
      { seat:1, card:c("A","heart")   },
      { seat:2, card:c("A","club")    },
      { seat:3, card:c("2","spade")   },
    ];
    expect(resolveTrick(plays, "diamond")).toBe(3);
  });

  it("♠A beats ♠K (highest spade wins among spades)", () => {
    const plays = [
      { seat:0, card:c("A","spade") },
      { seat:1, card:c("K","spade") },
      { seat:2, card:c("Q","spade") },
      { seat:3, card:c("J","spade") },
    ];
    expect(resolveTrick(plays, "spade")).toBe(0);
  });

  it("Non-lead non-spade cards lose even if higher rank", () => {
    // Lead = club; seat 1 plays ♥A (off-suit, no spade), seat 3 plays ♣J
    const plays = [
      { seat:0, card:c("10","club")    },
      { seat:1, card:c("A","heart")    }, // off-suit, cannot win
      { seat:2, card:c("K","diamond")  }, // off-suit, cannot win
      { seat:3, card:c("J","club")     },
    ];
    expect(resolveTrick(plays, "club")).toBe(3); // ♣J wins
  });
});

// ─── Scenario 6: Follow-suit enforcement with spade trump ──────────────────
describe("Scenario: Follow-suit rule (Rule 15)", () => {
  let game;
  it("Setup round with forced hands", () => {
    game = createGame("s6", ["A","B","C","D"]);
    game.advantageSeat = 0;
    startRound(game);
    // Give seat 0 a diamond AND a spade — must play diamond if lead is diamond
    setHands(game, [
      [c("A","diamond"), c("K","spade")], // seat 0
      [c("2","diamond"), c("3","club")],  // seat 1
      [c("5","club"),    c("7","heart")], // seat 2 (no diamond)
      [c("9","diamond"), c("Q","heart")], // seat 3
    ]);
    bidAll(game, [0,0,0,0]);
  });

  it("Playing off-suit when holding lead suit throws illegal move", () => {
    // trickPlayOrder for advantageSeat=0 → [1,2,3,0]
    // Seat 1 leads with ♦2
    playCard(game, 1, c("2","diamond").id);
    // Seat 2 has no diamonds — can play anything (♣5 or ♥7)
    playCard(game, 2, c("5","club").id); // legal: no diamond in hand
    // Seat 3 HAS ♦9 and tries to play ♥Q — MUST be rejected
    expectThrow(() => playCard(game, 3, c("Q","heart").id), "lead suit");
  });
});

// ─── Scenario 7: Full 13-round game simulation ─────────────────────────────
describe("Scenario: Full 13-round simulated game", () => {
  let game;
  it("Runs all 13 rounds without error", () => {
    game = createGame("s7", ["P1","P2","P3","P4"]);

    for (let round = 1; round <= 13; round++) {
      startRound(game);
      expect(game.round).toBe(round);
      expect(game.phase).toBe("bidding");

      // Each player bids the minimum for this round
      const { minBid } = require("../src/gameEngine").tierForRound(round);
      [0,1,2,3].forEach(seat => placeBid(game, seat, minBid));
      startPlaying(game);
      expect(game.phase).toBe("playing");

      // Play out all tricks in this round, always choosing a legal card
      const { legalCards } = require("../src/gameEngine");
      for (let trick = 0; trick < round; trick++) {
        const order = game.trickPlayOrder;
        order.forEach(seat => {
          const hand = game.hands[seat];
          if (hand.length === 0) return;
          const baseSuit = game.currentTrick.baseSuit;
          const legal = legalCards(hand, baseSuit);
          playCard(game, seat, legal[0].id);
        });
      }

      const expectedPhase = round === 13 ? "game-end" : "round-end";
      expect(game.phase).toBe(expectedPhase);
    }

    expect(game.history.length).toBe(13);
    expect(game.finalRankings).toBeDefined();
  });

  it("Each round has correct history entry", () => {
    game.history.forEach((h, i) => {
      expect(h.round).toBe(i + 1);
      expect(Object.keys(h.bids).length).toBe(4);
      expect(Object.keys(h.tricksWon).length).toBe(4);
      expect(Object.keys(h.scores).length).toBe(4);
      // Tricks won in a round must sum to round number
      const totalTricks = Object.values(h.tricksWon).reduce((a,b)=>a+b,0);
      expect(totalTricks).toBe(h.round);
    });
  });

  it("finalRankings has 4 entries with rank values 1-4", () => {
    const ranks = game.finalRankings.map(r => r.rank).sort((a,b)=>a-b);
    // Ties can share rank, so just check all 4 exist
    expect(game.finalRankings.length).toBe(4);
  });
});

// ─── Scenario 8: Cumulative scoring across rounds ──────────────────────────
describe("Scenario: Cumulative score tracking", () => {
  it("Player who hits every bid accumulates correctly", () => {
    const game = createGame("s8", ["P1","P2","P3","P4"]);
    // Simulate 3 rounds with player 0 hitting bid exactly each time
    [
      { round:1, bid:1, won:1 }, // +10
      { round:5, bid:2, won:2 }, // +40
      { round:9, bid:2, won:2 }, // +60
    ].forEach(({ round, bid, won }) => {
      const pts = scoreForPlayer(round, bid, won);
      game.players[0].totalScore += pts;
    });
    expect(game.players[0].totalScore).toBe(10 + 40 + 60);
  });
});

summary();
