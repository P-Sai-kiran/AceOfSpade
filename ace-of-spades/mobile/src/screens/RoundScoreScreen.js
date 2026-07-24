// RoundScoreScreen — matches wireframe screen 7 "ROUND RESULT"
import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Animated } from "react-native";
import { C, F, R } from "../theme";
import { useGame } from "../context/GameContext";

function ScoreRow({ player, bid, won, score, isMe, delay }) {
  const slideX = useRef(new Animated.Value(-40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideX,  { toValue:0, duration:300, delay, useNativeDriver:true }),
      Animated.timing(opacity, { toValue:1, duration:300, delay, useNativeDriver:true }),
    ]).start();
  }, []);

  const positive = score >= 0;
  return (
    <Animated.View style={[s.row, isMe && s.rowMe, { opacity, transform:[{translateX:slideX}] }]}>
      <View style={[s.rowAvatar, isMe && s.rowAvatarMe]}>
        <Text style={s.rowLetter}>{player.name?.charAt(0) || "?"}</Text>
      </View>
      <View style={s.rowMid}>
        <Text style={[s.rowName, isMe && s.rowNameMe]}>
          {isMe ? "You" : player.name}
        </Text>
        <Text style={s.rowDetail}>Bid: {bid}  ·  Won: {won}</Text>
      </View>
      <Text style={[s.rowScore, positive ? s.positive : s.negative]}>
        {positive ? "+" : ""}{score}
      </Text>
    </Animated.View>
  );
}

export default function RoundScoreScreen() {
  const { state } = useGame();
  const { round, players=[], history=[], yourSeat } = state || {};
  const last = history[history.length - 1];

  if (!last) return null;

  const sorted = [...players].sort((a,b) => b.totalScore - a.totalScore);

  return (
    <ScrollView contentContainerStyle={s.bg}>
      <View style={s.header}>
        <Text style={s.title}>ROUND {last.round}</Text>
        <Text style={s.subtitle}>RESULT</Text>
      </View>

      <View style={s.rows}>
        {players.map((p, idx) => (
          <ScoreRow
            key={p.seat}
            player={p}
            bid={last.bids[p.seat]}
            won={last.tricksWon[p.seat]}
            score={last.scores[p.seat]}
            isMe={p.seat === yourSeat}
            delay={idx * 150}
          />
        ))}
      </View>

      {/* Standings */}
      <Text style={s.standTitle}>Standings</Text>
      <View style={s.standings}>
        {sorted.map((p, i) => (
          <View key={p.seat} style={[s.standing, p.seat===yourSeat && s.standingMe]}>
            <Text style={s.standRank}>#{i+1}</Text>
            <Text style={[s.standName, p.seat===yourSeat && {color:C.gold}]}>
              {p.seat===yourSeat ? "You" : p.name}
            </Text>
            <Text style={s.standTotal}>{p.totalScore}</Text>
          </View>
        ))}
      </View>

      <Text style={s.hint}>
        {round < 13 ? `Next round in a moment…` : "Final round complete!"}
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  bg: { flexGrow:1, backgroundColor:C.bg, padding:24, paddingTop:52 },
  header: { alignItems:"center", marginBottom:24 },
  title: { fontSize:F.xl, fontWeight:"900", color:C.gold },
  subtitle:{ fontSize:F.xxl, fontWeight:"900", color:C.white },
  rows: { gap:10, marginBottom:24 },
  row: {
    flexDirection:"row", alignItems:"center", gap:12,
    backgroundColor:C.bgCard, borderRadius:R.lg,
    padding:14, borderWidth:1, borderColor:C.border,
  },
  rowMe:     { borderColor:C.gold, backgroundColor:C.goldBg },
  rowAvatar: {
    width:40, height:40, borderRadius:20,
    backgroundColor:C.btnGreen, justifyContent:"center", alignItems:"center",
  },
  rowAvatarMe: { borderWidth:2, borderColor:C.gold },
  rowLetter:   { color:C.white, fontWeight:"800", fontSize:F.md },
  rowMid:    { flex:1 },
  rowName:   { color:C.white, fontWeight:"700", fontSize:F.md },
  rowNameMe: { color:C.gold },
  rowDetail: { color:C.textSec, fontSize:F.sm },
  rowScore:  { fontSize:F.xl, fontWeight:"900" },
  positive:  { color:C.positive },
  negative:  { color:C.negative },
  standTitle:{ color:C.textSec, fontWeight:"700", fontSize:F.sm, letterSpacing:2, marginBottom:8 },
  standings: { gap:6, marginBottom:24 },
  standing:  {
    flexDirection:"row", paddingVertical:10,
    borderBottomWidth:1, borderColor:C.border,
  },
  standingMe:{ backgroundColor:C.goldBg, borderRadius:R.sm, paddingHorizontal:8 },
  standRank: { color:C.gold, width:28, fontWeight:"700" },
  standName: { color:C.white, flex:1, fontWeight:"600" },
  standTotal:{ color:C.white, fontWeight:"800", fontSize:F.lg },
  hint:      { color:C.textDim, textAlign:"center", fontSize:F.sm },
});
