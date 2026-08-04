// GameTableScreen — main trick-play screen.
// - Portrait (taller-than-wide) oval table so all 4 names fit on a phone screen
// - Player name + bid/tricks tally enlarged and never clipped
// - Lead (base) card highlighted with a gold glow
// - When a trick completes, a "X won this trick!" banner shows for ~1.8s
//   before the table clears — matches the server-side pause in gameEngine.js
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

// Player panel — name is always fully visible (single line, no clip), and
// the bid/tricks tally is large and gold so it reads at a glance.
function PlayerPanel({ player, seat, yourSeat, tricksWon, bid, handCount, isAdvantage, isCurrent, isTrickWinner, position }) {
  const isMe = seat === yourSeat;
  const name = isMe ? "You" : (player?.name || `P${seat+1}`);
  const posStyle = {
    top:   { alignItems:"center" },
    left:  { alignItems:"center" },
    right: { alignItems:"center" },
  }[position];

  return (
    <View style={[pp.wrap, posStyle, isTrickWinner && pp.wrapWinner]}>
      {isAdvantage && <Text style={pp.crown}>♠</Text>}
      <View style={[pp.avatar, isCurrent && pp.avatarActive, isTrickWinner && pp.avatarWinner]}>
        <Text style={pp.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={[pp.name, isCurrent && pp.nameCurrent, isMe && pp.nameMe]} numberOfLines={1} ellipsizeMode="tail">
        {name}
      </Text>
      <View style={pp.tally}>
        <Text style={pp.tallyText}>{tricksWon ?? 0}<Text style={pp.tallySlash}>/</Text>{bid ?? "?"}</Text>
      </View>
      {position === "top" && <OpponentHand count={handCount} />}
    </View>
  );
}

// Lead (base) card gets a gold glow. While the trick is complete but not yet
// cleared (server pause), all 4 cards stay visible with the winner's glowing.
function TrickTable({ plays, yourSeat, tableColors, trickWinnerSeat }) {
  const leadSeat = plays?.[0]?.seat;
  const cardFor = (seat) => plays?.find(p => p.seat === seat)?.card;
  const left  = (yourSeat + 1) % 4;
  const top   = (yourSeat + 2) % 4;
  const right = (yourSeat + 3) % 4;

  const TableCard = ({ seat }) => {
    const card = cardFor(seat);
    if (!card) return <View style={tc.empty} />;
    const red = RED.has(card.suit);
    const isLead = seat === leadSeat && trickWinnerSeat == null;
    const isWinner = seat === trickWinnerSeat;
    return (
      <View style={[tc.card, isLead && tc.cardLead, isWinner && tc.cardWinner]}>
        <Text style={[tc.text, red && tc.red]}>{card.rank}{SUIT[card.suit]}</Text>
        {isLead && <Text style={tc.leadTag}>LEAD</Text>}
        {isWinner && <Text style={tc.winTag}>WON</Text>}
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
    tableColor="green", trickWinnerSeat=null,
  } = state || {};

  const tableColors = TABLE_COLORS[tableColor] || TABLE_COLORS.green;
  const myTurn   = currentSeatToPlay === yourSeat;
  const trickNum = Object.values(tricksWonThisRound).reduce((a,b)=>a+b,0) + (trickWinnerSeat==null ? 1 : 0);
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

  const winnerName = trickWinnerSeat != null
    ? (trickWinnerSeat === yourSeat ? "You" : (players[trickWinnerSeat]?.name || `P${trickWinnerSeat+1}`))
    : null;

  return (
    <View style={s.bg}>
      <View style={s.header}>
        <Text style={s.roundText}>Round {round}</Text>
        <Text style={s.trickText}>
          Trick {Math.min(trickNum, round)}/{round}
          {currentTrick.baseSuit ? `  Lead: ${SUIT[currentTrick.baseSuit]}` : ""}
        </Text>
      </View>

      {/* Trick-winner announcement — shown during the server's post-trick pause */}
      {winnerName && (
        <View style={s.winnerBanner}>
          <Text style={s.winnerBannerText}>🏆 {winnerName} won this trick!</Text>
        </View>
      )}

      <PlayerPanel player={players[top]} seat={top} yourSeat={yourSeat}
        tricksWon={tricksWonThisRound[top]} bid={bids[top]}
        handCount={remaining} isAdvantage={advantageSeat===top}
        isCurrent={currentSeatToPlay===top} isTrickWinner={trickWinnerSeat===top} position="top" />

      {/* Portrait oval: taller than wide, so left/right panels always fit
          on-screen with full names visible — no horizontal overflow. */}
      <View style={s.tableRow}>
        <PlayerPanel player={players[left]} seat={left} yourSeat={yourSeat}
          tricksWon={tricksWonThisRound[left]} bid={bids[left]}
          handCount={remaining} isAdvantage={advantageSeat===left}
          isCurrent={currentSeatToPlay===left} isTrickWinner={trickWinnerSeat===left} position="left" />

        <View style={[s.felt, { backgroundColor: tableColors.felt, borderColor: C.gold }]}>
          <TrickTable plays={currentTrick.plays} yourSeat={yourSeat} tableColors={tableColors} trickWinnerSeat={trickWinnerSeat} />
        </View>

        <PlayerPanel player={players[right]} seat={right} yourSeat={yourSeat}
          tricksWon={tricksWonThisRound[right]} bid={bids[right]}
          handCount={remaining} isAdvantage={advantageSeat===right}
          isCurrent={currentSeatToPlay===right} isTrickWinner={trickWinnerSeat===right} position="right" />
      </View>

      <View style={s.youSection}>
        <View style={s.youBar}>
          <View style={[s.youAvatar, myTurn && s.youAvatarActive, trickWinnerSeat===yourSeat && s.youAvatarWinner]}>
            <Text style={s.youLetter}>{players[yourSeat]?.name?.charAt(0)||"Y"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.youName} numberOfLines={1}>You {advantageSeat===yourSeat ? "♠" : ""}</Text>
            <Text style={s.youScore}>{tricksWonThisRound[yourSeat]??0}/{bids[yourSeat]??"?"} tricks</Text>
          </View>
          {myTurn && <View style={s.turnBadge}><Text style={s.turnBadgeText}>YOUR TURN</Text></View>}
          {!myTurn && trickWinnerSeat == null && currentSeatToPlay != null && (
            <View style={[s.turnBadge, s.waitBadge]}>
              <Text style={s.waitBadgeText} numberOfLines={1}>{players[currentSeatToPlay]?.name || `P${currentSeatToPlay+1}`}'s turn</Text>
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
  card: { width:58, height:80, borderRadius:8, backgroundColor:"#f8f7f2", borderWidth:1, borderColor:"#d0cdc8", justifyContent:"center", alignItems:"center", elevation:3 },
  selected: { borderColor:C.gold, borderWidth:3, transform:[{translateY:-12}] },
  dim:      { opacity:0.35 },
  corner:   { position:"absolute", top:4, left:5, fontSize:10, fontWeight:"700", lineHeight:13 },
  cornerBR: { position:"absolute", bottom:4, right:5, fontSize:10, fontWeight:"700", lineHeight:13, transform:[{rotate:"180deg"}] },
  center:   { fontSize:28, fontWeight:"800" },
  red:      { color:"#c0392b" },
  blk:      { color:"#111" },
  back:     { backgroundColor:C.cardBack, borderColor:C.cardBack },
  backInner:{ width:"72%", height:"82%", borderRadius:4, borderWidth:1.5, borderColor:C.gold, opacity:0.4 },
});

// Bigger, always-visible name + tally. Tally uses a pill background so it
// reads clearly against any table color.
const pp = StyleSheet.create({
  wrap:      { alignItems:"center", width:76 },
  wrapWinner:{ transform:[{scale:1.06}] },
  crown:     { fontSize:13, color:C.gold, fontWeight:"800" },
  avatar:    { width:38, height:38, borderRadius:19, backgroundColor:C.btnGreen, justifyContent:"center", alignItems:"center", borderWidth:2, borderColor:C.border },
  avatarActive: { borderColor:C.gold, borderWidth:3 },
  avatarWinner: { borderColor:C.gold, borderWidth:3, shadowColor:C.gold, shadowOpacity:0.9, shadowRadius:8, elevation:8 },
  avatarLetter: { color:C.white, fontWeight:"800", fontSize:F.sm },
  name:      { color:C.white, fontSize:F.xs, fontWeight:"700", marginTop:3, maxWidth:74, textAlign:"center" },
  nameCurrent:{ color:C.gold },
  nameMe:    { color:C.gold },
  tally:     { backgroundColor:"rgba(0,0,0,0.35)", borderRadius:R.full, paddingHorizontal:8, paddingVertical:2, marginTop:2 },
  tallyText: { color:C.gold, fontSize:F.sm, fontWeight:"900" },
  tallySlash:{ color:C.textDim, fontWeight:"600" },
});

const tc = StyleSheet.create({
  table: { alignItems:"center", gap:8 },
  row:   { flexDirection:"row", justifyContent:"center" },
  midRow:{ flexDirection:"row", alignItems:"center", gap:8 },
  card:  { width:46, height:32, backgroundColor:"#f8f7f2", borderRadius:6, justifyContent:"center", alignItems:"center", elevation:2 },
  cardLead: {
    borderWidth: 2.5, borderColor: C.gold,
    shadowColor: C.gold, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset:{width:0,height:0},
    elevation: 8,
  },
  cardWinner: {
    borderWidth: 3, borderColor: C.gold,
    shadowColor: C.gold, shadowOpacity: 1, shadowRadius: 10, shadowOffset:{width:0,height:0},
    elevation: 10,
  },
  empty: { width:46, height:32, borderRadius:6, borderWidth:1, borderColor:"rgba(255,255,255,0.15)", borderStyle:"dashed" },
  text:  { fontSize:10, fontWeight:"700", color:"#111" },
  red:   { color:"#c0392b" },
  leadTag: { position:"absolute", bottom:-13, fontSize:7, color:C.gold, fontWeight:"800", letterSpacing:1 },
  winTag:  { position:"absolute", bottom:-13, fontSize:7, color:C.gold, fontWeight:"900", letterSpacing:1 },
  centerDot: { width:8, height:8, borderRadius:4 },
});

const s = StyleSheet.create({
  bg:       { flex:1, backgroundColor:C.bg },
  header:   { alignItems:"center", paddingTop:40, paddingBottom:4 },
  roundText:{ color:C.gold, fontSize:F.lg, fontWeight:"900" },
  trickText:{ color:C.textSec, fontSize:F.xs },

  winnerBanner: { backgroundColor:C.goldBg, marginHorizontal:20, borderRadius:R.md, paddingVertical:6, alignItems:"center", borderWidth:1, borderColor:C.gold, marginBottom:2 },
  winnerBannerText: { color:C.gold, fontWeight:"800", fontSize:F.sm },

  // Portrait table: row is centered, felt is taller than wide (stadium
  // rotated 90°), leaving guaranteed room for left/right panels either side.
  tableRow: { flexDirection:"row", alignItems:"center", justifyContent:"center", paddingHorizontal:8, marginVertical:6, gap:6 },
  felt: {
    width: 190, height: 260,
    borderRadius: 95,
    padding: 12,
    borderWidth: 7,
    justifyContent:"center", alignItems:"center",
    elevation: 6,
    shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 8,
  },

  youSection:{ paddingHorizontal:16, paddingBottom:2 },
  youBar:   { flexDirection:"row", alignItems:"center", gap:10, marginBottom:6 },
  youAvatar:{ width:42, height:42, borderRadius:21, backgroundColor:C.btnGreen, justifyContent:"center", alignItems:"center", borderWidth:2, borderColor:C.border },
  youAvatarActive:{ borderColor:C.gold },
  youAvatarWinner:{ borderColor:C.gold, borderWidth:3, shadowColor:C.gold, shadowOpacity:0.9, shadowRadius:8, elevation:8 },
  youLetter:{ color:C.white, fontWeight:"800", fontSize:F.md },
  youName:  { color:C.white, fontWeight:"700", fontSize:F.md },
  youScore: { color:C.gold, fontSize:F.xs, fontWeight:"700" },
  turnBadge:{ backgroundColor:C.gold, borderRadius:R.md, paddingHorizontal:10, paddingVertical:6, maxWidth:120 },
  waitBadge:{ backgroundColor:C.bgCard, borderWidth:1, borderColor:C.border },
  turnBadgeText:{ color:C.bg, fontWeight:"800", fontSize:F.xs },
  waitBadgeText:{ color:C.textSec, fontWeight:"600", fontSize:F.xs },
  tapHint:  { color:C.gold, fontSize:F.xs, textAlign:"center", marginBottom:4 },
  error:    { color:C.negative, fontSize:F.xs, textAlign:"center", marginBottom:4 },
  hand:     { paddingVertical:6, paddingHorizontal:4, gap:6 },

  orderStrip:{ flexDirection:"row", justifyContent:"center", gap:6, paddingVertical:6, paddingHorizontal:12 },
  orderChip:{ paddingHorizontal:10, paddingVertical:4, borderRadius:R.full, backgroundColor:C.bgCard, borderWidth:1, borderColor:C.border, alignItems:"center", minWidth:62 },
  orderChipActive:{ backgroundColor:C.gold, borderColor:C.gold },
  orderNum: { color:C.textDim, fontSize:9 },
  orderNumActive:{ color:C.bg },
  orderName:{ color:C.textSec, fontSize:10, fontWeight:"700" },
  orderNameActive:{ color:C.bg },
});