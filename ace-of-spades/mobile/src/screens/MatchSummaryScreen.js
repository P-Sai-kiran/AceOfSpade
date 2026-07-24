// MatchSummaryScreen — final screen after Round 13 (wireframe "Match Summary")
import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { C, F, R } from "../theme";
import { useGame } from "../context/GameContext";

export default function MatchSummaryScreen({ onLobby, onPlayAgain }) {
  const { state } = useGame();
  const { players=[], yourSeat, finalRankings=[], history=[] } = state || {};
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue:1, friction:5, useNativeDriver:true }),
      Animated.timing(opacity, { toValue:1, duration:500, useNativeDriver:true }),
    ]).start();
  }, []);

  const ranked = finalRankings?.length
    ? finalRankings.map(r => ({ ...players[r.seat], rank: r.rank }))
    : [...players].sort((a,b)=>b.totalScore-a.totalScore).map((p,i)=>({...p,rank:i+1}));

  const winner = ranked[0];
  const iWon = winner?.seat === yourSeat;

  // Build scorecard grid from history
  const rounds = history.map(h => h);

  return (
    <ScrollView contentContainerStyle={s.bg}>
      {/* Winner banner */}
      <Animated.View style={[s.winnerBanner, { opacity, transform:[{scale}] }]}>
        <Text style={s.trophy}>🏆</Text>
        <Text style={s.winnerName}>{winner?.name || "?"}</Text>
        <Text style={s.winnerScore}>{winner?.totalScore}</Text>
        {iWon && <Text style={s.youWon}>You Won!</Text>}
      </Animated.View>

      {/* All scores */}
      <Text style={s.sectionLabel}>MATCH SUMMARY</Text>
      <View style={s.summaryList}>
        {ranked.map((p, i) => (
          <View key={p.seat} style={[s.summaryRow, p.seat===yourSeat && s.summaryRowMe]}>
            <Text style={s.summaryRank}>
              {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
            </Text>
            <View style={[s.summaryAvatar, i===0 && s.summaryAvatarWinner]}>
              <Text style={s.summaryLetter}>{p.name?.charAt(0)||"?"}</Text>
            </View>
            <Text style={[s.summaryName, p.seat===yourSeat && {color:C.gold}]}>
              {p.seat===yourSeat ? "You" : p.name}
            </Text>
            <Text style={s.summaryTotal}>{p.totalScore}</Text>
          </View>
        ))}
      </View>

      {/* Detailed scorecard (compact) */}
      <Text style={s.sectionLabel}>SCORECARD</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={s.table}>
          {/* Header */}
          <View style={s.tableRow}>
            <Text style={[s.cell, s.cellHd]}>Rnd</Text>
            {players.map(p => (
              <Text key={p.seat} style={[s.cell, s.cellHd, p.seat===yourSeat && {color:C.gold}]}>
                {p.seat===yourSeat?"You":p.name?.split("_")[0]||`P${p.seat+1}`}
              </Text>
            ))}
          </View>
          {rounds.map(r => (
            <View key={r.round} style={s.tableRow}>
              <Text style={[s.cell, s.cellRound]}>{r.round}</Text>
              {players.map(p => {
                const sc = r.scores[p.seat];
                return (
                  <Text key={p.seat} style={[s.cell, sc>0?s.pos:sc<0?s.neg:s.zero, p.seat===yourSeat&&{fontWeight:"800"}]}>
                    {sc>0?"+":""}{sc}
                  </Text>
                );
              })}
            </View>
          ))}
          {/* Total */}
          <View style={[s.tableRow, s.tableRowTotal]}>
            <Text style={[s.cell, s.cellHd]}>Total</Text>
            {players.map(p => (
              <Text key={p.seat} style={[s.cell, s.cellHd, p.seat===yourSeat&&{color:C.gold}]}>
                {p.totalScore}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity style={s.lobbyBtn} onPress={onLobby}>
          <Text style={s.lobbyBtnText}>LOBBY</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.playBtn} onPress={onPlayAgain}>
          <Text style={s.playBtnText}>PLAY AGAIN</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  bg: { flexGrow:1, backgroundColor:C.bg, padding:24, paddingTop:52 },
  winnerBanner: {
    alignItems:"center", backgroundColor:C.bgCard,
    borderRadius:R.xl, padding:24, marginBottom:24,
    borderWidth:2, borderColor:C.gold,
  },
  trophy: { fontSize:56, marginBottom:4 },
  winnerName: { color:C.white, fontSize:F.xxl, fontWeight:"900" },
  winnerScore:{ color:C.gold, fontSize:F.hero, fontWeight:"900" },
  youWon: { color:C.gold, fontSize:F.xl, fontWeight:"900", marginTop:8, letterSpacing:2 },
  sectionLabel:{ color:C.textDim, fontSize:F.xs, fontWeight:"700", letterSpacing:2, marginBottom:10, marginTop:8 },
  summaryList: { gap:8, marginBottom:20 },
  summaryRow: {
    flexDirection:"row", alignItems:"center", gap:10,
    backgroundColor:C.bgCard, borderRadius:R.lg,
    padding:12, borderWidth:1, borderColor:C.border,
  },
  summaryRowMe: { borderColor:C.gold },
  summaryRank:  { fontSize:22, width:36 },
  summaryAvatar:{
    width:38, height:38, borderRadius:19,
    backgroundColor:C.btnGreen, justifyContent:"center", alignItems:"center",
  },
  summaryAvatarWinner:{ borderWidth:2, borderColor:C.gold },
  summaryLetter:{ color:C.white, fontWeight:"800", fontSize:F.md },
  summaryName:  { flex:1, color:C.white, fontWeight:"600", fontSize:F.md },
  summaryTotal: { color:C.white, fontWeight:"900", fontSize:F.lg },
  // Scorecard table
  table:      { borderWidth:1, borderColor:C.border, borderRadius:R.md, overflow:"hidden" },
  tableRow:   { flexDirection:"row", borderBottomWidth:1, borderColor:C.border },
  tableRowTotal:{ backgroundColor:C.bgCard },
  cell:       { width:56, padding:8, textAlign:"center", color:C.white, fontSize:F.xs },
  cellHd:     { fontWeight:"800", color:C.textSec },
  cellRound:  { color:C.textSec },
  pos:        { color:C.positive },
  neg:        { color:C.negative },
  zero:       { color:C.textDim },
  // Actions
  actions: { flexDirection:"row", gap:12, marginTop:20 },
  lobbyBtn:{
    flex:1, backgroundColor:C.btnGreen, borderRadius:R.lg,
    paddingVertical:16, alignItems:"center", borderWidth:1, borderColor:C.border,
  },
  lobbyBtnText:{ color:C.white, fontWeight:"700", fontSize:F.md, letterSpacing:1 },
  playBtn: {
    flex:1, backgroundColor:C.gold, borderRadius:R.lg,
    paddingVertical:16, alignItems:"center",
  },
  playBtnText:{ color:C.bg, fontWeight:"900", fontSize:F.md, letterSpacing:1 },
});
