import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { AppState } from "react-native";
import { socket } from "../services/socket";

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(false);
  const reconnectData = useRef(null); // { roomCode, seat } for reconnect on resume

  useEffect(() => {
    socket.on("state",      setState);
    socket.on("connect",    () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // Rule 27 reconnect: re-attach on app resume
    const sub = AppState.addEventListener("change", nextState => {
      if (nextState === "active" && reconnectData.current && !socket.connected) {
        socket.connect();
        socket.once("connect", () => {
          const { roomCode, seat } = reconnectData.current;
          socket.emit("reconnect_player", { roomCode, seat });
        });
      }
    });

    return () => {
      socket.off("state",      setState);
      socket.off("connect",    () => setConnected(true));
      socket.off("disconnect", () => setConnected(false));
      sub.remove();
    };
  }, []);

  function setReconnectData(data) { reconnectData.current = data; }

  return (
    <GameContext.Provider value={{ state, connected, setReconnectData }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}
