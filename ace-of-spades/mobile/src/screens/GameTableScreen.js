// GameTableScreen — main trick-play screen.
// - No timer (removed per request)
// - Broad casino-style oval table, felt color chosen by room creator, gold border always
// - Lead (base) card of the current trick is highlighted with a gold glow
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { C, F, R, TABLE_COLORS } from "../theme";
import { playCard } from "../services/socket";
import { useGame } from "../context/GameContext";

const SUIT = { spade:"♠", diamond:"♦", club:"♣", heart:"♥" };
const RED  = new Set(["diamond","heart"]);

function CardFace({ card, onPress, legal=true, selected }) {
  const red = RED.has(card.suit);
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.75}
      style={[cf.card, selected && cf.selected, !legal && cf.dim]}>
      <Text style={[cf.corner, red ? cf.red : cf.blk]}>{card.rank}{"\n"}{SUIT[card.suit]}</Text>
      <Text style={[cf.center, red ? cf.red : cf.blk]}>{SUIT[card.suit]}</Text>
      <Text style={[cf.cornerBR, red ? cf.red : cf.blk]}>{SUIT[card.suit]}{"\n"}{card.rank}</Text>
    </TouchableOpacity>
  );
}

function CardBack({ style }) {
  return <View style={[cf.card, cf.back, style]}><View style={cf.backInner} /></View>;
}

function OpponentHand({ count=0 }) {
  if (count === 0) return null;
  return (
    <View style={{ flexDirection:"row", justifyContent:"center" }}>
      {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
        <CardBack key={i} style={{ marginHorizontal: -8, transform:[{rotate:`${(i - Math.min(count,5)/2)*5}deg`}] }} />
      ))}
    </View>
  );
}

function PlayerPanel({ player, seat, yourSeat, tricksWon, bid, handCount, isAdvantage, isCurrent, position }) {
  const isMe = seat === yourSeat;
  const name = isMe ? "You" : (player?.name || `P${seat+1}`);
  const posStyle = {
    top:   { alignItems:"center", marginBottom: 4 },
    left:  { alignItems:"flex-end", marginRight: 8, justifyContent:"center" },
    right: { alignItems:"flex-start", marginLeft: 8, justifyContent:"center" },
  }[position];

  return (
    <View style={[pp.wrap, posStyle]}>
      {isAdvantage && <Text style={pp.crown}>♠</Text>}
      <View style={[pp.avatar, isCurrent && pp.avatarActive]}>
        <Text style={pp.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={[pp.name, isCurrent && pp.nameCurrent, isMe && pp.nameMe]}>{name}</Text>
      <Text style={pp.score}>{tricksWon ?? 0}/{bid ?? "?"}</Text>
      {position === "top" && <OpponentHand count={handCount} />}
    </View>
  );
}

// Cards played in the current trick. The lead (base) card — the first one
// played this trick — gets a gold glow border so everyone can spot it fast.
function TrickTable({ plays, yourSeat, tableColors }) {
  const leadSeat = plays?.[0]?.seat;
  const cardFor = (seat) => plays?.find(p => p.seat === seat)?.card;
  const left  = (yourSeat + 1) % 4;
  const top   = (yourSeat + 2) % 4;
  const right = (yourSeat + 3) % 4;

  const TableCard = ({ seat }) => {
    const card = cardFor(seat);
    if (!card) return <View style={tc.empty} />;
    const red = RED.has(card.suit);
    const isLead = seat === leadSeat;
    return (
      <View style={[tc.card, isLead && tc.cardLead]}>
        <Text style={[tc.text, red && tc.red]}>{card.rank}{SUIT[card.suit]}</Text>
        {isLead && <Text style={tc.leadTag}>LEAD</Text>}
      </View>
    );
  };

  return (
    <View style={tc.table}>
      <View style={tc.row}><TableCard seat={top} /></View>
      <View style={tc.midRow}>
        <TableCard seat={left} />
        <View style={[tc.centerDot, { backgroundColor: tableColors.edge }]} />
        <TableCard seat={right} />
      </View>
      <View style={tc.row}><TableCard seat={yourSeat} /></View>
    </View>
  );
}

export default function GameTableScreen() {
  const { state } = useGame();
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const {
    round=1, yourSeat=0, yourHand=[],
    players=[], currentTrick={ plays:[], baseSuit:null },
    currentSeatToPlay, legalCardIds=[],
    tricksWonThisRound={}, bids={},
    trickPlayOrder=[], advantageSeat,
    tableColor="green",
  } = state || {};

  const tableColors = TABLE_COLORS[tableColor] || TABLE_COLORS.green;
  const myTurn   = currentSeatToPlay === yourSeat;
  const trickNum = Object.values(tricksWonThisRound).reduce((a,b)=>a+b,0) + 1;
  const remaining = round - trickNum + 1;

  const left  = (yourSeat + 1) % 4;
  const top   = (yourSeat + 2) % 4;
  const right = (yourSeat + 3) % 4;

  async function handlePlay(cardId) {
    if (!myTurn) return;
    if (selected !== cardId) { setSelected(cardId); return; }
    setSelected(null);
    setLoading(true); setError(null);
    try {
      const res = await playCard(cardId);
      if (res?.ok === false) setError(res.error);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <View style={s.bg}>
      <View style={s.header}>
        <View>
          <Text style={s.roundText}>Round {round}</Text>
          <Text style={s.trickText}>
            Trick {trickNum}/{round}
            {currentTrick.baseSuit ? `  Lead: ${SUIT[currentTrick.baseSuit]}` : ""}
          </Text>
        </View>
      </View>

      <PlayerPanel player={players[top]} seat={top} yourSeat={yourSeat}
        tricksWon={tricksWonThisRound[top]} bid={bids[top]}
        handCount={remaining} isAdvantage={advantageSeat===top}
        isCurrent={currentSeatToPlay===top} position="top" />

      <View style={s.midRow}>
        <PlayerPanel player={players[left]} seat={left} yourSeat={yourSeat}
          tricksWon={tricksWonThisRound[left]} bid={bids[left]}
          handCount={remaining} isAdvantage={advantageSeat===left}
          isCurrent={currentSeatToPlay===left} position="left" />

        <View style={s.tableArea}>
          <View style={[s.felt, { backgroundColor: tableColors.felt, borderColor: C.gold }]}>
            <TrickTable plays={currentTrick.plays} yourSeat={yourSeat} tableColors={tableColors} />
          </View>
        </View>

        <PlayerPanel player={players[right]} seat={right} yourSeat={yourSeat}
          tricksWon={tricksWonThisRound[right]} bid={bids[right]}
          handCount={remaining} isAdvantage={advantageSeat===right}
          isCurrent={currentSeatToPlay===right} position="right" />
      </View>

      <View style={s.youSection}>
        <View style={s.youBar}>
          <View style={[s.youAvatar, myTurn && s.youAvatarActive]}>
            <Text style={s.youLetter}>{players[yourSeat]?.name?.charAt(0)||"Y"}</Text>
          </View>
          <View>
            <Text style={s.youName}>You {advantageSeat===yourSeat ? "♠" : ""}</Text>
            <Text style={s.youScore}>{tricksWonThisRound[yourSeat]??0}/{bids[yourSeat]??"?"} tricks</Text>
          </View>
          {myTurn && <View style={s.turnBadge}><Text style={s.turnBadgeText}>YOUR TURN</Text></View>}
          {!myTurn && currentSeatToPlay != null && (
            <View style={[s.turnBadge, s.waitBadge]}>
              <Text style={s.waitBadgeText}>{players[currentSeatToPlay]?.name || `P${currentSeatToPlay+1}`}'s turn</Text>
            </View>
          )}
        </View>

        {myTurn && selected && <Text style={s.tapHint}>Tap selected card again to play it</Text>}
        {error ? <Text style={s.error}>{error}</Text> : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hand}>
          {yourHand.map(card => {
            const legal = legalCardIds.includes(card.id);
            const isSel = selected === card.id;
            return (
              <CardFace key={card.id} card={card} legal={!myTurn || legal} selected={isSel}
                onPress={myTurn && legal ? () => handlePlay(card.id) : null} />
            );
          })}
          {loading && <ActivityIndicator color={C.gold} style={{ marginLeft: 12 }} />}
        </ScrollView>
      </View>

      <View style={s.orderStrip}>
        {trickPlayOrder.map((seat, idx) => (
          <View key={seat} style={[s.orderChip, seat===currentSeatToPlay && s.orderChipActive]}>
            <Text style={[s.orderNum, seat===currentSeatToPlay && s.orderNumActive]}>{idx+1}</Text>
            <Text style={[s.orderName, seat===currentSeatToPlay && s.orderNameActive]} numberOfLines={1}>
              {seat===yourSeat?"You":(players[seat]?.name?.split("_")[0]||`P${seat+1}`)}{seat===advantageSeat?" ♠":""}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const cf = StyleSheet.create({
  card: { width:60, height:84, borderRadius:8, backgroundColor:"#f8f7f2", borderWidth:1, borderColor:"#d0cdc8", justifyContent:"center", alignItems:"center", elevation:3 },
  selected: { borderColor:C.gold, borderWidth:3, transform:[{translateY:-12}] },
  dim:      { opacity:0.35 },
  corner:   { position:"absolute", top:4, left:5, fontSize:10, fontWeight:"700", lineHeight:13 },
  cornerBR: { position:"absolute", bottom:4, right:5, fontSize:10, fontWeight:"700", lineHeight:13, transform:[{rotate:"180deg"}] },
  center:   { fontSize:30, fontWeight:"800" },
  red:      { color:"#c0392b" },
  blk:      { color:"#111" },
  back:     { backgroundColor:C.cardBack, borderColor:C.cardBack },
  backInner:{ width:"72%", height:"82%", borderRadius:4, borderWidth:1.5, borderColor:C.gold, opacity:0.4 },
});

const pp = StyleSheet.create({
  wrap:      { alignItems:"center", minWidth:60 },
  crown:     { fontSize:14, color:C.gold, fontWeight:"800" },
  avatar:    { width:40, height:40, borderRadius:20, backgroundColor:C.btnGreen, justifyContent:"center", alignItems:"center", borderWidth:2, borderColor:C.border },
  avatarActive: { borderColor:C.gold, borderWidth:3 },
  avatarLetter: { color:C.white, fontWeight:"800", fontSize:F.md },
  name:      { color:C.textSec, fontSize:10, fontWeight:"600", marginTop:3 },
  nameCurrent:{ color:C.white },
  nameMe:    { color:C.gold },
  score:     { color:C.textDim, fontSize:9 },
});

// Table cards: lead card gets a gold border + subtle glow shadow so the
// group can instantly see which suit everyone else must follow.
const tc = StyleSheet.create({
  table: { alignItems:"center", gap:6 },
  row:   { flexDirection:"row", justifyContent:"center" },
  midRow:{ flexDirection:"row", alignItems:"center", gap:10 },
  card:  { width:52, height:36, backgroundColor:"#f8f7f2", borderRadius:6, justifyContent:"center", alignItems:"center", elevation:2 },
  cardLead: {
    borderWidth: 2.5, borderColor: C.gold,
    shadowColor: C.gold, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset:{width:0,height:0},
    elevation: 8,
  },
  empty: { width:52, height:36, borderRadius:6, borderWidth:1, borderColor:"rgba(255,255,255,0.15)", borderStyle:"dashed" },
  text:  { fontSize:11, fontWeight:"700", color:"#111" },
  red:   { color:"#c0392b" },
  leadTag: { position:"absolute", bottom:-14, fontSize:7, color:C.gold, fontWeight:"800", letterSpacing:1 },
  centerDot: { width:10, height:10, borderRadius:5 },
});

const s = StyleSheet.create({
  bg:       { flex:1, backgroundColor:C.bg },
  header:   { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:16, paddingTop:44, paddingBottom:8 },
  roundText:{ color:C.gold, fontSize:F.lg, fontWeight:"900" },
  trickText:{ color:C.textSec, fontSize:F.xs },
  midRow:   { flex:1, flexDirection:"row", alignItems:"center", paddingHorizontal:4 },
  tableArea:{ flex:1, alignItems:"center", justifyContent:"center" },
  // Broad casino-style oval: wide and shallow, stadium shape, thick gold border.
  felt:     {
    width: 320, height: 150,
    borderRadius: 90,
    padding: 16,
    borderWidth: 7,
    justifyContent:"center", alignItems:"center",
    elevation: 6,
    shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 8,
  },
  youSection:{ paddingHorizontal:16, paddingBottom:4 },
  youBar:   { flexDirection:"row", alignItems:"center", gap:10, marginBottom:8 },
  youAvatar:{ width:44, height:44, borderRadius:22, backgroundColor:C.btnGreen, justifyContent:"center", alignItems:"center", borderWidth:2, borderColor:C.border },
  youAvatarActive:{ borderColor:C.gold },
  youLetter:{ color:C.white, fontWeight:"800", fontSize:F.lg },
  youName:  { color:C.white, fontWeight:"700", fontSize:F.md },
  youScore: { color:C.textSec, fontSize:F.xs },
  turnBadge:{ marginLeft:"auto", backgroundColor:C.gold, borderRadius:R.md, paddingHorizontal:10, paddingVertical:6 },
  waitBadge:{ backgroundColor:C.bgCard, borderWidth:1, borderColor:C.border },
  turnBadgeText:{ color:C.bg, fontWeight:"800", fontSize:F.xs },
  waitBadgeText:{ color:C.textSec, fontWeight:"600", fontSize:F.xs },
  tapHint:  { color:C.gold, fontSize:F.xs, textAlign:"center", marginBottom:4 },
  error:    { color:C.negative, fontSize:F.xs, textAlign:"center", marginBottom:4 },
  hand:     { paddingVertical:8, paddingHorizontal:4, gap:6 },
  orderStrip:{ flexDirection:"row", justifyContent:"center", gap:6, paddingVertical:6, paddingHorizontal:12 },
  orderChip:{ paddingHorizontal:10, paddingVertical:4, borderRadius:R.full, backgroundColor:C.bgCard, borderWidth:1, borderColor:C.border, alignItems:"center", minWidth:62 },
  orderChipActive:{ backgroundColor:C.gold, borderColor:C.gold },
  orderNum: { color:C.textDim, fontSize:9 },
  orderNumActive:{ color:C.bg },
  orderName:{ color:C.textSec, fontSize:10, fontWeight:"700" },
  orderNameActive:{ color:C.bg },
});
