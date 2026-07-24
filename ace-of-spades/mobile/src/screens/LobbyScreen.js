import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Share } from "react-native";
import { C, F, R } from "../theme";
import { socket } from "../services/socket";

export default function LobbyScreen({ roomCode, myName }) {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    function onLobby({ players: p }) { setPlayers(p); }
    socket.on("lobby_update", onLobby);
    return () => socket.off("lobby_update", onLobby);
  }, []);

  async function shareCode() {
    Share.share({ message: `Join my Ace of Spades game! Room code: ${roomCode}` });
  }

  return (
    <View style={s.bg}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>ROOM CODE</Text>
        <TouchableOpacity style={s.codeRow} onPress={shareCode}>
          <Text style={s.code}>{roomCode}</Text>
          <Text style={s.copyIcon}>⎘</Text>
        </TouchableOpacity>
        <Text style={s.hint}>Share this code with 3 friends</Text>
      </View>

      {/* Player slots */}
      <View style={s.slots}>
        {[0,1,2,3].map(i => {
          const p = players[i];
          const isMe = p === myName;
          return (
            <View key={i} style={[s.slot, isMe && s.slotMe]}>
              <View style={[s.slotAvatar, p && s.slotAvatarFilled]}>
                <Text style={s.slotLetter}>{p ? p.charAt(0) : "?"}</Text>
              </View>
              <Text style={s.slotName}>{p || `Waiting…`}</Text>
              <View style={[s.badge, p ? s.badgeReady : s.badgeWaiting]}>
                <Text style={s.badgeText}>{p ? (isMe ? "You" : "Ready") : "—"}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Progress */}
      <Text style={s.progress}>
        {players.length}/4 players joined
      </Text>

      {players.length === 4 ? (
        <View style={s.startBox}>
          <Text style={s.startText}>🎴  Starting game…</Text>
        </View>
      ) : (
        <Text style={s.waitText}>Waiting for all players to join</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex:1, backgroundColor:C.bg, padding:24, paddingTop:56 },
  header: { alignItems:"center", marginBottom:32 },
  title: { color:C.textSec, fontSize:F.sm, fontWeight:"700", letterSpacing:2 },
  codeRow: { flexDirection:"row", alignItems:"center", gap:12, marginTop:8 },
  code: { fontSize:F.hero, fontWeight:"900", color:C.gold, letterSpacing:8 },
  copyIcon: { fontSize:24, color:C.textSec, marginTop:4 },
  hint: { color:C.textDim, fontSize:F.sm, marginTop:8 },
  slots: { gap:12 },
  slot: {
    flexDirection:"row", alignItems:"center", gap:12,
    backgroundColor:C.bgCard, borderRadius:R.lg,
    padding:14, borderWidth:1, borderColor:C.border,
  },
  slotMe: { borderColor:C.gold },
  slotAvatar: {
    width:44, height:44, borderRadius:22,
    backgroundColor:C.border, justifyContent:"center", alignItems:"center",
  },
  slotAvatarFilled: { backgroundColor:C.btnGreen },
  slotLetter: { color:C.white, fontWeight:"800", fontSize:F.lg },
  slotName: { flex:1, color:C.white, fontWeight:"600", fontSize:F.md },
  badge: { paddingHorizontal:12, paddingVertical:4, borderRadius:R.full },
  badgeReady:   { backgroundColor:"rgba(76,175,129,0.25)" },
  badgeWaiting: { backgroundColor:"rgba(255,255,255,0.08)" },
  badgeText: { color:C.positive, fontWeight:"700", fontSize:F.sm },
  progress: { color:C.textSec, textAlign:"center", marginVertical:20 },
  waitText: { color:C.textDim, textAlign:"center", fontSize:F.sm },
  startBox: {
    backgroundColor:"rgba(242,193,78,0.15)", borderRadius:R.lg,
    padding:16, borderWidth:1, borderColor:C.gold, alignItems:"center",
  },
  startText: { color:C.gold, fontWeight:"700", fontSize:F.md },
});
