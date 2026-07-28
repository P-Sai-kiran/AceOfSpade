import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import { socket, reconnectPlayer } from "../services/socket";

const Ctx = createContext(null);

export function GameProvider({ children }) {
  const [state,     setState]     = useState(null);
  const [connected, setConnected] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [session,   setSession]   = useState(null); // { roomCode, seat, myName }

  useEffect(() => {
    socket.on("state",         setState);
    socket.on("lobby_update",  ({ players }) => setLobbyPlayers(players));
    socket.on("connect",       () => setConnected(true));
    socket.on("disconnect",    () => setConnected(false));

    const sub = AppState.addEventListener("change", s => {
      if (s === "active" && session && !socket.connected) {
        socket.connect();
        socket.once("connect", () =>
          reconnectPlayer(session.roomCode, session.seat).catch(() => {})
        );
      }
    });
    return () => {
      socket.off("state",        setState);
      socket.off("lobby_update", ({ players }) => setLobbyPlayers(players));
      socket.off("connect",      () => setConnected(true));
      socket.off("disconnect",   () => setConnected(false));
      sub.remove();
    };
  }, [session]);

  function saveSession(data) { setSession(data); }
  function clearSession()    { setSession(null); setState(null); setLobbyPlayers([]); }

  return (
    <Ctx.Provider value={{ state, connected, lobbyPlayers, session, saveSession, clearSession }}>
      {children}
    </Ctx.Provider>
  );
}

export const useGame = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGame outside GameProvider");
  return ctx;
};
