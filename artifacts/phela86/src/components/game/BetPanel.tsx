interface BetPanelProps {
  side: "TAI" | "XIU";
  total: number;
  count: number;
  bet: number;
  wins: boolean;
  canBet: boolean;
  selected: boolean;
  chip: number;
  payout: number;
  fmtVN: (n: number) => string;
  onSelect: () => void;
}

export function BetPanel({ side, total, count, bet, wins, canBet, selected, chip, payout, fmtVN, onSelect }: BetPanelProps) {
  const isTai = side === "TAI";

  const winBg = isTai
    ? "linear-gradient(180deg,rgba(200,20,30,0.65),rgba(100,0,10,0.9))"
    : "linear-gradient(180deg,rgba(30,50,200,0.65),rgba(5,10,90,0.9))";
  const betBg = isTai
    ? "linear-gradient(180deg,rgba(160,10,20,0.35),rgba(70,0,5,0.7))"
    : "linear-gradient(180deg,rgba(20,35,160,0.35),rgba(5,8,60,0.7))";
  const normalBg = isTai
    ? "linear-gradient(180deg,rgba(80,0,0,0.7),rgba(15,0,0,0.9))"
    : "linear-gradient(180deg,rgba(0,0,80,0.7),rgba(0,0,15,0.9))";
  const winBorder = isTai ? "rgba(255,60,60,0.9)" : "rgba(100,130,255,0.9)";
  const betBorder = isTai ? "rgba(255,60,60,0.5)" : "rgba(100,130,255,0.5)";
  const normalBorder = isTai ? "rgba(180,0,0,0.4)" : "rgba(0,0,180,0.4)";
  const winShadow = isTai
    ? "0 0 32px rgba(255,30,30,0.7), inset 0 0 28px rgba(255,30,30,0.18)"
    : "0 0 32px rgba(80,120,255,0.7), inset 0 0 28px rgba(80,120,255,0.18)";
  const betShadow = isTai ? "0 0 14px rgba(255,30,30,0.25)" : "0 0 14px rgba(80,120,255,0.25)";
  const textColor = isTai
    ? (wins ? "#fff" : "#ff7777")
    : (wins ? "#fff" : "#8899ff");
  const textGlow = isTai
    ? (wins ? "0 0 24px #ff2222, 0 0 48px #ff0000, 0 2px 10px rgba(0,0,0,0.9)" : "0 2px 10px rgba(0,0,0,0.9)")
    : (wins ? "0 0 24px #5577ff, 0 0 48px #3344ff, 0 2px 10px rgba(0,0,0,0.9)" : "0 2px 10px rgba(0,0,0,0.9)");
  const btnBg = isTai
    ? (selected ? "linear-gradient(135deg,#ff3333,#C41E3A)" : "linear-gradient(180deg,#6a0000,#3a0000)")
    : (selected ? "linear-gradient(135deg,#4466ff,#2233cc)" : "linear-gradient(180deg,#00006a,#00003a)");
  const btnBorder = isTai
    ? (selected ? "none" : "1px solid rgba(255,50,50,0.35)")
    : (selected ? "none" : "1px solid rgba(80,100,255,0.35)");
  const btnShadow = isTai
    ? (selected ? "0 0 16px rgba(255,40,40,0.8)" : "none")
    : (selected ? "0 0 16px rgba(80,100,255,0.8)" : "none");

  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      borderRadius:18, padding:"10px 6px 10px", gap:4,
      background: wins ? winBg : bet > 0 ? betBg : normalBg,
      border: `1.5px solid ${wins ? winBorder : bet > 0 ? betBorder : normalBorder}`,
      boxShadow: wins ? winShadow : bet > 0 ? betShadow : "none",
      transition:"all .3s",
    }}>
      {/* Side label */}
      <span style={{
        fontSize:30, fontWeight:900,
        fontFamily:"'Arial Black', 'Impact', sans-serif",
        letterSpacing:3, color:textColor,
        textShadow:textGlow,
        lineHeight:1,
      }}>{side === "TAI" ? "TÀI" : "XỈU"}</span>

      {/* Range */}
      <span style={{fontSize:8, color:"rgba(255,165,0,0.55)", letterSpacing:0.5}}>
        {isTai ? "11 → 18" : "3 → 10"}
      </span>

      {/* Total bet */}
      <span style={{fontSize:11, fontWeight:700, color:"#FFA500", letterSpacing:0.3, marginTop:1}}>
        {fmtVN(total)}
      </span>

      {/* Player count */}
      <span style={{fontSize:9, color:"rgba(255,255,255,0.42)"}}>👤 {count}</span>

      {/* Current bet badge */}
      {bet > 0 && (
        <div style={{
          padding:"2px 10px", borderRadius:20,
          background:"rgba(255,215,0,0.12)", border:"1px solid rgba(255,215,0,0.38)",
          marginTop:2,
        }}>
          <span style={{fontSize:10, fontWeight:900, color:"#FFD700"}}>{fmtVN(bet)}</span>
        </div>
      )}

      {/* Bet button */}
      {canBet && (
        <button onClick={onSelect}
          className="active:scale-95 transition-all"
          style={{
            marginTop:4, padding:"6px 16px", borderRadius:20, cursor:"pointer",
            background:btnBg, border:btnBorder, color:"#fff",
            fontWeight:900, fontSize:11, letterSpacing:0.5,
            boxShadow:btnShadow, transition:"all .2s",
          }}>
          {selected && chip > 0 ? `${fmtVN(chip)}` : "ĐẶT CƯỢC"}
        </button>
      )}

      {/* Payout */}
      <span style={{fontSize:9, fontWeight:700, color:"rgba(255,165,0,0.48)", marginTop:4}}>
        x{payout.toFixed(2)}
      </span>
    </div>
  );
}
