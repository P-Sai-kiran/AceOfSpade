import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, StatusBar, View, Text, StyleSheet } from "react-native";
import { GameProvider, useGame } from "./src/context/GameContext";
import { socket } from "./src/services/socket";
import { C } from "./src/theme";

import SplashScreen        from "./src/screens/SplashScreen";
import HomeScreen          from "./src/screens/HomeScreen";
import CreateJoinScreen    from "./src/screens/CreateJoinScreen";
import LobbyScreen         from "./src/screens/LobbyScreen";
import HowToPlayScreen     from "./src/screens/HowToPlayScreen";
import BiddingScreen       from "./src/screens/BiddingScreen";
import BidsDisclosedScreen from "./src/screens/BidsDisclosedScreen";
import GameTableScreen     from "./src/screens/GameTableScreen";
import RoundScoreScreen    from "./src/screens/RoundScoreScreen";
import MatchSummaryScreen  from "./src/screens/MatchSummaryScreen";
import ShuffleAnimation    from "./src/components/ShuffleAnimation";

const S = { SPLASH:"splash", HOME:"home", CREATE:"create", JOIN:"join", LOBBY:"lobby", GAME:"game", HOW:"how" };

function ConnectionBanner({ connected }) {
  if (connected) return null;
  return (
    <View style={bs.banner}><Text style={bs.bannerText}>⚠ Connecting to server…</Text></View>
  );
}

function Navigator() {
  const { state, connected, clearSession, saveSession } = useGame();
  const [screen,  setScreen]  = useState(S.SPLASH);
  const [shuffle, setShuffle] = useState(false);
  const [myName,  setMyName]  = useState(null);
  const [roomCode,setRoomCode]= useState(null);
  const prevRound = useRef(0);
  const inGame    = useRef(false);

  useEffect(() => {
    if (!state) return;
    if (!inGame.current) { inGame.current = true; setScreen(S.GAME); }
  }, [state]);

  useEffect(() => {
    if (!state?.round) return;
    if (state.round !== prevRound.current) {
      if (prevRound.current > 0) setShuffle(true);
      prevRound.current = state.round;
    }
  }, [state?.round]);

  function goHome() {
    inGame.current = false;
    prevRound.current = 0;
    setScreen(S.HOME);
    setMyName(null);
    setRoomCode(null);
    clearSession();
    socket.disconnect();
  }

  function onJoined({ roomCode: rc, seat, myName: n }) {
    setRoomCode(rc);
    setMyName(n);
    saveSession({ roomCode: rc, seat, myName: n });
    setScreen(S.LOBBY);
  }

  if (shuffle) return <ShuffleAnimation onDone={() => setShuffle(false)} />;

  if (screen === S.GAME && state) {
    switch (state.phase) {
      case "bidding":        return <BiddingScreen />;
      case "bids-revealed":  return <BidsDisclosedScreen />;
      case "playing":        return <GameTableScreen />;
      case "round-end":      return <RoundScoreScreen />;
      case "game-end":       return <MatchSummaryScreen onLobby={goHome} onPlayAgain={goHome} />;
    }
  }

  switch (screen) {
    case S.SPLASH: return <SplashScreen onDone={() => setScreen(S.HOME)} />;
    case S.HOME:
      return <HomeScreen playerName={myName} onCreateRoom={() => setScreen(S.CREATE)} onJoinRoom={() => setScreen(S.JOIN)} onHowToPlay={() => setScreen(S.HOW)} />;
    case S.HOW: return <HowToPlayScreen onBack={() => setScreen(S.HOME)} />;
    case S.CREATE: return <CreateJoinScreen mode="create" onBack={() => setScreen(S.HOME)} onJoined={onJoined} />;
    case S.JOIN:   return <CreateJoinScreen mode="join"   onBack={() => setScreen(S.HOME)} onJoined={onJoined} />;
    case S.LOBBY:  return <LobbyScreen roomCode={roomCode} myName={myName} />;
    default: return <HomeScreen onCreateRoom={() => setScreen(S.CREATE)} onJoinRoom={() => setScreen(S.JOIN)} />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <SafeAreaView style={s.root}><InnerApp /></SafeAreaView>
    </GameProvider>
  );
}

function InnerApp() {
  const { connected } = useGame();
  return (
    <View style={{ flex: 1 }}>
      <ConnectionBanner connected={connected} />
      <Navigator />
    </View>
  );
}

const s  = StyleSheet.create({ root: { flex: 1, backgroundColor: C.bg } });
const bs = StyleSheet.create({
  banner: { backgroundColor: "#8b2020", paddingVertical: 6, alignItems: "center" },
  bannerText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
