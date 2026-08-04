import { io } from "socket.io-client";
import { SERVER_URL } from "../config";

export const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1500,
  timeout: 10000,
});

export function connectAndWait() {
  return new Promise((resolve, reject) => {
    if (socket.connected) return resolve();
    socket.connect();
    const timer = setTimeout(() => reject(new Error("Cannot reach server. Check your internet connection.")), 10000);
    socket.once("connect", () => { clearTimeout(timer); resolve(); });
    socket.once("connect_error", (e) => { clearTimeout(timer); reject(new Error("Server unreachable: " + e.message)); });
  });
}

function emit(event, data, ms = 10000) {
  return new Promise((resolve, reject) => {
    if (!socket.connected) return reject(new Error("Not connected"));
    const t = setTimeout(() => reject(new Error(`${event} timed out`)), ms);
    socket.emit(event, data, (res) => { clearTimeout(t); resolve(res); });
  });
}

export const createRoom      = (tableColor='green') => emit("create_room", { tableColor });
export const joinRoom        = (roomCode, playerName) => emit("join_room", { roomCode, playerName });
export const placeBid        = (bid)                  => emit("place_bid",  { bid });
export const playCard        = (cardId)               => emit("play_card",  { cardId });
export const reconnectPlayer = (roomCode, seat)       => emit("reconnect_player", { roomCode, seat });
