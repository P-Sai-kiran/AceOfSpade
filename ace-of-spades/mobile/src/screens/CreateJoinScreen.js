import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { C, F, R } from "../theme";
import { socket, createRoom as apiCreate, joinRoom as apiJoin } from "../services/socket";

export default function CreateJoinScreen({ mode="create", onBack, onJoined }) {
  const [name, setName]         = useState("");
  const [code, setCode]         = useState("");
  const [roomName, setRoomName] = useState("My Room");
  const [priv, setPriv]         = useState(false);
  const [error, setError]       = useState(null);

  const isCreate = mode === "create";

  async function handle() {
    if (!name.trim()) return setError("Enter your name");
    if (!socket.connected) socket.connect();
    if (isCreate) {
      const res = await apiCreate();
      const join = await apiJoin(res.roomCode, name.trim());
      if (!join.ok) return setError(join.error);
      onJoined({ roomCode: res.roomCode, seat: join.seat, myName: name.trim() });
    } else {
      if (!code.trim()) return setError("Enter room code");
      const join = await apiJoin(code.trim().toUpperCase(), name.trim());
      if (!join.ok) return setError(join.error);
      onJoined({ roomCode: code.trim().toUpperCase(), seat: join.seat, myName: name.trim() });
    }
  }

  return (
    <View style={s.bg}>
      <TouchableOpacity onPress={onBack} style={s.back}>
        <Text style={s.backText}>← {isCreate ? "Create Room" : "Join Room"}</Text>
      </TouchableOpacity>

      <View style={s.form}>
        <Text style={s.label}>Your Name</Text>
        <TextInput
          style={s.input} value={name} onChangeText={setName}
          placeholder="Player_01" placeholderTextColor={C.textDim}
          autoCapitalize="words"
        />

        {isCreate ? (
          <>
            <Text style={s.label}>Room Name</Text>
            <TextInput
              style={s.input} value={roomName} onChangeText={setRoomName}
              placeholder="My Room" placeholderTextColor={C.textDim}
            />
            <View style={s.row}>
              <Text style={s.label}>Max Players</Text>
              <Text style={s.value}>4 Players</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Private Room</Text>
              <TouchableOpacity onPress={() => setPriv(!priv)} style={[s.toggle, priv && s.toggleOn]}>
                <Text style={s.toggleLabel}>{priv ? "ON" : "OFF"}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={s.label}>Enter Room Code</Text>
            <View style={s.codeRow}>
              {["A","B","C","D"].map((_, i) => (
                <View key={i} style={s.codeBox}>
                  <Text style={s.codeLetter}>{code[i] || "_"}</Text>
                </View>
              ))}
            </View>
            <TextInput
              style={s.hiddenInput} value={code}
              onChangeText={t => setCode(t.toUpperCase().slice(0,4))}
              autoCapitalize="characters" maxLength={4}
              placeholder="ABCD" placeholderTextColor={C.textDim}
            />
          </>
        )}

        {error && <Text style={s.error}>{error}</Text>}

        <TouchableOpacity style={s.createBtn} onPress={handle}>
          <Text style={s.createBtnText}>{isCreate ? "CREATE" : "JOIN"}</Text>
        </TouchableOpacity>

        {!isCreate && (
          <TouchableOpacity style={s.qrBtn}>
            <Text style={s.qrText}>📷  Scan QR Code</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bg:    { flex:1, backgroundColor:C.bg, padding:20, paddingTop:52 },
  back:  { marginBottom:24 },
  backText: { color:C.gold, fontSize:F.md, fontWeight:"700" },
  form:  { gap:14 },
  label: { color:C.textSec, fontSize:F.sm, fontWeight:"600", marginBottom:-8 },
  value: { color:C.white, fontSize:F.md, fontWeight:"600" },
  row:   { flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  input: {
    backgroundColor:C.bgCard, borderRadius:R.md,
    borderWidth:1, borderColor:C.border,
    color:C.white, fontSize:F.md, padding:14,
  },
  codeRow: { flexDirection:"row", gap:10, justifyContent:"center", marginVertical:8 },
  codeBox: {
    width:56, height:64, backgroundColor:C.bgCard,
    borderRadius:R.md, borderWidth:1, borderColor:C.gold,
    justifyContent:"center", alignItems:"center",
  },
  codeLetter: { color:C.gold, fontSize:F.xl, fontWeight:"800" },
  hiddenInput: { position:"absolute", opacity:0 },
  toggle: {
    paddingHorizontal:16, paddingVertical:8,
    backgroundColor:C.border, borderRadius:R.full,
  },
  toggleOn: { backgroundColor:C.gold },
  toggleLabel: { color:C.white, fontWeight:"700" },
  error: { color:C.negative, textAlign:"center" },
  createBtn: {
    backgroundColor:C.gold, borderRadius:R.lg,
    paddingVertical:16, alignItems:"center", marginTop:8,
  },
  createBtnText: { color:C.bg, fontWeight:"900", fontSize:F.md, letterSpacing:2 },
  qrBtn: {
    backgroundColor:C.btnGreen, borderRadius:R.lg,
    paddingVertical:14, alignItems:"center",
  },
  qrText: { color:C.textSec, fontSize:F.md },
});
