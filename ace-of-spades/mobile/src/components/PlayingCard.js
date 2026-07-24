import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { C, R, S } from "../theme";

const SYM  = { spade:"♠", diamond:"♦", club:"♣", heart:"♥" };
const RED  = new Set(["diamond","heart"]);

export function PlayingCard({ card, onPress, legal=true, selected, small, style }) {
  const red = RED.has(card.suit);
  const size = small ? styles.cardSm : styles.cardMd;
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.card, size, selected && styles.selected,
              !legal && styles.dimmed, style]}
    >
      <Text style={[styles.corner, red ? styles.red : styles.black]}>
        {card.rank}{"\n"}{SYM[card.suit]}
      </Text>
      <Text style={[styles.center, red ? styles.red : styles.black]}>
        {SYM[card.suit]}
      </Text>
      <Text style={[styles.cornerBR, red ? styles.red : styles.black]}>
        {SYM[card.suit]}{"\n"}{card.rank}
      </Text>
    </TouchableOpacity>
  );
}

export function CardBack({ small, style }) {
  const size = small ? styles.cardSm : styles.cardMd;
  return (
    <View style={[styles.card, size, styles.back, style]}>
      <View style={styles.backInner} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.cardFront, borderRadius: R.sm,
    borderWidth: 1, borderColor: C.cardBorder,
    justifyContent: "center", alignItems: "center",
    ...S.shadow,
  },
  cardMd: { width: 58, height: 82 },
  cardSm: { width: 44, height: 62 },
  selected: {
    borderColor: C.gold, borderWidth: 2.5,
    transform: [{ translateY: -10 }],
  },
  dimmed: { opacity: 0.38 },
  corner: { position:"absolute", top:4, left:5, fontSize:10, fontWeight:"700", lineHeight:13, textAlign:"center" },
  cornerBR: { position:"absolute", bottom:4, right:5, fontSize:10, fontWeight:"700", lineHeight:13, textAlign:"center", transform:[{rotate:"180deg"}] },
  center: { fontSize: 28, fontWeight: "800" },
  red: { color: "#c0392b" },
  black: { color: "#111" },
  back: { backgroundColor: C.cardBack, borderColor: C.cardBack },
  backInner: {
    width:"72%", height:"82%",
    borderRadius: R.xs, borderWidth:1.5, borderColor:C.gold, opacity:0.4,
  },
});
