// BidsDisclosedScreen — shown for 3s when all bids are revealed simultaneously (Rule 13)
// Matches wireframe screen 5: "ROUND 6 BIDS" with player list + advantage note
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { C, F, R } from "../theme";
import { useGame } from "../context/GameContext";

export default function BidsDisclosedScreen() {
  const { state } = useGame();
  const { round, players=[], bids={}, yourSeat, trickPlayOrder=[], advantageSeat } = state || {};

  const fadeAnims = trickPlayOrder.map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    const anims = fadeAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue:1, duration:300,
        delay: i * 180, useNativeDriver:true,
      })
    );
    Animated.stagger(180, anims).start();
  }, []);

  return (
    <View style={s.bg}>
      <View style={s.card}>
        <Text style={s.title}>ROUND {round}</Text>
        <Text style={s.subtitle}>BIDS</Text>

        <View style={s.list}>
          {trickPlayOrder.map((seat, idx) => {
            const p = players[seat];
            const isMe = seat === yourSeat;
            const isAdv = seat === advantageSeat;
            return (
              <Animated.View key={seat} style={[s.row, isMe && s.rowMe, { opacity: fadeAnims[idx] }]}>
                <View style={[s.avatar, isAdv && s.avatarAdv]}>
                  <Text style={s.avatarLetter}>{p?.name?.charAt(0) || "?"}</Text>
                </View>
                <Text style={[s.name, isMe && s.nameMe]}>
                  {isMe ? "You" : p?.name || `P${seat+1}`}
                </Text>
                <Text style={[s.bid, isMe && s.bidMe]}>{bids[seat] ?? "—"}</Text>
              </Animated.View>
            );
          })}
        </View>

        {/* Advantage note */}
        <View style={s.advBox}>
          <Text style={s.advCrown}>♠</Text>
          <Text style={s.advText}>
            {players[advantageSeat]?.name || ""}
            {advantageSeat === yourSeat ? " (You)" : ""}
            {" "}will play last in every trick
          </Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex:1, backgroundColor:C.bg, justifyContent:"center", alignItems:"center", padding:24 },
  card: {
    backgroundColor:C.bgCard, borderRadius:R.xl,
    padding:28, width:"100%",
    borderWidth:1, borderColor:C.border,
  },
  title: { fontSize:F.xl, fontWeight:"900", color:C.gold, textAlign:"center" },
  subtitle:{ fontSize:F.xxl, fontWeight:"900", color:C.white, textAlign:"center", marginBottom:24 },
  list: { gap:10, marginBottom:20 },
  row: {
    flexDirection:"row", alignItems:"center", gap:12,
    backgroundColor:"rgba(255,255,255,0.04)", borderRadius:R.md,
    padding:14, borderWidth:1, borderColor:"transparent",
  },
  rowMe: { backgroundColor:C.goldBg, borderColor:C.gold },
  avatar: {
    width:40, height:40, borderRadius:20,
    backgroundColor:C.btnGreen, justifyContent:"center", alignItems:"center",
  },
  avatarAdv: { borderWidth:2, borderColor:C.gold },
  avatarLetter: { color:C.white, fontWeight:"800", fontSize:F.md },
  name: { flex:1, color:C.white, fontWeight:"600", fontSize:F.md },
  nameMe: { color:C.gold },
  bid:  { fontSize:F.xxl, fontWeight:"900", color:C.white },
  bidMe: { color:C.gold },
  advBox: {
    flexDirection:"row", alignItems:"center", gap:10,
    backgroundColor:C.goldBg, borderRadius:R.lg,
    padding:14, borderWidth:1, borderColor:C.gold,
  },
  advCrown:{ fontSize:22, color:C.gold },
  advText: { flex:1, color:C.gold, fontWeight:"700", fontSize:F.sm },
});
