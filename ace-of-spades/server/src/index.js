const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { createRoom, joinRoom, getRoom } = require("./rooms");
const { startRound, placeBid, playCard, startPlaying, currentSeatToPlay, legalCards } = require("./gameEngine");

const app = express();
app.use(cors());
app.get("/health", (req, res) => res.json({ ok: true }));
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Broadcasts different data to each seat:
// - Only their own hand (Rule 8)
// - Bids hidden until bids-revealed/playing phase (Rule 13)
function broadcastState(room) {
  const { game } = room;
  if (!game) return;
  const bidsPublic = game.phase !== "bidding";

  for (const [seatStr, socketId] of Object.entries(room.sockets)) {
    const seat = Number(seatStr);
    io.to(socketId).emit("state", {
      round:              game.round,
      phase:              game.phase,
      players:            game.players,
      yourSeat:           seat,
      yourHand:           game.hands[seat] || [],
      // Bids: your own visible always; others only after reveal
      bids:               bidsPublic ? game.bids : { [seat]: game.bids[seat] },
      bidsPublic,
      bidsSubmittedCount: Object.keys(game.bidsSubmitted).length,
      hasSubmittedBid:    !!game.bidsSubmitted[seat],
      trickPlayOrder:     game.trickPlayOrder,
      advantageSeat:      game.advantageSeat,
      currentSeatToPlay:  currentSeatToPlay(game),
      legalCardIds:
        game.phase === "playing" && currentSeatToPlay(game) === seat
          ? legalCards(game.hands[seat] || [], game.currentTrick.baseSuit).map(c => c.id)
          : [],
      currentTrick:       game.currentTrick,
      tricksWonThisRound: game.tricksWonThisRound,
      history:            game.history,
      finalRankings:      game.finalRankings || null,
    });
  }
}

io.on("connection", (socket) => {

  socket.on("create_room", (_, cb) => {
    cb({ roomCode: createRoom() });
  });

  socket.on("join_room", ({ roomCode, playerName }, cb) => {
    try {
      const { seat, room } = joinRoom(roomCode, playerName, socket.id);
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.seat = seat;
      cb({ ok: true, seat });
      io.to(roomCode).emit("lobby_update", { players: room.playerNames });
      if (room.playerNames.length === 4) {
        startRound(room.game);
        broadcastState(room);
      }
    } catch (err) {
      cb({ ok: false, error: err.message });
    }
  });

  // Simultaneous blind bidding — any player, any order (Rule 13)
  socket.on("place_bid", ({ bid }, cb) => {
    const room = getRoom(socket.data.roomCode);
    if (!room?.game) return cb?.({ ok: false, error: "No active game" });
    try {
      placeBid(room.game, socket.data.seat, Number(bid));
      broadcastState(room); // after 4th bid, phase = "bids-revealed"

      if (room.game.phase === "bids-revealed") {
        // Auto-advance to playing after 3 s (time for all to read bids)
        setTimeout(() => {
          startPlaying(room.game);
          broadcastState(room);
        }, 3000);
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
      broadcastState(room);
      if (room.game.phase === "round-end") {
        setTimeout(() => {
          startRound(room.game);
          broadcastState(room);
        }, 5000); // 5 s to read round scores
      }
      cb?.({ ok: true });
    } catch (err) {
      cb?.({ ok: false, error: err.message });
    }
  });

  // Rule 27: reconnect support
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
