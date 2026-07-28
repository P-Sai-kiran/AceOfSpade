import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { C, F, R } from "../theme";
import { placeBid } from "../services/socket";
import { useGame } from "../context/GameContext";

function minBidFor(round) {
  if (round <= 4) return 0; if (round <= 8) return 1;
  if (round <= 11) return 2; return 3;
}

export default function BiddingScreen() {
  const { state } = useGame();
  const { round=1, yourSeat, players=[], bids={},
          hasSubmittedBid, bidsSubmittedCount=0,
          trickPlayOrder=[], advantageSeat } = state || {};

  const min = minBidFor(round);
  const max = round;
  const [val,     setVal]     = useState(min);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function submit() {
    setLoading(true); setError(null);
    try {
      const res = await placeBid(val);
      if (res?.ok === false) setError(res.error || "Could not submit bid");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const advName = players[advantageSeat]?.name || "";

  return (
    <View style={s.bg}>
      <Text style={s.round}>ROUND {round}</Text>
      <Text style={s.sub}>{round} Cards · {round} Tricks</Text>

      {/* Advantage notice */}
      <View style={s.advRow}>
        <Text style={s.advText}>♠ {advName} bids & plays last this round</Text>
      </View>

      {/* Bid picker */}
      <View style={s.pickerCard}>
        <Text style={s.pickerLabel}>Your Bid</Text>
        <View style={s.picker}>
          <TouchableOpacity
            style={[s.arrowBtn, val <= min && s.arrowDisabled]}
            onPress={() => setVal(v => Math.max(min, v - 1))}
            disabled={val <= min || hasSubmittedBid}
          >
            <Text style={s.arrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={s.bidNum}>{val}</Text>
          <TouchableOpacity
            style={[s.arrowBtn, val >= max && s.arrowDisabled]}
            onPress={() => setVal(v => Math.min(max, v + 1))}
            disabled={val >= max || hasSubmittedBid}
          >
            <Text style={s.arrowText}>›</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.range}>Min {min} · Max {round}</Text>
      </View>

      {/* Submit or waiting state */}
      {!hasSubmittedBid ? (
        <>
          {error ? <Text style={s.error}>{error}</Text> : null}
          <TouchableOpacity style={[s.btn, loading && s.btnOff]} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color={C.bg} /> : <Text style={s.btnText}>LOCK IN BID</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <View style={s.locked}>
          <Text style={s.lockedTitle}>Bid locked: {bids[yourSeat]}</Text>
          <Text style={s.lockedSub}>Waiting for {4 - bidsSubmittedCount} more player{4 - bidsSubmittedCount !== 1 ? "s" : ""}…</Text>
          <ActivityIndicator color={C.gold} style={{ marginTop: 12 }} />
        </View>
      )}

      {/* Bidding order */}
      <View style={s.orderBox}>
        <Text style={s.orderTitle}>BIDDING ORDER</Text>
        <View style={s.orderRow}>
          {trickPlayOrder.map((seat, idx) => {
            const p   = players[seat];
            const isMe = seat === yourSeat;
            const isAdv = seat === advantageSeat;
            const done = !!state?.bidsSubmitted?.[seat];
            return (
              <React.Fragment key={seat}>
                <View style={[s.chip, isMe && s.chipMe, done && s.chipDone]}>
                  <Text style={[s.chipText, isMe && s.chipTextMe]}>
                    {isMe ? "You" : (p?.name?.split("_")[0] || `P${seat+1}`)}
                    {isAdv ? " ♠" : ""}
                  </Text>
                  {done && <Text style={s.checkmark}>✓</Text>}
                </View>
                {idx < 3 && <Text style={s.arrow}>→</Text>}
              </React.Fragment>
            );
          })}
        </View>
        <Text style={s.orderNote}>Anti-clockwise · Advantage player bids last</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bg:      { flex: 1, backgroundColor: C.bg, padding: 24, paddingTop: 52 },
  round:   { fontSize: F.xxl, fontWeight: "900", color: C.gold, textAlign: "center" },
  sub:     { color: C.textSec, textAlign: "center", fontSize: F.md, marginBottom: 12 },
  advRow:  { backgroundColor: C.goldBg, borderRadius: R.md, padding: 10, marginBottom: 20, borderWidth: 1, borderColor: C.gold },
  advText: { color: C.gold, fontSize: F.sm, fontWeight: "700", textAlign: "center" },
  pickerCard: {
    backgroundColor: C.bgCard, borderRadius: R.xl,
    padding: 24, alignItems: "center", marginBottom: 20,
    borderWidth: 1, borderColor: C.border,
  },
  pickerLabel: { color: C.textSec, fontSize: F.sm, marginBottom: 12 },
  picker:  { flexDirection: "row", alignItems: "center", gap: 28 },
  arrowBtn:{ padding: 12 },
  arrowDisabled: { opacity: 0.3 },
  arrowText: { fontSize: 48, color: C.gold, lineHeight: 52 },
  bidNum:  { fontSize: 80, fontWeight: "900", color: C.white, minWidth: 90, textAlign: "center" },
  range:   { color: C.textDim, fontSize: F.sm, marginTop: 8 },
  error:   { color: C.negative, textAlign: "center", marginBottom: 12 },
  btn:     { backgroundColor: C.gold, borderRadius: R.lg, paddingVertical: 18, alignItems: "center", marginBottom: 20 },
  btnOff:  { opacity: 0.6 },
  btnText: { color: C.bg, fontWeight: "900", fontSize: F.md, letterSpacing: 2 },
  locked:  { alignItems: "center", marginBottom: 20, backgroundColor: C.bgCard, borderRadius: R.lg, padding: 20, borderWidth: 1, borderColor: C.border },
  lockedTitle: { color: C.gold, fontSize: F.xl, fontWeight: "800" },
  lockedSub:   { color: C.textSec, fontSize: F.sm, marginTop: 6 },
  orderBox:{ backgroundColor: C.bgCard, borderRadius: R.xl, padding: 16, borderWidth: 1, borderColor: C.border },
  orderTitle: { color: C.textDim, fontSize: F.xs, fontWeight: "700", letterSpacing: 2, textAlign: "center", marginBottom: 12 },
  orderRow:{ flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap" },
  chip:    { paddingHorizontal: 10, paddingVertical: 6, borderRadius: R.full, backgroundColor: C.border, alignItems: "center" },
  chipMe:  { backgroundColor: C.goldBg, borderWidth: 1, borderColor: C.gold },
  chipDone:{ opacity: 0.5 },
  chipText:{ color: C.textSec, fontSize: F.xs, fontWeight: "700" },
  chipTextMe: { color: C.gold },
  checkmark:  { color: C.positive, fontSize: 10 },
  arrow:   { color: C.textDim, fontSize: 14, marginHorizontal: 4 },
  orderNote:  { color: C.textDim, fontSize: F.xs, textAlign: "center", marginTop: 10 },
});
