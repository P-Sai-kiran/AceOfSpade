import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";
import { GameProvider, useGame } from "./src/context/GameContext";
import { C } from "./src/theme";

import SplashScreen       from "./src/screens/SplashScreen";
import HomeScreen         from "./src/screens/HomeScreen";
import CreateJoinScreen   from "./src/screens/CreateJoinScreen";
import LobbyScreen        from "./src/screens/LobbyScreen";
import BiddingScreen      from "./src/screens/BiddingScreen";
import BidsDisclosedScreen from "./src/screens/BidsDisclosedScreen";
import GameTableScreen    from "./src/screens/GameTableScreen";
import RoundScoreScreen   from "./src/screens/RoundScoreScreen";
import MatchSummaryScreen from "./src/screens/MatchSummaryScreen";
import ShuffleAnimation   from "./src/components/ShuffleAnimation";

const S = { SPLASH:"splash", HOME:"home", CREATE:"create", JOIN:"join", LOBBY:"lobby", GAME:"game" };

function Navigator() {
  const { state, setReconnectData } = useGame();
  const [screen, setScreen]   = useState(S.SPLASH);
  const [roomCode, setRoomCode] = useState(null);
  const [myName, setMyName]   = useState(null);
  const [shuffle, setShuffle] = useState(false);
  const prevRound = useRef(0);
  const prevPhase = useRef(null);

  useEffect(() => {
    if (!state) return;
    if (screen !== S.GAME) setScreen(S.GAME);
    // Show shuffle animation on each new round
    if (state.round !== prevRound.current) {
      prevRound.current = state.round;
      if (prevPhase.current !== null) setShuffle(true); // skip anim on very first deal
    }
    prevPhase.current = state.phase;
  }, [state?.round]);

  function onJoined({ roomCode: rc, seat, myName: n }) {
    setRoomCode(rc);
    setMyName(n);
    setReconnectData({ roomCode: rc, seat });
    setScreen(S.LOBBY);
  }

  function goHome() {
    setScreen(S.HOME);
    setRoomCode(null);
    setMyName(null);
    prevRound.current = 0;
    prevPhase.current = null;
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
    case S.SPLASH:  return <SplashScreen onDone={() => setScreen(S.HOME)} />;
    case S.HOME:    return <HomeScreen playerName={myName || "Player_01"} onCreateRoom={() => setScreen(S.CREATE)} onJoinRoom={() => setScreen(S.JOIN)} />;
    case S.CREATE:  return <CreateJoinScreen mode="create" onBack={() => setScreen(S.HOME)} onJoined={onJoined} />;
    case S.JOIN:    return <CreateJoinScreen mode="join"   onBack={() => setScreen(S.HOME)} onJoined={onJoined} />;
    case S.LOBBY:   return <LobbyScreen roomCode={roomCode} myName={myName} />;
    default:        return <HomeScreen onCreateRoom={() => setScreen(S.CREATE)} onJoinRoom={() => setScreen(S.JOIN)} />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <SafeAreaView style={s.root}>
        <Navigator />
      </SafeAreaView>
    </GameProvider>
  );
}

const s = StyleSheet.create({ root: { flex:1, backgroundColor: C.bg } });
