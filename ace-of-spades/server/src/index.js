// index.js — Express + Socket.io server
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { createRoom, joinRoom, getRoom } = require("./rooms");
const {
  startRound, placeBid, playCard, startPlaying, advanceAfterTrick,
  currentSeatToPlay, currentBidder, legalCards,
} = require("./gameEngine");

const app = express();
app.use(cors());
app.get("/health", (req, res) => res.json({ ok: true, ts: Date.now() }));
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

function broadcastState(room) {
  const { game } = room;
  if (!game) return;
  const bidsPublic = true; // bids visible to everyone the moment each player locks in

  for (const [seatStr, socketId] of Object.entries(room.sockets)) {
    const seat = Number(seatStr);
    io.to(socketId).emit("state", {
      round:              game.round,
      phase:              game.phase,
      players:            game.players,
      yourSeat:           seat,
      yourHand:           game.hands[seat] || [],
      bids:               bidsPublic ? game.bids : { [seat]: game.bids[seat] },
      bidsPublic,
      bidsSubmittedCount: Object.keys(game.bidsSubmitted).length,
      hasSubmittedBid:    !!game.bidsSubmitted[seat],
      bidsSubmitted:      game.bidsSubmitted,
      trickPlayOrder:     game.trickPlayOrder,
      advantageSeat:      game.advantageSeat,
      currentSeatToPlay:  currentSeatToPlay(game),
      currentBidder:      currentBidder(game),
      legalCardIds:
        game.phase === "playing" && currentSeatToPlay(game) === seat
          ? legalCards(game.hands[seat] || [], game.currentTrick.baseSuit).map(c => c.id)
          : [],
      currentTrick:       game.currentTrick,
      trickWinnerSeat:    game.trickWinnerSeat,
      tricksWonThisRound: game.tricksWonThisRound,
      history:            game.history,
      finalRankings:      game.finalRankings || null,
      tableColor:         room.tableColor || "green",
    });
  }
}

io.on("connection", (socket) => {

  socket.on("create_room", (data, cb) => {
    const tableColor = data?.tableColor || "green";
    cb({ roomCode: createRoom(tableColor) });
  });

  socket.on("join_room", ({ roomCode, playerName }, cb) => {
    try {
      const { seat, room } = joinRoom(roomCode, playerName, socket.id);
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.seat = seat;
      cb({ ok: true, seat });
      io.to(roomCode).emit("lobby_update", { players: room.playerNames, tableColor: room.tableColor });
      if (room.playerNames.length === 4) {
        startRound(room.game);
        broadcastState(room);
      }
    } catch (err) {
      cb({ ok: false, error: err.message });
    }
  });

  socket.on("place_bid", ({ bid }, cb) => {
    const room = getRoom(socket.data.roomCode);
    if (!room?.game) return cb?.({ ok: false, error: "No active game" });
    try {
      placeBid(room.game, socket.data.seat, Number(bid));
      broadcastState(room);
      if (room.game.phase === "bids-revealed") {
        setTimeout(() => { startPlaying(room.game); broadcastState(room); }, 3000);
      }
      cb?.({ ok: true });
    } catch (err) {
      cb?.({ ok: false, error: err.message });
    }
  });

  socket.on("play_card", ({ cardId }, cb) => {
    const room = getRoom(socket.data.roomCode);
    if (!room?.game) return cb?.({ ok: false, error: "No active game" });
    try {
      playCard(room.game, socket.data.seat, cardId);
      broadcastState(room); // shows the completed trick + trickWinnerSeat, if the trick just finished

      if (room.game.awaitingTrickAdvance) {
        // Pause so everyone can see who won the trick before the table clears.
        setTimeout(() => {
          advanceAfterTrick(room.game);
          broadcastState(room);
          if (room.game.phase === "round-end") {
            setTimeout(() => { startRound(room.game); broadcastState(room); }, 5000);
          }
        }, 1800);
      }
      cb?.({ ok: true });
    } catch (err) {
      cb?.({ ok: false, error: err.message });
    }
  });

  socket.on("reconnect_player", ({ roomCode, seat }, cb) => {
    const room = getRoom(roomCode);
    if (!room) return cb?.({ ok: false, error: "Room not found" });
    room.sockets[seat] = socket.id;
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.seat = seat;
    broadcastState(room);
    cb?.({ ok: true });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Ace of Spades server on :${PORT}`));