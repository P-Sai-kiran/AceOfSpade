import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import PlayingCard from "./PlayingCard";

// hand: array of cards. legalCardIds: which ones are currently playable.
// onPlay(cardId) called when a legal card is tapped.
export default function PlayerHand({ hand, legalCardIds, onPlay, canPlay }) {
  return (
    <ScrollView horizontal contentContainerStyle={styles.row} showsHorizontalScrollIndicator={false}>
      {hand.map((card) => {
        const isLegal = !legalCardIds || legalCardIds.includes(card.id);
        return (
          <PlayingCard
            key={card.id}
            card={card}
            disabled={!canPlay || !isLegal}
            onPress={canPlay && isLegal ? () => onPlay(card.id) : undefined}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 12, paddingHorizontal: 8, alignItems: "flex-end" },
});
