interface Chip { label: string; value: number; }

interface ChipRowProps {
  chips: Chip[];
  onSelect: (value: number) => void;
  currentChip: number;
}

const CHIP_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  "1K":   { bg:"linear-gradient(135deg,#1a3a6e,#2255aa)", border:"#4488ff", glow:"rgba(40,100,255,0.5)" },
  "10K":  { bg:"linear-gradient(135deg,#1a5a2e,#228855)", border:"#44dd88", glow:"rgba(40,200,100,0.5)" },
  "50K":  { bg:"linear-gradient(135deg,#6e4a00,#c88000)", border:"#FFD700", glow:"rgba(255,200,0,0.5)" },
  "100K": { bg:"linear-gradient(135deg,#6e0000,#bb1111)", border:"#ff4444", glow:"rgba(255,40,40,0.5)" },
  "500K": { bg:"linear-gradient(135deg,#4a006e,#8800bb)", border:"#cc44ff", glow:"rgba(180,40,255,0.5)" },
  "1M":   { bg:"linear-gradient(135deg,#5a2200,#aa4400)", border:"#ff8800", glow:"rgba(255,120,0,0.55)" },
  "5M":   { bg:"linear-gradient(135deg,#003355,#0066aa)", border:"#00aaff", glow:"rgba(0,160,255,0.5)" },
  "50M":  { bg:"linear-gradient(135deg,#2a2a2a,#555555)", border:"#aaaaaa", glow:"rgba(180,180,180,0.4)" },
};

export function ChipRow({ chips, onSelect, currentChip }: ChipRowProps) {
  return (
    <div style={{ display:"flex", gap:5, justifyContent:"center", padding:"0 4px 4px", overflowX:"auto" }}
      className="no-scrollbar">
      {chips.map(c => {
        const colors = CHIP_COLORS[c.label] ?? CHIP_COLORS["1M"];
        const isActive = currentChip > 0 && currentChip % c.value === 0;
        return (
          <button key={c.value} onClick={() => onSelect(c.value)}
            className="active:scale-90 transition-all"
            style={{
              flexShrink:0,
              width:48, height:48, borderRadius:"50%",
              cursor:"pointer", position:"relative",
              background:colors.bg,
              border:`2px solid ${colors.border}`,
              color:"#fff", fontWeight:900, fontSize:10,
              boxShadow:isActive
                ? `0 0 14px ${colors.glow}, 0 0 28px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`
                : `0 2px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)`,
              transform:isActive?"scale(1.12)":"scale(1)",
              transition:"all .15s",
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            }}>
            {/* Chip gloss */}
            <div style={{
              position:"absolute", top:2, left:4, right:4, height:"45%",
              borderRadius:"50%",
              background:"linear-gradient(to bottom, rgba(255,255,255,0.25) 0%, transparent 100%)",
              pointerEvents:"none",
            }}/>
            {/* Chip inner ring */}
            <div style={{
              position:"absolute", inset:4, borderRadius:"50%",
              border:`1px dashed rgba(255,255,255,0.25)`,
              pointerEvents:"none",
            }}/>
            <span style={{ position:"relative", zIndex:1, letterSpacing:0.3 }}>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
