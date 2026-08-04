// CreateJoinScreen — Create mode lets the room creator pick a table color
// (green / red / blue), shared by all 4 players once the round starts.
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { C, F, R, TABLE_COLORS } from "../theme";
import { connectAndWait, createRoom, joinRoom } from "../services/socket";

function ColorSwatch({ colorKey, selected, onPress }) {
  const palette = TABLE_COLORS[colorKey];
  return (
    <TouchableOpacity onPress={onPress} style={s.swatchWrap} activeOpacity={0.8}>
      <View style={[s.swatch, { backgroundColor: palette.felt }, selected && s.swatchSelected]}>
        {selected && <Text style={s.swatchCheck}>✓</Text>}
      </View>
      <Text style={[s.swatchLabel, selected && s.swatchLabelSelected]}>{palette.label}</Text>
    </TouchableOpacity>
  );
}

export default function CreateJoinScreen({ mode = "create", onBack, onJoined }) {
  const [name,    setName]    = useState("");
  const [code,    setCode]    = useState("");
  const [color,   setColor]   = useState("green");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const isCreate = mode === "create";

  async function handle() {
    const trimName = name.trim();
    if (!trimName) return setError("Enter your name first");
    if (!isCreate && code.trim().length < 4) return setError("Enter the 4-character room code");

    setLoading(true); setError(null);
    try {
      await connectAndWait();
      let roomCode;
      if (isCreate) {
        const res = await createRoom(color);
        if (!res?.roomCode) throw new Error("Failed to create room");
        roomCode = res.roomCode;
      } else {
        roomCode = code.trim().toUpperCase();
      }
      const join = await joinRoom(roomCode, trimName);
      if (!join?.ok) throw new Error(join?.error || "Failed to join room");
      onJoined({ roomCode, seat: join.seat, myName: trimName });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.bg}>
      <TouchableOpacity onPress={onBack} style={s.backBtn}>
        <Text style={s.backText}>← {isCreate ? "Create Room" : "Join Room"}</Text>
      </TouchableOpacity>

      <Text style={s.label}>Your Name</Text>
      <TextInput
        style={s.input} value={name} onChangeText={setName}
        placeholder="Enter your name" placeholderTextColor={C.textDim}
        autoCapitalize="words" editable={!loading}
      />

      {isCreate ? (
        <>
          <Text style={s.label}>Table Color</Text>
          <View style={s.swatchRow}>
            {Object.keys(TABLE_COLORS).map(key => (
              <ColorSwatch key={key} colorKey={key} selected={color === key} onPress={() => setColor(key)} />
            ))}
          </View>
          <Text style={s.info}>Border is always gold. A 4-character room code will be generated.</Text>
        </>
      ) : (
        <>
          <Text style={s.label}>Room Code</Text>
          <TextInput
            style={[s.input, s.codeInput]} value={code}
            onChangeText={t => setCode(t.toUpperCase().slice(0, 4))}
            placeholder="e.g. AB3K" placeholderTextColor={C.textDim}
            autoCapitalize="characters" maxLength={4} editable={!loading}
          />
        </>
      )}

      {error ? <Text style={s.error}>{error}</Text> : null}

      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handle} disabled={loading}>
        {loading ? <ActivityIndicator color={C.bg} /> : <Text style={s.btnText}>{isCreate ? "CREATE ROOM" : "JOIN ROOM"}</Text>}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  bg:       { flex: 1, backgroundColor: C.bg, padding: 24, paddingTop: 56 },
  backBtn:  { marginBottom: 28 },
  backText: { color: C.gold, fontSize: F.md, fontWeight: "700" },
  label:    { color: C.textSec, fontSize: F.sm, fontWeight: "600", marginBottom: 8 },
  input:    { backgroundColor: C.bgCard, borderRadius: R.md, borderWidth: 1, borderColor: C.border, color: C.white, fontSize: F.md, padding: 16, marginBottom: 20 },
  codeInput:{ fontSize: F.xxl, fontWeight: "800", letterSpacing: 12, textAlign: "center" },
  info:     { color: C.textDim, fontSize: F.sm, marginBottom: 8, textAlign: "center" },
  error:    { color: C.negative, textAlign: "center", marginBottom: 16, fontSize: F.sm },
  btn:      { backgroundColor: C.gold, borderRadius: R.lg, paddingVertical: 18, alignItems: "center", marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText:  { color: C.bg, fontWeight: "900", fontSize: F.md, letterSpacing: 2 },

  swatchRow:{ flexDirection: "row", justifyContent: "center", gap: 20, marginBottom: 16 },
  swatchWrap: { alignItems: "center", gap: 6 },
  swatch:   { width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: C.border, justifyContent:"center", alignItems:"center" },
  swatchSelected: { borderColor: C.gold, borderWidth: 4 },
  swatchCheck: { color: C.gold, fontSize: 22, fontWeight: "900" },
  swatchLabel: { color: C.textDim, fontSize: F.xs, fontWeight: "600" },
  swatchLabelSelected: { color: C.gold },
});
