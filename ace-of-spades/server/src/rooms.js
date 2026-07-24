// rooms.js — in-memory lobby/room management.
// For production, back this with Redis or a DB so state survives server
// restarts and can be shared across multiple server instances.

// uuid inlined for offline test compat
const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); });
const { createGame } = require("./gameEngine");

const rooms = new Map(); // roomCode -> { game, sockets: Map(seat -> socketId), roomCode }

function generateRoomCode() {
  // Short human-shareable code, e.g. "7F3K"
  return uuidv4().slice(0, 4).toUpperCase();
}

function createRoom() {
  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();
  rooms.set(code, {
    roomCode: code,
    game: null,
    playerNames: [],
    sockets: {}, // seat -> socketId
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

  if (room.playerNames.length === 4) {
    room.game = createGame(code, room.playerNames);
  }
  return { seat, room };
}

function getRoom(code) {
  return rooms.get(code);
}

function removeRoom(code) {
  rooms.delete(code);
}

module.exports = { createRoom, joinRoom, getRoom, removeRoom, rooms };
