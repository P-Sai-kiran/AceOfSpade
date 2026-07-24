import { io } from "socket.io-client";
import { SERVER_URL } from "../config";

export const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ["websocket"],
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  timeout: 10000,
});

// Promise wrappers with timeout safety
function emit(event, data, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${event} timed out`)), timeoutMs);
    socket.emit(event, data, (res) => { clearTimeout(timer); resolve(res); });
  });
}

export const createRoom      = ()                       => emit("create_room", null);
export const joinRoom        = (roomCode, playerName)   => emit("join_room", { roomCode, playerName });
export const placeBid        = (bid)                    => emit("place_bid",  { bid });
export const playCard        = (cardId)                 => emit("play_card",  { cardId });
export const reconnectPlayer = (roomCode, seat)         => emit("reconnect_player", { roomCode, seat });
