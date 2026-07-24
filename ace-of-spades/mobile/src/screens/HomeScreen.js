import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { C, F, R } from "../theme";

function MenuBtn({ label, icon, onPress, gold }) {
  return (
    <TouchableOpacity
      style={[s.btn, gold && s.btnGold]}
      onPress={onPress} activeOpacity={0.8}
    >
      <Text style={[s.btnText, gold && s.btnTextGold]}>{icon}  {label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ playerName, score=1250, onCreateRoom, onJoinRoom, onLeaderboard, onProfile }) {
  return (
    <View style={s.bg}>
      {/* Top bar */}
      <TouchableOpacity style={s.profileBar} onPress={onProfile}>
        <View style={s.avatar}><Text style={s.avatarLetter}>{(playerName||"P").charAt(0)}</Text></View>
        <View>
          <Text style={s.playerName}>{playerName || "Player_01"}</Text>
          <Text style={s.score}>♠ {score}</Text>
        </View>
        <Text style={s.gear}>⚙</Text>
      </TouchableOpacity>

      {/* Logo */}
      <View style={s.hero}>
        <Text style={s.heroSpade}>♠</Text>
        <Text style={s.heroTitle}>ACE OF SPADES</Text>
      </View>

      {/* Menu */}
      <View style={s.menu}>
        <MenuBtn label="PLAY NOW"     icon="▶" onPress={onCreateRoom} gold />
        <MenuBtn label="CREATE ROOM"  icon="+" onPress={onCreateRoom} />
        <MenuBtn label="JOIN ROOM"    icon="⬎" onPress={onJoinRoom} />
        <MenuBtn label="LEADERBOARD"  icon="🏆" onPress={onLeaderboard} />
        <MenuBtn label="STORE"        icon="🛒" onPress={() => {}} />
      </View>

      {/* Bottom nav */}
      <View style={s.nav}>
        {["🏠","🏆","👤","⚙"].map((icon,i) => (
          <TouchableOpacity key={i} style={s.navBtn}>
            <Text style={s.navIcon}>{icon}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex:1, backgroundColor:C.bg },
  profileBar: {
    flexDirection:"row", alignItems:"center", gap:12,
    padding:16, paddingTop:52,
  },
  avatar: {
    width:44, height:44, borderRadius:22, backgroundColor:C.btnGreen,
    justifyContent:"center", alignItems:"center",
    borderWidth:2, borderColor:C.gold,
  },
  avatarLetter: { color:C.white, fontWeight:"800", fontSize:F.lg },
  playerName: { color:C.white, fontWeight:"700", fontSize:F.md },
  score:    { color:C.gold, fontSize:F.sm, fontWeight:"600" },
  gear:     { marginLeft:"auto", fontSize:22, color:C.textSec },
  hero:     { alignItems:"center", marginVertical:28 },
  heroSpade:{ fontSize:80, color:C.gold },
  heroTitle:{ fontSize:F.xl, fontWeight:"900", color:C.white, letterSpacing:4, marginTop:-8 },
  menu:     { paddingHorizontal:28, gap:12 },
  btn: {
    backgroundColor:C.btnGreen, borderRadius:R.lg,
    paddingVertical:16, alignItems:"center",
    borderWidth:1, borderColor:C.border,
  },
  btnGold:  { backgroundColor:C.gold },
  btnText:  { color:C.white, fontWeight:"700", fontSize:F.md, letterSpacing:1 },
  btnTextGold: { color:C.bg },
  nav: {
    flexDirection:"row", justifyContent:"space-around",
    position:"absolute", bottom:0, left:0, right:0,
    backgroundColor:C.bgCard, paddingBottom:24, paddingTop:12,
    borderTopWidth:1, borderColor:C.border,
  },
  navBtn: { padding:8 },
  navIcon: { fontSize:22 },
});
