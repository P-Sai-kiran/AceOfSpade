import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import { socket, reconnectPlayer } from "../services/socket";

const Ctx = createContext(null);

export function GameProvider({ children }) {
  const [state,     setState]     = useState(null);
  const [connected, setConnected] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [lobbyColor, setLobbyColor] = useState('green');
  const [session,   setSession]   = useState(null);

  useEffect(() => {
    const onState = (s) => setState(s);
    const onLobby = ({ players, tableColor }) => {
      setLobbyPlayers(players);
      if (tableColor) setLobbyColor(tableColor);
    };
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("state", onState);
    socket.on("lobby_update", onLobby);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    const sub = AppState.addEventListener("change", s => {
      if (s === "active" && session && !socket.connected) {
        socket.connect();
        socket.once("connect", () => reconnectPlayer(session.roomCode, session.seat).catch(() => {}));
      }
    });
    return () => {
      socket.off("state", onState);
      socket.off("lobby_update", onLobby);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      sub.remove();
    };
  }, [session]);

  function saveSession(data) { setSession(data); }
  function clearSession()    { setSession(null); setState(null); setLobbyPlayers([]); setLobbyColor('green'); }

  return (
    <Ctx.Provider value={{ state, connected, lobbyPlayers, lobbyColor, session, saveSession, clearSession }}>
      {children}
    </Ctx.Provider>
  );
}

export const useGame = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGame outside GameProvider");
  return ctx;
};
