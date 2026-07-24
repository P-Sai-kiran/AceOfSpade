// Smoke tests — critical path checks that the whole system wires together
"use strict";
const { describe, it, expect, expectThrow, summary } = require("./runner");
const { createGame, startRound, placeBid, playCard, startPlaying, currentSeatToPlay } = require("../src/gameEngine");
const { createRoom, joinRoom, getRoom } = require("../src/rooms");

// ─── Rooms module ──────────────────────────────────────────────────────────
describe("Smoke: Room creation and join", () => {
  it("createRoom returns a 4-char uppercase code", () => {
    const code = createRoom();
    expect(typeof code).toBe("string");
    expect(code.length).toBe(4);
    expect(code).toBe(code.toUpperCase());
  });

  it("First player to join gets seat 0", () => {
    const code = createRoom();
    const { seat } = joinRoom(code, "Alice", "socket-1");
    expect(seat).toBe(0);
  });

  it("Four distinct players fill seats 0-3", () => {
    const code = createRoom();
    const seats = ["Alice","Bob","Carol","Dave"].map((n,i) =>
      joinRoom(code, n, `sock-${i}`).seat
    );
    expect(seats).toEqual([0,1,2,3]);
  });

  it("5th join attempt throws 'Room is full'", () => {
    const code = createRoom();
    ["A","B","C","D"].forEach((n,i) => joinRoom(code, n, `s${i}`));
    expectThrow(() => joinRoom(code, "E", "s4"), "full");
  });

  it("Joining nonexistent room throws", () => {
    expectThrow(() => joinRoom("ZZZZ", "X", "s"), "not found");
  });

  it("Game auto-created when 4th player joins", () => {
    const code = createRoom();
    ["A","B","C","D"].forEach((n,i) => joinRoom(code, n, `s${i}`));
    const room = getRoom(code);
    expect(room.game).toBeDefined();
  });
});

// ─── Game lifecycle ────────────────────────────────────────────────────────
describe("Smoke: Game lifecycle phase transitions", () => {
  function quickGame() {
    const g = createGame("sm", ["A","B","C","D"]);
    startRound(g);
    return g;
  }

  it("New game starts in 'bidding' phase after startRound", () => {
    const g = quickGame();
    expect(g.phase).toBe("bidding");
  });

  it("Phase: lobby → bidding → bids-revealed → playing → round-end → bidding", () => {
    const g = quickGame();
    // bidding
    expect(g.phase).toBe("bidding");
    // all bid
    [0,1,2,3].forEach(s => placeBid(g, s, 0));
    expect(g.phase).toBe("bids-revealed");
    // advance to playing
    startPlaying(g);
    expect(g.phase).toBe("playing");
    // play 1 trick (round 1 = 1 trick)
    const { legalCards: _lc } = require("../src/gameEngine");
    const order = g.trickPlayOrder;
    order.forEach(seat => {
      const hand = g.hands[seat];
      const legal = _lc(hand, g.currentTrick.baseSuit);
      playCard(g, seat, legal[0].id);
    });
    expect(g.phase).toBe("round-end");
    // start next round
    startRound(g);
    expect(g.phase).toBe("bidding");
    expect(g.round).toBe(2);
  });

  it("currentSeatToPlay returns null when not in playing phase", () => {
    const g = quickGame();
    expect(currentSeatToPlay(g)).toBe(null);
  });

  it("currentSeatToPlay returns correct seat during playing", () => {
    const g = quickGame();
    [0,1,2,3].forEach(s => placeBid(g, s, 0));
    startPlaying(g);
    const expected = g.trickPlayOrder[0];
    expect(currentSeatToPlay(g)).toBe(expected);
  });

  it("Playing out of turn throws", () => {
    const g = quickGame();
    [0,1,2,3].forEach(s => placeBid(g, s, 0));
    startPlaying(g);
    const wrongSeat = (g.trickPlayOrder[0] + 1) % 4;
    const card = g.hands[wrongSeat][0];
    expectThrow(() => playCard(g, wrongSeat, card.id), "turn");
  });

  it("Playing a card not in hand throws", () => {
    const g = quickGame();
    [0,1,2,3].forEach(s => placeBid(g, s, 0));
    startPlaying(g);
    const seat = g.trickPlayOrder[0];
    expectThrow(() => playCard(g, seat, "FAKE_CARD_ID"), "hand");
  });

  it("After all 13 rounds phase is game-end", () => {
    const g = createGame("end","A B C D".split(" "));
    for (let r=1; r<=13; r++) {
      startRound(g);
      [0,1,2,3].forEach(s => placeBid(g, s, Math.min(
        r<=4?0:r<=8?1:r<=11?2:3, g.round)));
      startPlaying(g);
      for (let t=0; t<r; t++) {
        const { legalCards: _lc2 } = require("../src/gameEngine");
        g.trickPlayOrder.forEach(seat => {
          if (g.hands[seat].length===0) return;
          const legal = _lc2(g.hands[seat], g.currentTrick.baseSuit);
          playCard(g, seat, legal[0].id);
        });
      }
    }
    expect(g.phase).toBe("game-end");
    expect(g.finalRankings.length).toBe(4);
  });
});

// ─── Edge cases ────────────────────────────────────────────────────────────
describe("Smoke: Edge cases", () => {
  it("Game requires exactly 4 players", () =>
    expectThrow(() => createGame("x", ["A","B","C"]), "4"));

  it("Round number increases correctly over 3 rounds", () => {
    const g = createGame("ec", ["A","B","C","D"]);
    [1,2,3].forEach(expected => {
      startRound(g);
      expect(g.round).toBe(expected);
      [0,1,2,3].forEach(s => placeBid(g,s,0));
      startPlaying(g);
      const { legalCards: _lc3 } = require("../src/gameEngine");
      for (let t=0;t<expected;t++)
        g.trickPlayOrder.forEach(seat => {
          if(g.hands[seat].length===0) return;
          const legal = _lc3(g.hands[seat], g.currentTrick.baseSuit);
          playCard(g, seat, legal[0].id);
        });
    });
    expect(g.round).toBe(3);
  });

  it("trickPlayOrder is fixed for all tricks in a round (not changed by mid-round winner)", () => {
    const g = createGame("tpo", ["A","B","C","D"]);
    g.advantageSeat = 1;
    startRound(g);  // Round 1 — 1 trick
    const orderBefore = [...g.trickPlayOrder];
    [0,1,2,3].forEach(s => placeBid(g,s,0));
    startPlaying(g);
    expect(g.trickPlayOrder).toEqual(orderBefore); // unchanged after starting
  });
});

summary();
