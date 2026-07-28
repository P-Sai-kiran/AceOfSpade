import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { C } from "../theme";

const TOTAL = 20; // seconds per turn

export default function TurnTimer({ active, onExpire }) {
  const [sec, setSec] = useState(TOTAL);
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) { setSec(TOTAL); anim.setValue(1); return; }
    setSec(TOTAL);
    Animated.timing(anim, { toValue: 0, duration: TOTAL * 1000, useNativeDriver: false }).start();
    const interval = setInterval(() => {
      setSec(s => {
        if (s <= 1) { clearInterval(interval); onExpire?.(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active]);

  const urgent = sec <= 5;
  const color  = urgent ? C.negative : C.gold;

  return (
    <View style={styles.wrap}>
      <View style={[styles.ring, { borderColor: color }]}>
        <Text style={[styles.num, { color }]}>{sec}</Text>
        <Text style={[styles.label, { color }]}>s</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems:"center", justifyContent:"center" },
  ring: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 3, alignItems:"center", justifyContent:"center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  num:  { fontSize:18, fontWeight:"800", lineHeight:20 },
  label:{ fontSize:10, fontWeight:"600", marginTop:-2 },
});
