import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { C, F, R } from "../theme";

const RULES = [
  { title:"Overview", icon:"♠", body:"4 players · 13 rounds · Each round, that many cards are dealt.\nBid how many tricks you'll win before each round.\nHighest score after Round 13 wins." },
  { title:"Card Ranking", icon:"🃏", body:"Within every suit:\n2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A\n\nAce of Spades ♠A is the strongest card in the game." },
  { title:"Spade is Trump", icon:"♠", body:"Spade beats every other suit.\n\nIf any Spade is played in a trick, the highest Spade wins — even if the lead card is an Ace of another suit.\n\nClub, Heart and Diamond have no priority over each other." },
  { title:"Playing Tricks", icon:"🎴", body:"The first card played sets the Lead Suit (highlighted with a gold border on the table).\n\nYou MUST play the lead suit if you have it.\n\nIf you have no card of the lead suit, play any card.\n\nHighest lead-suit card wins unless a Spade was played." },
  { title:"Bidding", icon:"🔢", body:"Bidding happens in turn order. Each bid is revealed to everyone the moment it's locked in — so later bidders can see earlier bids.\n\nMinimum bids:\n• Rounds 1–4: min 0\n• Rounds 5–8: min 1\n• Rounds 9–11: min 2\n• Rounds 12–13: min 3" },
  { title:"Scoring", icon:"📊", body:"Rounds 1–4: 10 pts per trick. Penalty: -10 × bid\nRounds 5–8: 20 pts per trick. Penalty: -20 × bid\nRounds 9–11: 30 pts per trick. Penalty: -30 × bid\nRounds 12–13: 40 pts per trick. Penalty: -40 × bid\n\nBonus if Won > Bid:\n(Won − Bid) × (pts ÷ 2)\n\nExample Round 8: Bid 4, Won 6\n→ 4×20 + 2×10 = 100 pts" },
  { title:"Advantage Rule", icon:"👑", body:"The player who wins the LAST trick of a round gets two advantages next round:\n\n1. They BID LAST\n2. They PLAY LAST in every trick\n\nThis is the signature rule of Ace of Spades." },
  { title:"Winning", icon:"🏆", body:"After Round 13, add all scores.\nHighest score wins.\n\nTie-breaks:\n1. Most total tricks won\n2. Most rounds where Won = Bid exactly\n3. If still tied, share the position." },
];

export default function HowToPlayScreen({ onBack }) {
  const [open, setOpen] = useState(null);
  return (
    <ScrollView contentContainerStyle={s.bg}>
      <TouchableOpacity onPress={onBack} style={s.back}><Text style={s.backText}>← How to Play</Text></TouchableOpacity>
      <Text style={s.subtitle}>Ace of Spades · Official Rules</Text>
      {RULES.map((r, i) => (
        <TouchableOpacity key={i} style={[s.card, open===i && s.cardOpen]} onPress={() => setOpen(open===i ? null : i)} activeOpacity={0.8}>
          <View style={s.cardHeader}>
            <Text style={s.cardIcon}>{r.icon}</Text>
            <Text style={s.cardTitle}>{r.title}</Text>
            <Text style={s.chevron}>{open===i ? "▲" : "▼"}</Text>
          </View>
          {open===i && <Text style={s.cardBody}>{r.body}</Text>}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  bg:       { flexGrow:1, backgroundColor:C.bg, padding:20, paddingTop:52 },
  back:     { marginBottom:16 },
  backText: { color:C.gold, fontSize:F.md, fontWeight:"700" },
  subtitle: { color:C.textSec, fontSize:F.sm, marginBottom:20, textAlign:"center" },
  card:     { backgroundColor:C.bgCard, borderRadius:R.lg, marginBottom:10, padding:16, borderWidth:1, borderColor:C.border },
  cardOpen: { borderColor:C.gold },
  cardHeader:{ flexDirection:"row", alignItems:"center", gap:10 },
  cardIcon: { fontSize:20 },
  cardTitle:{ flex:1, color:C.white, fontWeight:"700", fontSize:F.md },
  chevron:  { color:C.textDim, fontSize:12 },
  cardBody: { color:C.textSec, fontSize:F.sm, marginTop:12, lineHeight:20 },
});
