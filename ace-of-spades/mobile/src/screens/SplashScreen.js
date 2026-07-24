import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { C, F } from "../theme";

export default function SplashScreen({ onDone }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue:1, friction:5, useNativeDriver:true }),
      Animated.timing(opacity, { toValue:1, duration:600, useNativeDriver:true }),
    ]).start();
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={s.bg}>
      <Animated.View style={[s.card, { opacity, transform:[{scale}] }]}>
        <Text style={s.spade}>♠</Text>
        <Text style={s.title}>ACE{"\n"}OF{"\n"}SPADES</Text>
      </Animated.View>
      <Text style={s.loading}>LOADING…</Text>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex:1, backgroundColor:C.bg, justifyContent:"center", alignItems:"center" },
  card: { alignItems:"center", marginBottom:40 },
  spade: { fontSize:100, color:C.gold, lineHeight:110 },
  title: { fontSize:F.xxl, fontWeight:"900", color:C.white, textAlign:"center", letterSpacing:4, lineHeight:F.xxl+6 },
  loading: { position:"absolute", bottom:60, color:C.textDim, fontSize:F.sm, letterSpacing:3 },
});
