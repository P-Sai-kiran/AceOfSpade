import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { C, F, R } from "../theme";
import { useGame } from "../context/GameContext";

export default function MatchSummaryScreen({ onLobby, onPlayAgain }) {
  const { state } = useGame();
  const { players=[], yourSeat, finalRankings=[], history=[] } = state || {};

  const ranked = finalRankings?.length
    ? finalRankings.map(r => ({ ...players[r.seat], rank:r.rank }))
    : [...players].sort((a,b)=>b.totalScore-a.totalScore).map((p,i)=>({...p,rank:i+1}));

  const winner = ranked[0];
  const iWon   = winner?.seat === yourSeat;

  return (
    <ScrollView contentContainerStyle={s.bg}>
      <View style={s.winnerBox}>
        <Text style={s.trophy}>🏆</Text>
        <Text style={s.winnerName}>{iWon ? "You Won!" : (winner?.name || "Winner")}</Text>
        <Text style={s.winnerScore}>{winner?.totalScore} pts</Text>
        {!iWon && <Text style={s.betterLuck}>Better luck next time!</Text>}
      </View>

      <Text style={s.sectionLabel}>FINAL STANDINGS</Text>
      {ranked.map((p, i) => (
        <View key={p.seat} style={[s.row, p.seat===yourSeat && s.rowMe]}>
          <Text style={s.medal}>{["🥇","🥈","🥉","4th"][i]}</Text>
          <View style={[s.avatar, i===0&&s.avatarWin]}><Text style={s.avatarL}>{p.name?.charAt(0)||"?"}</Text></View>
          <Text style={[s.name, p.seat===yourSeat&&{color:C.gold}]}>{p.seat===yourSeat?"You":p.name}</Text>
          <Text style={s.score}>{p.totalScore}</Text>
        </View>
      ))}

      <Text style={s.sectionLabel}>SCORECARD</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={[s.tableRow, s.tableHeader]}>
            <Text style={[s.cell, s.cellHd]}>Rnd</Text>
            {players.map(p=>(<Text key={p.seat} style={[s.cell, s.cellHd, p.seat===yourSeat&&{color:C.gold}]}>{p.seat===yourSeat?"You":p.name?.split("_")[0]||`P${p.seat+1}`}</Text>))}
          </View>
          {history.map(h=>(
            <View key={h.round} style={s.tableRow}>
              <Text style={[s.cell, s.cellRnd]}>{h.round}</Text>
              {players.map(p=>{ const sc=h.scores[p.seat]; return <Text key={p.seat} style={[s.cell, sc>0?s.pos:sc<0?s.neg:s.zero]}>{sc>0?"+":""}{sc}</Text>; })}
            </View>
          ))}
          <View style={[s.tableRow, s.tableTotal]}>
            <Text style={[s.cell, s.cellHd]}>Total</Text>
            {players.map(p=>(<Text key={p.seat} style={[s.cell, s.cellHd, p.seat===yourSeat&&{color:C.gold}]}>{p.totalScore}</Text>))}
          </View>
        </View>
      </ScrollView>

      <View style={s.actions}>
        <TouchableOpacity style={s.lobbyBtn} onPress={onLobby}><Text style={s.lobbyBtnText}>BACK TO HOME</Text></TouchableOpacity>
        <TouchableOpacity style={s.playBtn} onPress={onPlayAgain}><Text style={s.playBtnText}>PLAY AGAIN</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  bg:       { flexGrow:1, backgroundColor:C.bg, padding:20, paddingTop:52 },
  winnerBox:{ alignItems:"center", backgroundColor:C.bgCard, borderRadius:R.xl, padding:24, marginBottom:24, borderWidth:2, borderColor:C.gold },
  trophy:   { fontSize:56 },
  winnerName:{ color:C.white, fontSize:F.xxl, fontWeight:"900", marginTop:4 },
  winnerScore:{ color:C.gold, fontSize:F.hero, fontWeight:"900" },
  betterLuck:{ color:C.textSec, fontSize:F.sm, marginTop:8 },
  sectionLabel:{ color:C.textDim, fontSize:F.xs, fontWeight:"700", letterSpacing:2, marginBottom:10, marginTop:8 },
  row:      { flexDirection:"row", alignItems:"center", gap:10, backgroundColor:C.bgCard, borderRadius:R.lg, padding:12, marginBottom:8, borderWidth:1, borderColor:C.border },
  rowMe:    { borderColor:C.gold },
  medal:    { fontSize:20, width:36 },
  avatar:   { width:36, height:36, borderRadius:18, backgroundColor:C.btnGreen, justifyContent:"center", alignItems:"center" },
  avatarWin:{ borderWidth:2, borderColor:C.gold },
  avatarL:  { color:C.white, fontWeight:"800" },
  name:     { flex:1, color:C.white, fontWeight:"600", fontSize:F.md },
  score:    { color:C.white, fontWeight:"900", fontSize:F.lg },
  tableRow: { flexDirection:"row", borderBottomWidth:1, borderColor:C.border },
  tableHeader:{ backgroundColor:C.bgCard },
  tableTotal: { backgroundColor:C.bgCard },
  cell:     { width:60, padding:8, textAlign:"center", color:C.white, fontSize:F.xs },
  cellHd:   { fontWeight:"800", color:C.textSec },
  cellRnd:  { color:C.textDim },
  pos:      { color:C.positive },
  neg:      { color:C.negative },
  zero:     { color:C.textDim },
  actions:  { flexDirection:"row", gap:12, marginTop:24, marginBottom:20 },
  lobbyBtn: { flex:1, backgroundColor:C.btnGreen, borderRadius:R.lg, paddingVertical:16, alignItems:"center" },
  lobbyBtnText:{ color:C.white, fontWeight:"700", fontSize:F.sm, letterSpacing:1 },
  playBtn:  { flex:1, backgroundColor:C.gold, borderRadius:R.lg, paddingVertical:16, alignItems:"center" },
  playBtnText:{ color:C.bg, fontWeight:"900", fontSize:F.sm, letterSpacing:1 },
});
