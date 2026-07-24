// BiddingScreen — Private bid entry, matching wireframe screen 4
// All players submit independently (simultaneous hidden bidding, Rule 13)
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { C, F, R } from "../theme";
import { placeBid } from "../services/socket";
import { useGame } from "../context/GameContext";

function minBidFor(round) {
  if (round <= 4) return 0; if (round <= 8) return 1;
  if (round <= 11) return 2; return 3;
}

export default function BiddingScreen() {
  const { state } = useGame();
  const [val, setVal] = useState(null);
  const [err, setErr] = useState(null);

  const { round, yourSeat, players=[], bids={}, hasSubmittedBid,
          bidsSubmittedCount=0, trickPlayOrder=[], advantageSeat } = state || {};

  const min = minBidFor(round);
  const max = round;

  if (val === null && min >= 0) setVal(min); // initialize

  function dec() { setVal(v => Math.max(min, (v ?? min) - 1)); }
  function inc() { setVal(v => Math.min(max, (v ?? min) + 1)); }

  async function submit() {
    if (val == null) return;
    const res = await placeBid(val);
    if (res?.ok === false) setErr(res.error);
  }

  const advName = players[advantageSeat]?.name || "";

  return (
    <View style={s.bg}>
      {/* Round header */}
      <View style={s.header}>
        <Text style={s.roundLabel}>ROUND {round}</Text>
        <Text style={s.cardsLabel}>{round} Cards – {round} Tricks</Text>
      </View>

      {/* Bid picker */}
      <View style={s.pickerWrap}>
        <Text style={s.pickerTitle}>Enter your bid</Text>
        <View style={s.picker}>
          <TouchableOpacity style={s.arrow} onPress={dec} disabled={val <= min}>
            <Text style={[s.arrowText, val <= min && s.arrowDim]}>‹</Text>
          </TouchableOpacity>
          <Text style={s.bidVal}>{val ?? min}</Text>
          <TouchableOpacity style={s.arrow} onPress={inc} disabled={val >= max}>
            <Text style={[s.arrowText, val >= max && s.arrowDim]}>›</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.range}>Min: {min}  ·  Max: {max}</Text>
      </View>

      {/* Submit */}
      {!hasSubmittedBid ? (
        <>
          {err && <Text style={s.err}>{err}</Text>}
          <TouchableOpacity style={s.submitBtn} onPress={submit}>
            <Text style={s.submitText}>SUBMIT BID</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={s.submitted}>
          <Text style={s.submittedText}>Bid locked: {bids[yourSeat]}</Text>
          <Text style={s.waitText}>Waiting for {4 - bidsSubmittedCount} more…</Text>
        </View>
      )}

      {/* Bidding order (anti-clockwise), advantage player last */}
      <View style={s.orderWrap}>
        <Text style={s.orderLabel}>Bidding order (Anti-Clockwise)</Text>
        <View style={s.orderRow}>
          {trickPlayOrder.map((seat, idx) => {
            const name = players[seat]?.name || "?";
            const isMe = seat === yourSeat;
            const isAdv = seat === advantageSeat;
            return (
              <React.Fragment key={seat}>
                <View style={[s.orderItem, isMe && s.orderItemMe]}>
                  <View style={[s.orderAvatar, isAdv && s.orderAvatarAdv]}>
                    <Text style={s.orderLetter}>{name.charAt(0)}</Text>
                  </View>
                  <Text style={[s.orderName, isMe && s.orderNameMe]}>
                    {isMe ? "You" : name.split("_")[0] || name}
                  </Text>
                </View>
                {idx < 3 && <Text style={s.arrow2}>→</Text>}
              </React.Fragment>
            );
          })}
        </View>
        <Text style={s.advNote}>♠ {advName} bids & plays last this round</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex:1, backgroundColor:C.bg, padding:24, paddingTop:52 },
  header: { alignItems:"center", marginBottom:28 },
  roundLabel: { fontSize:F.xxl, fontWeight:"900", color:C.gold, letterSpacing:2 },
  cardsLabel: { color:C.textSec, fontSize:F.md, marginTop:4 },
  pickerWrap: {
    backgroundColor:C.bgCard, borderRadius:R.xl,
    padding:28, alignItems:"center", marginBottom:24,
    borderWidth:1, borderColor:C.border,
  },
  pickerTitle: { color:C.textSec, fontSize:F.base, marginBottom:16 },
  picker: { flexDirection:"row", alignItems:"center", gap:28, marginBottom:8 },
  arrow: { padding:8 },
  arrowText: { fontSize:44, color:C.gold, lineHeight:48 },
  arrowDim:  { color:C.textDim },
  bidVal:  { fontSize:72, fontWeight:"900", color:C.white, minWidth:80, textAlign:"center" },
  range:   { color:C.textDim, fontSize:F.sm },
  submitBtn: {
    backgroundColor:C.gold, borderRadius:R.lg,
    paddingVertical:18, alignItems:"center", marginBottom:24,
  },
  submitText: { color:C.bg, fontWeight:"900", fontSize:F.md, letterSpacing:2 },
  submitted: { alignItems:"center", marginBottom:24, gap:6 },
  submittedText: { color:C.gold, fontSize:F.lg, fontWeight:"700" },
  waitText:  { color:C.textSec, fontSize:F.sm },
  err:       { color:C.negative, textAlign:"center", marginBottom:8 },
  orderWrap: { backgroundColor:C.bgCard, borderRadius:R.xl, padding:20, borderWidth:1, borderColor:C.border },
  orderLabel:{ color:C.textDim, fontSize:F.xs, textAlign:"center", marginBottom:12, letterSpacing:1 },
  orderRow:  { flexDirection:"row", alignItems:"center", justifyContent:"center" },
  orderItem: { alignItems:"center", gap:4 },
  orderItemMe: {},
  orderAvatar: {
    width:38, height:38, borderRadius:19,
    backgroundColor:C.btnGreen, justifyContent:"center", alignItems:"center",
    borderWidth:1.5, borderColor:C.border,
  },
  orderAvatarAdv: { borderColor:C.gold, borderWidth:2.5 },
  orderLetter: { color:C.white, fontWeight:"800", fontSize:F.md },
  orderName:   { color:C.textSec, fontSize:10 },
  orderNameMe: { color:C.gold, fontWeight:"700" },
  arrow2:  { color:C.textDim, fontSize:16, marginHorizontal:2, marginBottom:16 },
  advNote: { color:C.gold, fontSize:F.xs, textAlign:"center", marginTop:12, fontWeight:"600" },
});
