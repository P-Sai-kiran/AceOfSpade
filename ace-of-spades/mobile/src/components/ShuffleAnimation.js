// Deal animation. onDone fires from a plain setTimeout in the parent —
// NEVER from inside a Reanimated worklet callback (that crashed the app
// after round 1 in earlier builds — calling JS directly from the UI thread
// without runOnJS is unsafe in production/Hermes).
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withDelay, Easing } from "react-native-reanimated";

const CARD_COUNT = 8;
const TOTAL_DURATION_MS = 900;

function ShuffleCard({ index }) {
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
      withTiming(0, { duration: 260 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: `${rotate.value}deg` }],
  }));

  return <Animated.View style={[styles.card, style, { zIndex: CARD_COUNT - index }]} />;
}

export default function ShuffleAnimation({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => { onDone && onDone(); }, TOTAL_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      {Array.from({ length: CARD_COUNT }).map((_, i) => <ShuffleCard key={i} index={i} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1f12", justifyContent: "center", alignItems: "center" },
  card: { position: "absolute", width: 60, height: 84, borderRadius: 8, backgroundColor: "#1b4d3e", borderWidth: 2, borderColor: "#f2c14e" },
});
