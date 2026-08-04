export const C = {
  bg: '#0b1f12', bgCard: '#0f2a18',
  table: '#1a5c30', tableEdge: '#0d3a1a', tableLight: '#216b38',
  gold: '#f2c14e', goldDark: '#c49a2e', goldLight: '#f7d97a', goldBg: 'rgba(242,193,78,0.15)',
  positive: '#4caf81', negative: '#e05050', warning: '#f0a500',
  white: '#ffffff', textSec: '#a8c4b0', textDim: '#5c7a68',
  border: '#1e4a2a', btnGreen: '#2a6b3e', btnGreenLit: '#38895a',
  overlay: 'rgba(0,0,0,0.75)', shadow: 'rgba(0,0,0,0.5)',
  cardFront: '#f8f7f2', cardBack: '#1a3d7a', cardBorder: '#d0cdc8',
};

// Room creator picks the table felt color; border is always gold regardless.
export const TABLE_COLORS = {
  green: { felt: '#1a5c30', edge: '#0d3a1a', label: 'Green' },
  red:   { felt: '#7a2230', edge: '#4a1119', label: 'Red'   },
  blue:  { felt: '#1c3f6e', edge: '#0e2340', label: 'Blue'  },
};

export const F = { xs:11, sm:12, base:14, md:16, lg:18, xl:22, xxl:28, hero:40 };
export const R = { xs:4, sm:8, md:12, lg:16, xl:24, full:9999 };
export const S = { shadow: { shadowColor:'#000', shadowOpacity:0.45, shadowRadius:8, elevation:6 } };
