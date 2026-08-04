import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { C, F, R } from "../theme";

function Btn({ label, icon, onPress, gold }) {
  return (
    <TouchableOpacity style={[s.btn, gold && s.btnGold]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[s.btnText, gold && s.btnTextGold]}>{icon}  {label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ playerName, onCreateRoom, onJoinRoom, onHowToPlay }) {
  return (
    <View style={s.bg}>
      <View style={s.topBar}>
        <View style={s.avatar}><Text style={s.avatarL}>{(playerName||"P").charAt(0).toUpperCase()}</Text></View>
        <View>
          <Text style={s.pname}>{playerName || "Player_01"}</Text>
          <Text style={s.pscore}>♠ Ready to play</Text>
        </View>
      </View>

      <View style={s.hero}>
        <Text style={s.spade}>♠</Text>
        <Text style={s.heroTitle}>ACE OF SPADES</Text>
        <Text style={s.heroSub}>4-Player Trick Taking Card Game</Text>
      </View>

      <View style={s.menu}>
        <Btn label="PLAY NOW"      icon="▶" onPress={onCreateRoom} gold />
        <Btn label="CREATE ROOM"   icon="+" onPress={onCreateRoom} />
        <Btn label="JOIN ROOM"     icon="⬎" onPress={onJoinRoom} />
        <Btn label="HOW TO PLAY"   icon="?" onPress={onHowToPlay} />
      </View>

      <Text style={s.footer}>Share a room code with 3 friends to start</Text>

      <View style={s.nav}>
        <TouchableOpacity style={s.navBtn} onPress={() => {}}>
          <Text style={s.navIcon}>🏠</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navBtn} onPress={onHowToPlay}>
          <Text style={s.navIcon}>📖</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navBtn} onPress={() => Alert.alert("Coming Soon", "Profile screen isn't available yet.")}>
          <Text style={s.navIcon}>👤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navBtn} onPress={() => Alert.alert("Coming Soon", "Settings aren't available yet.")}>
          <Text style={s.navIcon}>⚙</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bg:       { flex:1, backgroundColor:C.bg },
  topBar:   { flexDirection:"row", alignItems:"center", gap:12, padding:16, paddingTop:16 },
  avatar:   { width:44, height:44, borderRadius:22, backgroundColor:C.btnGreen, justifyContent:"center", alignItems:"center", borderWidth:2, borderColor:C.gold },
  avatarL:  { color:C.white, fontWeight:"800", fontSize:F.lg },
  pname:    { color:C.white, fontWeight:"700", fontSize:F.md },
  pscore:   { color:C.gold, fontSize:F.xs },
  hero:     { alignItems:"center", marginVertical:16 },
  spade:    { fontSize:80, color:C.gold },
  heroTitle:{ fontSize:F.xxl, fontWeight:"900", color:C.white, letterSpacing:4, marginTop:-8 },
  heroSub:  { color:C.textSec, fontSize:F.sm, marginTop:6 },
  menu:     { paddingHorizontal:24, gap:12 },
  btn:      { backgroundColor:C.btnGreen, borderRadius:R.lg, paddingVertical:16, alignItems:"center", borderWidth:1, borderColor:C.border },
  btnGold:  { backgroundColor:C.gold },
  btnText:  { color:C.white, fontWeight:"700", fontSize:F.md, letterSpacing:1 },
  btnTextGold:{ color:C.bg },
  footer:   { color:C.textDim, textAlign:"center", fontSize:F.xs, marginTop:16 },
  nav:      { flexDirection:"row", justifyContent:"space-around", position:"absolute", bottom:0, left:0, right:0, backgroundColor:C.bgCard, paddingBottom:20, paddingTop:10, borderTopWidth:1, borderColor:C.border },
  navBtn:   { padding:8 },
  navIcon:  { fontSize:22 },
});
