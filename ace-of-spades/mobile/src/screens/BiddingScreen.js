// BiddingScreen — sequential, visible bidding. Players bid in turn order;
// each locked bid is instantly shown to everyone. Shows YOUR hand so you can
// actually judge how many tricks you can realistically win before bidding.
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { C, F, R } from "../theme";
import { placeBid } from "../services/socket";
import { useGame } from "../context/GameContext";

const SUIT = { spade:"♠", diamond:"♦", club:"♣", heart:"♥" };
const RED  = new Set(["diamond","heart"]);

function MiniCard({ card }) {
  const red = RED.has(card.suit);
  return (
    <View style={mc.card}>
      <Text style={[mc.text, red && mc.red]}>{card.rank}</Text>
      <Text style={[mc.suit, red && mc.red]}>{SUIT[card.suit]}</Text>
    </View>
  );
}

function minBidFor(round) {
  if (round <= 4) return 0; if (round <= 8) return 1;
  if (round <= 11) return 2; return 3;
}

export default function BiddingScreen() {
  const { state } = useGame();
  const { round=1, yourSeat, yourHand=[], players=[], bids={}, currentBidder, trickPlayOrder=[], advantageSeat } = state || {};

  const min = minBidFor(round);
  const max = round;
  const myTurn = currentBidder === yourSeat;

  const [val,     setVal]     = useState(min);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => { if (myTurn) setVal(min); }, [myTurn, round]);

  async function submit() {
    setLoading(true); setError(null);
    try {
      const res = await placeBid(val);
      if (res?.ok === false) setError(res.error || "Could not submit bid");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const advName = players[advantageSeat]?.name || "";
  const currentBidderName = players[currentBidder]?.name || "";

  return (
    <ScrollView contentContainerStyle={s.bg}>
      <Text style={s.round}>ROUND {round}</Text>
      <Text style={s.sub}>{round} Cards · {round} Tricks</Text>

      <View style={s.advRow}><Text style={s.advText}>♠ {advName} bids & plays last this round</Text></View>

      {/* Your hand — so you can actually judge your bid */}
      <View style={s.handBox}>
        <Text style={s.handLabel}>YOUR HAND</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.handRow}>
          {yourHand.map(card => <MiniCard key={card.id} card={card} />)}
        </ScrollView>
      </View>

      <View style={s.orderBox}>
        <Text style={s.orderTitle}>BIDDING ORDER</Text>
        <View style={s.orderRow}>
          {trickPlayOrder.map((seat, idx) => {
            const p = players[seat];
            const isMe = seat === yourSeat;
            const isAdv = seat === advantageSeat;
            const isTurn = seat === currentBidder;
            const hasBid = bids[seat] != null;
            return (
              <React.Fragment key={seat}>
                <View style={[s.chip, isMe && s.chipMe, isTurn && s.chipTurn]}>
                  <Text style={[s.chipName, isMe && s.chipNameMe, isTurn && s.chipNameTurn]}>
                    {isMe ? "You" : (p?.name?.split("_")[0] || `P${seat+1}`)}{isAdv ? " ♠" : ""}
                  </Text>
                  <Text style={[s.chipBid, hasBid && s.chipBidLocked]}>{hasBid ? bids[seat] : isTurn ? "…" : "—"}</Text>
                </View>
                {idx < 3 && <Text style={s.arrow}>→</Text>}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {myTurn ? (
        <>
          <View style={s.pickerCard}>
            <Text style={s.pickerLabel}>Your Bid</Text>
            <View style={s.picker}>
              <TouchableOpacity style={[s.arrowBtn, val <= min && s.arrowDisabled]} onPress={() => setVal(v => Math.max(min, v - 1))} disabled={val <= min}>
                <Text style={s.arrowText}>‹</Text>
              </TouchableOpacity>
              <Text style={s.bidNum}>{val}</Text>
              <TouchableOpacity style={[s.arrowBtn, val >= max && s.arrowDisabled]} onPress={() => setVal(v => Math.min(max, v + 1))} disabled={val >= max}>
                <Text style={s.arrowText}>›</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.range}>Min {min} · Max {round}</Text>
          </View>
          {error ? <Text style={s.error}>{error}</Text> : null}
          <TouchableOpacity style={[s.btn, loading && s.btnOff]} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color={C.bg} /> : <Text style={s.btnText}>LOCK IN BID</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <View style={s.waiting}>
          <ActivityIndicator color={C.gold} style={{ marginBottom: 12 }} />
          <Text style={s.waitingTitle}>Waiting for {currentBidderName}…</Text>
          <Text style={s.waitingSub}>They're deciding their bid</Text>
        </View>
      )}
    </ScrollView>
  );
}

const mc = StyleSheet.create({
  card: { width:46, height:64, borderRadius:6, backgroundColor:"#f8f7f2", borderWidth:1, borderColor:"#d0cdc8", justifyContent:"center", alignItems:"center", marginRight:6 },
  text: { fontSize:14, fontWeight:"800", color:"#111" },
  suit: { fontSize:16, color:"#111" },
  red:  { color:"#c0392b" },
});

const s = StyleSheet.create({
  bg:      { flexGrow: 1, backgroundColor: C.bg, padding: 24, paddingTop: 52 },
  round:   { fontSize: F.xxl, fontWeight: "900", color: C.gold, textAlign: "center" },
  sub:     { color: C.textSec, textAlign: "center", fontSize: F.md, marginBottom: 12 },
  advRow:  { backgroundColor: C.goldBg, borderRadius: R.md, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: C.gold },
  advText: { color: C.gold, fontSize: F.sm, fontWeight: "700", textAlign: "center" },
  handBox: { backgroundColor: C.bgCard, borderRadius: R.lg, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  handLabel: { color: C.textDim, fontSize: F.xs, fontWeight: "700", letterSpacing: 2, marginBottom: 10 },
  handRow: { paddingRight: 8 },
  orderBox:{ backgroundColor: C.bgCard, borderRadius: R.xl, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 24 },
  orderTitle: { color: C.textDim, fontSize: F.xs, fontWeight: "700", letterSpacing: 2, textAlign: "center", marginBottom: 14 },
  orderRow:{ flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap" },
  chip:    { paddingHorizontal: 10, paddingVertical: 8, borderRadius: R.md, backgroundColor: C.border, alignItems: "center", minWidth: 58 },
  chipMe:  { borderWidth: 1, borderColor: C.gold },
  chipTurn:{ backgroundColor: C.goldBg, borderWidth: 2, borderColor: C.gold },
  chipName:{ color: C.textSec, fontSize: F.xs, fontWeight: "700" },
  chipNameMe: { color: C.white },
  chipNameTurn: { color: C.gold },
  chipBid: { color: C.textDim, fontSize: F.lg, fontWeight: "900", marginTop: 4 },
  chipBidLocked: { color: C.white },
  arrow:   { color: C.textDim, fontSize: 14, marginHorizontal: 4 },
  pickerCard: { backgroundColor: C.bgCard, borderRadius: R.xl, padding: 24, alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: C.border },
  pickerLabel: { color: C.textSec, fontSize: F.sm, marginBottom: 12 },
  picker:  { flexDirection: "row", alignItems: "center", gap: 28 },
  arrowBtn:{ padding: 12 },
  arrowDisabled: { opacity: 0.3 },
  arrowText: { fontSize: 48, color: C.gold, lineHeight: 52 },
  bidNum:  { fontSize: 80, fontWeight: "900", color: C.white, minWidth: 90, textAlign: "center" },
  range:   { color: C.textDim, fontSize: F.sm, marginTop: 8 },
  error:   { color: C.negative, textAlign: "center", marginBottom: 12 },
  btn:     { backgroundColor: C.gold, borderRadius: R.lg, paddingVertical: 18, alignItems: "center", marginBottom: 24 },
  btnOff:  { opacity: 0.6 },
  btnText: { color: C.bg, fontWeight: "900", fontSize: F.md, letterSpacing: 2 },
  waiting: { alignItems: "center", backgroundColor: C.bgCard, borderRadius: R.xl, padding: 32, borderWidth: 1, borderColor: C.border, marginBottom: 24 },
  waitingTitle: { color: C.white, fontSize: F.lg, fontWeight: "700" },
  waitingSub:   { color: C.textDim, fontSize: F.sm, marginTop: 6 },
});