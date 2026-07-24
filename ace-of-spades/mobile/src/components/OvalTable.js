// OvalTable — the green felt table with 4 player positions.
// Layout: YOU always at bottom, opponents at left/top/right.
// Seats: your seat at bottom, (yours+1)%4 at left, (yours+2)%4 at top, (yours+3)%4 at right.
import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { C, F, R, S } from "../theme";
import { CardBack } from "./PlayingCard";

function Avatar({ name, score, handCount=0, isAdvantage, isCurrent, position }) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <View style={[styles.avatar, positionStyle(position), isCurrent && styles.avatarActive]}>
      {isAdvantage && <Text style={styles.crown}>♠</Text>}
      <View style={[styles.avatarCircle, isCurrent && styles.avatarCircleActive]}>
        <Text style={styles.avatarLetter}>{initial}</Text>
      </View>
      <Text style={styles.avatarName} numberOfLines={1}>{name}</Text>
      <Text style={styles.avatarScore}>{score}</Text>
      {/* Face-down cards showing hand size */}
      {handCount > 0 && (
        <View style={[styles.handPips, handPipPosition(position)]}>
          {Array.from({ length: Math.min(handCount, 4) }).map((_, i) => (
            <CardBack key={i} small style={{ marginHorizontal: -6, transform:[{rotate:`${(i-1.5)*4}deg`}] }} />
          ))}
        </View>
      )}
    </View>
  );
}

function positionStyle(pos) {
  switch(pos) {
    case "top":    return styles.posTop;
    case "left":   return styles.posLeft;
    case "right":  return styles.posRight;
    default:       return {};
  }
}
function handPipPosition(pos) {
  switch(pos) {
    case "top":   return styles.handBelow;
    case "left":  return styles.handRight;
    case "right": return styles.handLeft;
    default:      return {};
  }
}

// trickCards: array of {seat, card} for played cards
export default function OvalTable({ players, yourSeat, trickCards=[], advantageSeat, currentSeatToPlay, trickPlayOrder=[] }) {
  const leftSeat  = (yourSeat + 1) % 4;
  const topSeat   = (yourSeat + 2) % 4;
  const rightSeat = (yourSeat + 3) % 4;

  const p = (seat) => players?.[seat] || { name:"?", totalScore:0 };
  const playOrderPos = (seat) => {
    const idx = trickPlayOrder.indexOf(seat);
    return idx >= 0 ? idx + 1 : null;
  };

  // Map played cards to table position
  const cardAt = (seat) => trickCards.find(c => c.seat === seat)?.card;

  return (
    <View style={styles.tableWrap}>
      {/* Felt oval */}
      <View style={styles.felt}>
        {/* Center trick cards arranged in 4 positions */}
        <View style={styles.trickGrid}>
          <View style={styles.trickRow}>
            <View style={styles.trickSlot}>
              {cardAt(topSeat) ? <TrickCard card={cardAt(topSeat)} /> : <EmptySlot />}
            </View>
          </View>
          <View style={styles.trickMiddleRow}>
            <View style={styles.trickSlot}>
              {cardAt(leftSeat) ? <TrickCard card={cardAt(leftSeat)} /> : <EmptySlot />}
            </View>
            <View style={styles.trickSlot}>
              {cardAt(yourSeat) ? <TrickCard card={cardAt(yourSeat)} /> : <EmptySlot />}
            </View>
            <View style={styles.trickSlot}>
              {cardAt(rightSeat) ? <TrickCard card={cardAt(rightSeat)} /> : <EmptySlot />}
            </View>
          </View>
        </View>
      </View>

      {/* Player avatars */}
      <Avatar
        name={p(topSeat).name} score={p(topSeat).totalScore}
        handCount={players?.[topSeat]?.handCount}
        isAdvantage={advantageSeat === topSeat}
        isCurrent={currentSeatToPlay === topSeat}
        position="top"
      />
      <Avatar
        name={p(leftSeat).name} score={p(leftSeat).totalScore}
        handCount={players?.[leftSeat]?.handCount}
        isAdvantage={advantageSeat === leftSeat}
        isCurrent={currentSeatToPlay === leftSeat}
        position="left"
      />
      <Avatar
        name={p(rightSeat).name} score={p(rightSeat).totalScore}
        handCount={players?.[rightSeat]?.handCount}
        isAdvantage={advantageSeat === rightSeat}
        isCurrent={currentSeatToPlay === rightSeat}
        position="right"
      />
    </View>
  );
}

function TrickCard({ card }) {
  const SYM = { spade:"♠", diamond:"♦", club:"♣", heart:"♥" };
  const red = card.suit==="diamond" || card.suit==="heart";
  return (
    <View style={styles.trickCard}>
      <Text style={[styles.trickCardText, red && styles.trickRed]}>
        {card.rank}{SYM[card.suit]}
      </Text>
    </View>
  );
}
function EmptySlot() {
  return <View style={[styles.trickCard, styles.trickCardEmpty]} />;
}

const TABLE_W = 300;
const TABLE_H = 180;

const styles = StyleSheet.create({
  tableWrap: { width: TABLE_W + 80, height: TABLE_H + 120, alignSelf:"center", alignItems:"center", justifyContent:"center" },
  felt: {
    width: TABLE_W, height: TABLE_H,
    borderRadius: TABLE_H,        // full oval
    backgroundColor: C.table,
    borderWidth: 8, borderColor: C.tableEdge,
    ...S.shadow,
    justifyContent:"center", alignItems:"center",
  },
  trickGrid: { alignItems:"center", gap: 4 },
  trickRow: { flexDirection:"row", justifyContent:"center" },
  trickMiddleRow: { flexDirection:"row", gap:4 },
  trickSlot: { width:48, height:36 },
  trickCard: {
    flex:1, borderRadius:R.xs, backgroundColor:C.cardFront,
    justifyContent:"center", alignItems:"center",
    borderWidth:1, borderColor:C.cardBorder, ...S.shadow,
  },
  trickCardEmpty: { backgroundColor:"rgba(255,255,255,0.06)", borderColor:"rgba(255,255,255,0.12)" },
  trickCardText: { fontSize:11, fontWeight:"700", color:"#111" },
  trickRed: { color:"#c0392b" },
  // Player spot positions
  avatar: { position:"absolute", alignItems:"center" },
  posTop:   { top:0, alignSelf:"center" },
  posLeft:  { left:0, top:"35%" },
  posRight: { right:0, top:"35%" },
  avatarActive: {},
  avatarCircle: {
    width:44, height:44, borderRadius:22,
    backgroundColor:C.btnGreen, borderWidth:2, borderColor:C.border,
    justifyContent:"center", alignItems:"center",
  },
  avatarCircleActive: { borderColor:C.gold, borderWidth:3 },
  avatarLetter: { color:C.white, fontWeight:"800", fontSize:F.lg },
  avatarName: { color:C.white, fontSize:F.xs, fontWeight:"600", marginTop:2, maxWidth:60 },
  avatarScore: { color:C.textSec, fontSize:F.xs },
  crown: { fontSize:14, color:C.gold, fontWeight:"800", marginBottom:2 },
  handPips: { flexDirection:"row", position:"absolute" },
  handBelow: { top:72, left:0 },
  handRight: { left:54, top:4 },
  handLeft:  { right:54, top:4 },
});
