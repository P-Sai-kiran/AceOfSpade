import React from "react";
import { View, Text, StyleSheet } from "react-native";
import PlayingCard from "./PlayingCard";

const SEAT_POSITIONS = {
  0: styles => styles.bottom,
  1: styles => styles.left,
  2: styles => styles.top,
  3: styles => styles.right,
};

export default function TrickArea({ plays, mySeat }) {
  return (
    <View style={styles.table}>
      {plays.map(({ seat, card }) => {
        // Rotate so "my" seat always renders at the bottom, for readability.
        const relativeSeat = (seat - mySeat + 4) % 4;
        const posStyle = SEAT_POSITIONS[relativeSeat](styles);
        return (
          <View key={card.id} style={[styles.slot, posStyle]}>
            <PlayingCard card={card} small />
          </View>
        );
      })}
      {plays.length === 0 && <Text style={styles.waiting}>Waiting for lead card…</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    width: 220,
    height: 220,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  slot: { position: "absolute" },
  bottom: { bottom: 0 },
  top: { top: 0 },
  left: { left: 0 },
  right: { right: 0 },
  waiting: { color: "#ccc" },
});
