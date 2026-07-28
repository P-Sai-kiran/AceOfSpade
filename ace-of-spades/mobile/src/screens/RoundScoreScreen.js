import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { C, F, R } from "../theme";
import { useGame } from "../context/GameContext";

function tier(round) {
  if (round<=4) return "10 pts/trick"; if (round<=8) return "20 pts/trick";
  if (round<=11) return "30 pts/trick"; return "40 pts/trick";
}

export default function RoundScoreScreen() {
  const { state } = useGame();
  const { round, players=[], history=[], yourSeat } = state || {};
  const last = history[history.length - 1];
  if (!last) return null;

  const sorted = [...players].sort((a,b) => b.totalScore - a.totalScore);

  return (
    <ScrollView contentContainerStyle={s.bg}>
      <Text style={s.title}>ROUND {last.round}</Text>
      <Text style={s.tierLabel}>{tier(last.round)}</Text>

      {/* Per-player round result */}
      <View style={s.results}>
        {players.map(p => {
          const bid = last.bids[p.seat];
          const won = last.tricksWon[p.seat];
          const pts = last.scores[p.seat];
          const hit = won === bid;
          const over = won > bid;
          const isMe = p.seat === yourSeat;
          return (
            <View key={p.seat} style={[s.row, isMe && s.rowMe]}>
              <View style={[s.avatar, isMe && s.avatarMe]}>
                <Text style={s.avatarL}>{p.name?.charAt(0)||"?"}</Text>
              </View>
              <View style={s.mid}>
                <Text style={[s.name, isMe && s.nameMe]}>{isMe?"You":p.name}</Text>
                <Text style={s.detail}>
                  Bid {bid} · Won {won} · {hit?"✓ Hit":over?"↑ Bonus":"✗ Missed"}
                </Text>
              </View>
              <Text style={[s.pts, pts>=0 ? s.pos : s.neg]}>
                {pts>=0?"+":""}{pts}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={s.standLabel}>STANDINGS</Text>
      <View style={s.standings}>
        {sorted.map((p, i) => (
          <View key={p.seat} style={[s.stand, p.seat===yourSeat && s.standMe]}>
            <Text style={s.rank}>{["🥇","🥈","🥉","4"][i]}</Text>
            <Text style={[s.standName, p.seat===yourSeat&&{color:C.gold}]}>
              {p.seat===yourSeat?"You":p.name}
            </Text>
            <Text style={s.total}>{p.totalScore}</Text>
          </View>
        ))}
      </View>

      {round < 13
        ? <Text style={s.hint}>Next round starting in a moment…</Text>
        : <Text style={[s.hint,{color:C.gold}]}>Final round complete!</Text>
      }
    </ScrollView>
  );
}

const s = StyleSheet.create({
  bg:       { flexGrow:1, backgroundColor:C.bg, padding:24, paddingTop:52 },
  title:    { fontSize:F.xxl, fontWeight:"900", color:C.gold, textAlign:"center" },
  tierLabel:{ color:C.textSec, textAlign:"center", marginBottom:24 },
  results:  { gap:10, marginBottom:24 },
  row:      { flexDirection:"row", alignItems:"center", gap:12, backgroundColor:C.bgCard, borderRadius:R.lg, padding:14, borderWidth:1, borderColor:C.border },
  rowMe:    { borderColor:C.gold, backgroundColor:C.goldBg },
  avatar:   { width:40, height:40, borderRadius:20, backgroundColor:C.btnGreen, justifyContent:"center", alignItems:"center" },
  avatarMe: { borderWidth:2, borderColor:C.gold },
  avatarL:  { color:C.white, fontWeight:"800", fontSize:F.md },
  mid:      { flex:1 },
  name:     { color:C.white, fontWeight:"700", fontSize:F.md },
  nameMe:   { color:C.gold },
  detail:   { color:C.textSec, fontSize:F.xs, marginTop:2 },
  pts:      { fontSize:F.xl, fontWeight:"900" },
  pos:      { color:C.positive },
  neg:      { color:C.negative },
  standLabel:{ color:C.textDim, fontSize:F.xs, fontWeight:"700", letterSpacing:2, marginBottom:8 },
  standings:{ gap:6, marginBottom:20 },
  stand:    { flexDirection:"row", alignItems:"center", paddingVertical:10, borderBottomWidth:1, borderColor:C.border },
  standMe:  { backgroundColor:C.goldBg, borderRadius:R.sm, paddingHorizontal:8 },
  rank:     { fontSize:20, width:36 },
  standName:{ color:C.white, flex:1, fontWeight:"600" },
  total:    { color:C.white, fontWeight:"900", fontSize:F.lg },
  hint:     { color:C.textDim, textAlign:"center", fontSize:F.sm },
});
