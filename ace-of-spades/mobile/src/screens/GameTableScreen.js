// GameTableScreen — Main trick-play screen matching wireframe screen 6
// Oval felt table, player positions, turn timer, player hand at bottom
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { C, F, R, S } from "../theme";
import OvalTable from "../components/OvalTable";
import { PlayingCard } from "../components/PlayingCard";
import TurnTimer from "../components/TurnTimer";
import { playCard } from "../services/socket";
import { useGame } from "../context/GameContext";

const SUIT = { spade:"♠", diamond:"♦", club:"♣", heart:"♥" };

export default function GameTableScreen() {
  const { state } = useGame();
  const [selected, setSelected] = useState(null);

  const {
    round, yourSeat, yourHand=[], players=[],
    currentTrick={ plays:[], baseSuit:null },
    currentSeatToPlay, legalCardIds=[],
    tricksWonThisRound={}, bids={},
    trickPlayOrder=[], advantageSeat,
  } = state || {};

  const myTurn = currentSeatToPlay === yourSeat;
  const trickNum = Object.values(tricksWonThisRound).reduce((a,b)=>a+b,0) + 1;

  async function handlePlay(cardId) {
    setSelected(null);
    await playCard(cardId);
  }

  // Add hand count to players for OvalTable (opponent hands are hidden; just show count)
  const playersWithCount = players.map((p, seat) => ({
    ...p,
    handCount: seat === yourSeat ? 0 : round - trickNum + 1,
  }));

  const isLegal = (cardId) => !myTurn ? false : legalCardIds.includes(cardId);
  const baseLabel = currentTrick.baseSuit ? `Lead: ${SUIT[currentTrick.baseSuit]}` : "";

  return (
    <View style={s.bg}>
      {/* Top bar */}
      <View style={s.topBar}>
        <View>
          <Text style={s.roundLabel}>Round {round}</Text>
          <Text style={s.trickLabel}>Trick {trickNum} / {round}  {baseLabel}</Text>
        </View>
        <TurnTimer active={myTurn} />
      </View>

      {/* Oval table */}
      <OvalTable
        players={playersWithCount}
        yourSeat={yourSeat}
        trickCards={currentTrick.plays}
        advantageSeat={advantageSeat}
        currentSeatToPlay={currentSeatToPlay}
        trickPlayOrder={trickPlayOrder}
      />

      {/* YOU section */}
      <View style={s.youWrap}>
        <View style={s.youBar}>
          <View style={[s.youAvatar, myTurn && s.youAvatarActive]}>
            <Text style={s.youLetter}>{players[yourSeat]?.name?.charAt(0) || "Y"}</Text>
          </View>
          <View>
            <Text style={s.youName}>You {advantageSeat === yourSeat ? "♠" : ""}</Text>
            <Text style={s.youScore}>{tricksWonThisRound[yourSeat] ?? 0} / {bids[yourSeat] ?? "?"} tricks</Text>
          </View>
          {myTurn && (
            <View style={s.yourTurnTag}>
              <Text style={s.yourTurnText}>Your Turn{advantageSeat===yourSeat?"\n(You play last)":""}</Text>
            </View>
          )}
        </View>

        {/* Hand */}
        <ScrollView horizontal contentContainerStyle={s.hand} showsHorizontalScrollIndicator={false}>
          {yourHand.map(card => {
            const legal = isLegal(card.id);
            const isSel = selected === card.id;
            return (
              <PlayingCard
                key={card.id}
                card={card}
                legal={!myTurn || legal}
                selected={isSel}
                onPress={myTurn && legal
                  ? () => isSel ? handlePlay(card.id) : setSelected(card.id)
                  : null}
                style={{ marginHorizontal: 3 }}
              />
            );
          })}
        </ScrollView>
        {selected && (
          <Text style={s.tapHint}>Tap again to play  ·  Tap elsewhere to cancel</Text>
        )}
      </View>

      {/* Play order strip at very bottom */}
      <ScrollView horizontal contentContainerStyle={s.orderStrip} showsHorizontalScrollIndicator={false}>
        {trickPlayOrder.map((seat, idx) => {
          const isCurrent = seat === currentSeatToPlay;
          const p = players[seat];
          return (
            <View key={seat} style={[s.orderChip, isCurrent && s.orderChipActive]}>
              <Text style={[s.orderNum, isCurrent && s.orderNumActive]}>{idx+1}</Text>
              <Text style={[s.orderName, isCurrent && s.orderNameActive]} numberOfLines={1}>
                {seat === yourSeat ? "You" : p?.name?.split("_")[0] || `P${seat+1}`}
                {seat === advantageSeat ? " ♠" : ""}
              </Text>
              <Text style={[s.orderTricks, isCurrent && s.orderNameActive]}>
                {tricksWonThisRound[seat]}/{bids[seat]??"-"}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex:1, backgroundColor:C.bg },
  topBar: {
    flexDirection:"row", justifyContent:"space-between", alignItems:"center",
    paddingHorizontal:16, paddingTop:48, paddingBottom:8,
  },
  roundLabel: { color:C.gold, fontSize:F.lg, fontWeight:"900" },
  trickLabel: { color:C.textSec, fontSize:F.sm },
  youWrap: { paddingHorizontal:16 },
  youBar: { flexDirection:"row", alignItems:"center", gap:10, marginBottom:8 },
  youAvatar: {
    width:48, height:48, borderRadius:24,
    backgroundColor:C.btnGreen, justifyContent:"center", alignItems:"center",
    borderWidth:2, borderColor:C.border,
  },
  youAvatarActive: { borderColor:C.gold },
  youLetter: { color:C.white, fontWeight:"800", fontSize:F.lg },
  youName: { color:C.white, fontWeight:"700", fontSize:F.md },
  youScore:{ color:C.textSec, fontSize:F.sm },
  yourTurnTag: {
    marginLeft:"auto", backgroundColor:C.goldBg,
    borderRadius:R.md, padding:8, borderWidth:1, borderColor:C.gold,
  },
  yourTurnText: { color:C.gold, fontWeight:"700", fontSize:F.xs, textAlign:"center" },
  hand: { paddingVertical:8, paddingHorizontal:4, gap:4 },
  tapHint: { color:C.textDim, fontSize:F.xs, textAlign:"center", marginBottom:4 },
  orderStrip: { paddingHorizontal:12, paddingVertical:6, gap:6 },
  orderChip: {
    paddingHorizontal:12, paddingVertical:6, borderRadius:R.full,
    backgroundColor:C.bgCard, borderWidth:1, borderColor:C.border,
    alignItems:"center", minWidth:70,
  },
  orderChipActive: { backgroundColor:C.gold, borderColor:C.gold },
  orderNum:       { color:C.textDim, fontSize:10 },
  orderNumActive: { color:C.bg },
  orderName:      { color:C.white, fontWeight:"700", fontSize:F.xs },
  orderNameActive:{ color:C.bg },
  orderTricks:    { color:C.textDim, fontSize:10 },
});
