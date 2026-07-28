import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Share, ActivityIndicator } from "react-native";
import { C, F, R } from "../theme";
import { useGame } from "../context/GameContext";

export default function LobbyScreen({ roomCode, myName }) {
  const { lobbyPlayers } = useGame();

  function shareCode() {
    Share.share({ message: `Join my Ace of Spades game!\nRoom code: ${roomCode}\n\nDownload the app and tap JOIN ROOM.` });
  }

  const count = lobbyPlayers.length;

  return (
    <View style={s.bg}>
      {/* Room code */}
      <View style={s.header}>
        <Text style={s.codeLabel}>ROOM CODE</Text>
        <TouchableOpacity onPress={shareCode} style={s.codeRow}>
          <Text style={s.code}>{roomCode}</Text>
          <Text style={s.shareIcon}>⎘</Text>
        </TouchableOpacity>
        <Text style={s.hint}>Tap to share with friends</Text>
      </View>

      {/* Player slots */}
      <View style={s.slots}>
        {[0, 1, 2, 3].map(i => {
          const name   = lobbyPlayers[i];
          const isMe   = name === myName;
          const filled = !!name;
          return (
            <View key={i} style={[s.slot, isMe && s.slotMe, filled && s.slotFilled]}>
              <View style={[s.avatar, filled && s.avatarFilled]}>
                <Text style={s.avatarLetter}>{filled ? name.charAt(0).toUpperCase() : (i + 1).toString()}</Text>
              </View>
              <View style={s.slotInfo}>
                <Text style={[s.slotName, !filled && s.slotNameEmpty]}>
                  {filled ? name : `Waiting for player ${i + 1}…`}
                </Text>
                {isMe && <Text style={s.youTag}>You</Text>}
              </View>
              <View style={[s.dot, filled ? s.dotGreen : s.dotGrey]} />
            </View>
          );
        })}
      </View>

      {/* Status */}
      <View style={s.status}>
        {count < 4 ? (
          <>
            <ActivityIndicator color={C.gold} style={{ marginBottom: 12 }} />
            <Text style={s.statusText}>{count}/4 players joined</Text>
            <Text style={s.statusSub}>Game starts automatically when all 4 join</Text>
          </>
        ) : (
          <>
            <Text style={s.statusReady}>✓ All players joined!</Text>
            <Text style={s.statusSub}>Starting game…</Text>
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bg:       { flex: 1, backgroundColor: C.bg, padding: 24, paddingTop: 52 },
  header:   { alignItems: "center", marginBottom: 32 },
  codeLabel:{ color: C.textDim, fontSize: F.xs, fontWeight: "700", letterSpacing: 3 },
  codeRow:  { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 },
  code:     { fontSize: 52, fontWeight: "900", color: C.gold, letterSpacing: 10 },
  shareIcon:{ fontSize: 24, color: C.textSec },
  hint:     { color: C.textDim, fontSize: F.xs, marginTop: 6 },
  slots:    { gap: 10, marginBottom: 28 },
  slot:     {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.bgCard, borderRadius: R.lg,
    padding: 14, borderWidth: 1, borderColor: C.border,
  },
  slotMe:     { borderColor: C.gold },
  slotFilled: { borderColor: C.border },
  avatar:     {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.border, justifyContent: "center", alignItems: "center",
  },
  avatarFilled: { backgroundColor: C.btnGreen },
  avatarLetter: { color: C.white, fontWeight: "800", fontSize: F.lg },
  slotInfo:   { flex: 1 },
  slotName:   { color: C.white, fontWeight: "600", fontSize: F.md },
  slotNameEmpty: { color: C.textDim, fontStyle: "italic" },
  youTag:     { color: C.gold, fontSize: F.xs, fontWeight: "700", marginTop: 2 },
  dot:        { width: 10, height: 10, borderRadius: 5 },
  dotGreen:   { backgroundColor: C.positive },
  dotGrey:    { backgroundColor: C.border },
  status:     { alignItems: "center" },
  statusText: { color: C.white, fontSize: F.lg, fontWeight: "700" },
  statusReady:{ color: C.positive, fontSize: F.lg, fontWeight: "800" },
  statusSub:  { color: C.textDim, fontSize: F.sm, marginTop: 6 },
});
