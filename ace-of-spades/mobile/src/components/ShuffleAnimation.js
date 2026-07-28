import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

// A lightweight "riffle shuffle" illusion: a handful of card-back rectangles
// fan out, cross over each other, then snap back into a single stacked deck.
// Call onDone() when finished so the caller can transition to dealing.
const CARD_COUNT = 8;

function ShuffleCard({ index, onDone }) {
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const direction = index % 2 === 0 ? 1 : -1;
    const spread = 40 + index * 4;

    translateX.value = withSequence(
      withDelay(index * 30, withTiming(direction * spread, { duration: 260, easing: Easing.out(Easing.quad) })),
      withTiming(0, { duration: 260, easing: Easing.in(Easing.quad) })
    );
    rotate.value = withSequence(
      withDelay(index * 30, withTiming(direction * 12, { duration: 260 })),
      withTiming(0, { duration: 260 }, (finished) => {
        if (finished && index === CARD_COUNT - 1 && onDone) {
          runOnJSDone(onDone);
        }
      })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: `${rotate.value}deg` }],
  }));

  return <Animated.View style={[styles.card, style, { zIndex: CARD_COUNT - index }]} />;
}

// Reanimated callbacks run on the UI thread; hop back to JS for the onDone callback.
function runOnJSDone(fn) {
  setTimeout(fn, 0);
}

export default function ShuffleAnimation({ onDone }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <ShuffleCard key={i} index={i} onDone={i === CARD_COUNT - 1 ? onDone : undefined} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    position: "absolute",
    width: 60,
    height: 84,
    borderRadius: 8,
    backgroundColor: "#1b4d3e",
    borderWidth: 2,
    borderColor: "#f2c14e",
  },
});
