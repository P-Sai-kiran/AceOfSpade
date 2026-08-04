// rooms.js — in-memory lobby/room management, including the room creator's
// chosen table color (cosmetic only, shared by all 4 players).
const { v4: uuidv4 } = require("uuid");
const { createGame } = require("./gameEngine");

const rooms = new Map();
const VALID_COLORS = ["green", "red", "blue"];

function generateRoomCode() {
  return uuidv4().slice(0, 4).toUpperCase();
}

function createRoom(tableColor = "green") {
  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();
  rooms.set(code, {
    roomCode: code,
    game: null,
    playerNames: [],
    sockets: {},
    tableColor: VALID_COLORS.includes(tableColor) ? tableColor : "green",
  });
  return code;
}

function joinRoom(code, playerName, socketId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room not found");
  if (room.playerNames.length >= 4) throw new Error("Room is full");
  const seat = room.playerNames.length;
  room.playerNames.push(playerName);
  room.sockets[seat] = socketId;
  if (room.playerNames.length === 4) room.game = createGame(code, room.playerNames);
  return { seat, room };
}

function getRoom(code) { return rooms.get(code); }
function removeRoom(code) { rooms.delete(code); }

module.exports = { createRoom, joinRoom, getRoom, removeRoom, rooms, VALID_COLORS };