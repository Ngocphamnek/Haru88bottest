import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useGetMe } from "@workspace/api-client-react";

function fmtVN(n: number) { return n.toLocaleString("vi-VN"); }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randF(min: number, max: number) { return Math.random() * (max - min) + min; }

type Phase = "BETTING" | "THROWING" | "RESULT";
type BetSide = "tai" | "xiu";
type Popup = "rules" | "leaderboard" | "soicau" | "history" | null;
type DiceRecord  = {session:number; dice:[number,number,number]; result:"T"|"X"; time:string};
type BetRecord   = {session:number; side:"TAI"|"XIU"; amount:number; won:boolean; time:string};
type LBEntry     = {name:string; totalWin:number; gamesPlayed:number; wins:number};

const CHIPS = [
  { label:"1K",  value:1_000 },    { label:"10K",  value:10_000 },
  { label:"50K", value:50_000 },   { label:"100K", value:100_000 },
  { label:"500K",value:500_000 },  { label:"1M",   value:1_000_000 },
  { label:"5M",  value:5_000_000 },{ label:"50M",  value:50_000_000 },
];
const ROUND          = 60;
const THROW_MS       = 1800;
const RESULT_MS      = 5000;
const PAYOUT         = 1.95;

const DOTS: Record<number,[number,number][]> = {
  1:[[50,50]],
  2:[[28,28],[72,72]],
  3:[[28,28],[50,50],[72,72]],
  4:[[28,28],[72,28],[28,72],[72,72]],
  5:[[28,28],[72,28],[50,50],[28,72],[72,72]],
  6:[[28,22],[72,22],[28,50],[72,50],[28,78],[72,78]],
};

/* ─── DiceFace ─── */
function DiceFace({ val, size=44 }:{ val:number; size?:number }) {
  const uid=`d${val}s${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      style={{filter:"drop-shadow(0 2px 7px rgba(0,0,0,0.9))",display:"block",flexShrink:0}}>
      <defs>
        <linearGradient id={`${uid}g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff"/><stop offset="100%" stopColor="#d8d8d8"/>
        </linearGradient>
        <linearGradient id={`${uid}t`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="88" height="88" rx="17" fill="rgba(0,0,0,0.28)"/>
      <rect x="4"  y="4"  width="88" height="88" rx="17" fill={`url(#${uid}g)`}/>
      <rect x="4"  y="4"  width="88" height="40" rx="17" fill={`url(#${uid}t)`}/>
      <rect x="4"  y="4"  width="88" height="88" rx="17" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5"/>
      {(DOTS[val]??DOTS[1]).map(([cx,cy],i)=>(
        <g key={i}>
          <circle cx={cx+1} cy={cy+1.5} r="9.5" fill="rgba(0,0,0,0.22)"/>
          <circle cx={cx} cy={cy} r="9.5" fill="#C41E3A"/>
          <circle cx={cx-3} cy={cy-3} r="3" fill="rgba(255,150,150,0.4)"/>
        </g>
      ))}
    </svg>
  );
}

/* ─── Top-down Bowl (viewed from above) ─── */
function TopBowlSVG({ size=90 }:{ size?:number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{display:"block",overflow:"visible"}}>
      <defs>
        <radialGradient id="tbBody" cx="42%" cy="38%" r="72%">
          <stop offset="0%"  stopColor="#9b0000"/><stop offset="30%" stopColor="#6a0000"/>
          <stop offset="65%" stopColor="#3a0000"/><stop offset="100%" stopColor="#0e0000"/>
        </radialGradient>
        <radialGradient id="tbKnob" cx="32%" cy="28%" r="70%">
          <stop offset="0%"  stopColor="#fffacc"/><stop offset="28%" stopColor="#FFD700"/>
          <stop offset="65%" stopColor="#c8860a"/><stop offset="100%" stopColor="#5a3200"/>
        </radialGradient>
        <linearGradient id="tbRimGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffacc"/><stop offset="22%" stopColor="#FFD700"/>
          <stop offset="50%" stopColor="#c8860a"/><stop offset="78%" stopColor="#FFD700"/>
          <stop offset="100%" stopColor="#7a5000"/>
        </linearGradient>
        <filter id="tbGlow">
          <feGaussianBlur stdDeviation="2.8" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="tbKG">
          <feGaussianBlur stdDeviation="1.8" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* shadow */}
      <ellipse cx="62" cy="67" rx="50" ry="10" fill="rgba(0,0,0,0.55)"/>
      {/* glow halo */}
      <circle cx="60" cy="60" r="57" fill="rgba(255,140,0,0.07)"/>
      {/* rim */}
      <circle cx="60" cy="60" r="55" fill="#180400" stroke="url(#tbRimGold)" strokeWidth="5.5" filter="url(#tbGlow)"/>
      {/* body */}
      <circle cx="60" cy="60" r="49.5" fill="url(#tbBody)"/>
      {/* rings */}
      <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,215,0,0.24)" strokeWidth="1.5"/>
      <circle cx="60" cy="60" r="40" fill="none" stroke="rgba(255,215,0,0.10)" strokeWidth="0.8"/>
      <circle cx="60" cy="60" r="24" fill="none" stroke="rgba(255,215,0,0.14)" strokeWidth="0.7"/>
      {/* 8 petals */}
      {[0,45,90,135,180,225,270,315].map((a,i)=>(
        <g key={i} transform={`rotate(${a} 60 60)`}>
          <path d="M60 14 Q63.5 24 60 30 Q56.5 24 60 14 Z" fill="rgba(255,215,0,0.3)" stroke="rgba(255,215,0,0.15)" strokeWidth="0.4"/>
        </g>
      ))}
      {/* 4 diamond marks */}
      {[0,90,180,270].map((a,i)=>(
        <g key={i} transform={`rotate(${a} 60 60)`}>
          <path d="M60 17 L62.5 22 L60 27 L57.5 22 Z" fill="rgba(255,215,0,0.65)"/>
        </g>
      ))}
      {/* 4 small dots between petals */}
      {[22.5,112.5,202.5,292.5].map((a,i)=>(
        <g key={i} transform={`rotate(${a} 60 60)`}>
          <circle cx="60" cy="19" r="2.5" fill="rgba(255,215,0,0.5)"/>
        </g>
      ))}
      {/* sheen */}
      <ellipse cx="39" cy="37" rx="22" ry="13" fill="rgba(255,255,255,0.07)" transform="rotate(-22 39 37)"/>
      <ellipse cx="46" cy="30" rx="10" ry="5"  fill="rgba(255,255,255,0.045)" transform="rotate(-18 46 30)"/>
      {/* knob shadow */}
      <circle cx="62" cy="63" r="16" fill="rgba(0,0,0,0.55)"/>
      {/* knob */}
      <circle cx="60" cy="60" r="16" fill="url(#tbKnob)" stroke="rgba(200,134,10,0.8)" strokeWidth="1.5" filter="url(#tbKG)"/>
      <circle cx="60" cy="60" r="12" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8"/>
      <circle cx="60" cy="60" r="8"  fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6"/>
      {/* knob highlight */}
      <ellipse cx="54" cy="54" rx="5.5" ry="3.5" fill="rgba(255,255,255,0.45)"/>
      <ellipse cx="52" cy="52" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.65)"/>
      {/* rim glint */}
      <path d="M 18 42 Q 30 10 60 8 Q 90 10 102 42" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

/* ─── Confetti + Coins ─── */
type CP={id:number;x:number;color:string;size:number;delay:number;duration:number;shape:"rect"|"circle"};
function Confetti({active}:{active:boolean}) {
  const pieces=useMemo<CP[]>(()=>{
    const colors=["#FFD700","#FFA500","#ff4444","#ff88aa","#44ddff","#88ff66","#ffffff","#cc88ff"];
    return Array.from({length:55},(_,i)=>({
      id:i,x:randF(2,98),color:colors[i%colors.length],
      size:randF(6,13),delay:randF(0,1.3),duration:randF(2.5,4.5),
      shape:(i%2===0?"rect":"circle") as "rect"|"circle",
    }));
  },[]);
  if(!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{zIndex:50}}>
      {pieces.map(p=>(
        <div key={p.id} className="confetti-piece" style={{
          left:`${p.x}%`,top:0,width:p.size,height:p.shape==="circle"?p.size:p.size*1.6,
          borderRadius:p.shape==="circle"?"50%":"2px",background:p.color,
          animationDuration:`${p.duration}s`,animationDelay:`${p.delay}s`,opacity:0,
        }}/>
      ))}
    </div>
  );
}
function CoinRain({active}:{active:boolean}) {
  const coins=useMemo(()=>Array.from({length:18},(_,i)=>({id:i,x:randF(5,95),delay:randF(0,2),dur:randF(1.8,3.5),size:randF(16,28)})),[]);
  if(!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{zIndex:51}}>
      {coins.map(c=>(
        <div key={c.id} className="coin-drop" style={{
          position:"absolute",left:`${c.x}%`,top:-40,width:c.size,height:c.size,borderRadius:"50%",
          background:"radial-gradient(circle at 35% 35%,#fff7a0,#FFD700 45%,#c8860a 80%,#8B5E00)",
          border:"2px solid #FFD700",boxShadow:"0 0 8px rgba(255,215,0,0.6)",
          animationDuration:`${c.dur}s`,animationDelay:`${c.delay}s`,opacity:0,
        }}/>
      ))}
    </div>
  );
}


/* ═══════════════════════════════════════════════
   OVAL CASINO TABLE — rich decorative design
═══════════════════════════════════════════════ */
function OvalFrame({w,h}:{w:number;h:number}) {
  const rx = h/2;
  const CX = w/2, CY = h/2;
  // Gold dot ring along inner ellipse
  const DOT_RX = w/2 - 22, DOT_RY = h/2 - 22;
  const NDOTS = 32;
  const dots = Array.from({length:NDOTS}, (_,i)=>{
    const angle = (i/NDOTS)*2*Math.PI - Math.PI/2;
    return { x: CX + DOT_RX*Math.cos(angle), y: CY + DOT_RY*Math.sin(angle), big: i%4===0 };
  });
  // Left/right end ornament petal positions
  const leftOrn  = { cx:22, cy:CY };
  const rightOrn = { cx:w-22, cy:CY };

  return (
    <svg width={w} height={h} className="absolute inset-0 pointer-events-none" style={{zIndex:0}}>
      <defs>
        {/* Felt gradient — layered depth */}
        <radialGradient id="feltMain" cx="50%" cy="40%" r="65%">
          <stop offset="0%"   stopColor="#8a0000"/>
          <stop offset="35%"  stopColor="#5c0000"/>
          <stop offset="70%"  stopColor="#380000"/>
          <stop offset="100%" stopColor="#180000"/>
        </radialGradient>
        {/* Outer dark shadow ring */}
        <radialGradient id="feltEdge" cx="50%" cy="50%" r="50%">
          <stop offset="60%"  stopColor="transparent"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)"/>
        </radialGradient>
        {/* Diamond weave texture */}
        <pattern id="feltDia" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="none"/>
          <path d="M6 0 L12 6 L6 12 L0 6 Z" fill="none" stroke="rgba(0,0,0,0.14)" strokeWidth="0.5"/>
        </pattern>
        {/* Fine crosshatch overlay */}
        <pattern id="feltHatch" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="none"/>
          <line x1="0" y1="0" x2="8" y2="8" stroke="rgba(255,255,255,0.018)" strokeWidth="0.4"/>
          <line x1="8" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.018)" strokeWidth="0.4"/>
        </pattern>
        {/* Top lighting sheen */}
        <linearGradient id="feltSheen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.08)"/>
          <stop offset="45%"  stopColor="rgba(255,255,255,0.01)"/>
          <stop offset="100%" stopColor="transparent"/>
        </linearGradient>
        {/* Gold border gradient */}
        <linearGradient id="goldRim" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#fffacc"/>
          <stop offset="18%"  stopColor="#FFD700"/>
          <stop offset="50%"  stopColor="#b8720a"/>
          <stop offset="82%"  stopColor="#FFD700"/>
          <stop offset="100%" stopColor="#7a5000"/>
        </linearGradient>
        {/* Gold glow filter */}
        <filter id="goldGlow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* Subtle inner shadow */}
        <filter id="innerShadow" x="-5%" y="-5%" width="110%" height="110%">
          <feFlood floodColor="#000" floodOpacity="0.5" result="flood"/>
          <feComposite in="flood" in2="SourceGraphic" operator="in" result="mask"/>
          <feGaussianBlur in="mask" stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="blur"/></feMerge>
        </filter>
      </defs>

      {/* ── 1. Outer dark bevel shadow */}
      <rect x="0" y="0" width={w} height={h} rx={rx} fill="rgba(0,0,0,0.7)"/>

      {/* ── 2. Felt background fill */}
      <rect x="5" y="5" width={w-10} height={h-10} rx={rx-3} fill="url(#feltMain)"/>
      {/* ── 3. Diamond weave texture */}
      <rect x="5" y="5" width={w-10} height={h-10} rx={rx-3} fill="url(#feltDia)"/>
      {/* ── 4. Fine crosshatch */}
      <rect x="5" y="5" width={w-10} height={h-10} rx={rx-3} fill="url(#feltHatch)"/>
      {/* ── 5. Edge vignette darkening */}
      <rect x="5" y="5" width={w-10} height={h-10} rx={rx-3} fill="url(#feltEdge)"/>
      {/* ── 6. Top lighting sheen */}
      <rect x="5" y="5" width={w-10} height={(h-10)*0.45} rx={rx-3} fill="url(#feltSheen)"/>

      {/* ── 7. Subtle center vertical divider */}
      <line x1={CX} y1={CY-60} x2={CX} y2={CY+60}
        stroke="rgba(255,215,0,0.08)" strokeWidth="0.8" strokeDasharray="4,4"/>

      {/* ── 8. Subtle chip-placement markers — TÀI side */}
      {[0.33,0.5,0.67].map((t,i)=>(
        <circle key={`tl${i}`} cx={w*0.24} cy={h*t} r="7"
          fill="none" stroke="rgba(255,215,0,0.1)" strokeWidth="0.8" strokeDasharray="3,2"/>
      ))}
      {/* ── 9. Chip markers — XỈU side */}
      {[0.33,0.5,0.67].map((t,i)=>(
        <circle key={`xl${i}`} cx={w*0.76} cy={h*t} r="7"
          fill="none" stroke="rgba(255,215,0,0.1)" strokeWidth="0.8" strokeDasharray="3,2"/>
      ))}

      {/* ── 10. LEFT end circular ornament */}
      <circle cx={leftOrn.cx} cy={leftOrn.cy} r="13"
        fill="rgba(255,215,0,0.04)" stroke="rgba(255,215,0,0.30)" strokeWidth="0.8"/>
      {[0,60,120,180,240,300].map((a,i)=>{
        const rad=a*Math.PI/180;
        return <circle key={`lo${i}`} cx={leftOrn.cx+10*Math.cos(rad)} cy={leftOrn.cy+10*Math.sin(rad)}
          r="2.2" fill="rgba(255,215,0,0.40)"/>;
      })}
      <circle cx={leftOrn.cx} cy={leftOrn.cy} r="3.5" fill="rgba(255,215,0,0.55)"/>

      {/* ── 11. RIGHT end circular ornament */}
      <circle cx={rightOrn.cx} cy={rightOrn.cy} r="13"
        fill="rgba(255,215,0,0.04)" stroke="rgba(255,215,0,0.30)" strokeWidth="0.8"/>
      {[0,60,120,180,240,300].map((a,i)=>{
        const rad=a*Math.PI/180;
        return <circle key={`ro${i}`} cx={rightOrn.cx+10*Math.cos(rad)} cy={rightOrn.cy+10*Math.sin(rad)}
          r="2.2" fill="rgba(255,215,0,0.40)"/>;
      })}
      <circle cx={rightOrn.cx} cy={rightOrn.cy} r="3.5" fill="rgba(255,215,0,0.55)"/>

      {/* ── 12. Gold dot ring along inner ellipse */}
      {dots.map((d,i)=>(
        <circle key={i} cx={d.x} cy={d.y} r={d.big?2.8:1.6}
          fill={d.big?"rgba(255,215,0,0.65)":"rgba(200,134,10,0.38)"}/>
      ))}

      {/* ── 13. Inner decorative border ring */}
      <rect x="18" y="18" width={w-36} height={h-36} rx={rx-15}
        fill="none" stroke="rgba(255,215,0,0.18)" strokeWidth="1"/>
      <rect x="22" y="22" width={w-44} height={h-44} rx={rx-19}
        fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.7"/>

      {/* ── 14. Main gold glow border */}
      <rect x="3" y="3" width={w-6} height={h-6} rx={rx-2}
        fill="none" stroke="url(#goldRim)" strokeWidth="6" filter="url(#goldGlow)"/>

      {/* ── 15. Outermost dark frame */}
      <rect x="1" y="1" width={w-2} height={h-2} rx={rx}
        fill="none" stroke="#120500" strokeWidth="10"/>

      {/* ── 16. Fine inner gold line (innermost) */}
      <rect x="13" y="13" width={w-26} height={h-26} rx={rx-11}
        fill="none" stroke="rgba(255,215,0,0.22)" strokeWidth="0.8"/>
    </svg>
  );
}

/* ─── Center Circle ─── */
function CenterCircle({children,size=110}:{children:React.ReactNode;size?:number}) {
  const c=size/2;
  return (
    <div className="relative flex-shrink-0" style={{width:size,height:size,overflow:"visible"}}>
      <svg width={size} height={size} className="absolute inset-0">
        <defs>
          <radialGradient id="circBg" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#2a2a2a"/><stop offset="100%" stopColor="#050505"/>
          </radialGradient>
          <linearGradient id="circRing" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#FFD700"/><stop offset="50%" stopColor="#8B5E00"/>
            <stop offset="100%" stopColor="#FFD700"/>
          </linearGradient>
          <filter id="circGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx={c} cy={c} r={c-1}  fill="#1a0a00"/>
        <circle cx={c} cy={c} r={c-3}  fill="none" stroke="url(#circRing)" strokeWidth="5" filter="url(#circGlow)"/>
        <circle cx={c} cy={c} r={c-8}  fill="none" stroke="#2a1500" strokeWidth="2"/>
        <circle cx={c} cy={c} r={c-11} fill="url(#circBg)"/>
        <ellipse cx={c} cy={c-15} rx={22} ry={8} fill="rgba(255,255,255,0.04)"/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{overflow:"visible"}}>
        {children}
      </div>
    </div>
  );
}

/* ─── Triangle Dice: XX1+XX2 top row · XX3 bottom center · sum badge top-right ─── */
function DiceTriangle({dice,isTai,sum,noAnim}:{dice:number[];isTai:boolean;sum:number;noAnim?:boolean}) {
  const SZ = 32;
  const anim = noAnim ? "" : "dice-tri-pop";
  const delay = (s:string) => noAnim ? {} : {animationDelay:s};
  return (
    <div style={{
      position:"relative",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,
    }}>
      {/* Sum badge — floats top-right */}
      <div className={anim} style={{
        position:"absolute",right:-8,top:-2,zIndex:10,
        background:"rgba(10,5,0,0.88)",
        border:"1.5px solid rgba(255,215,0,0.9)",
        borderRadius:5,
        color:"#FFD700",fontSize:11,fontWeight:900,lineHeight:1,
        padding:"2px 6px",letterSpacing:0.5,
        boxShadow:"0 0 8px rgba(255,200,0,0.6)",
        ...delay("0.28s"),
      }}>{sum}</div>
      {/* Row 1: die[0] left · die[1] right */}
      <div style={{display:"flex",gap:4}}>
        <div className={anim} style={{...delay("0s")}}>
          <DiceFace val={dice[0]} size={SZ}/>
        </div>
        <div className={anim} style={{...delay("0.13s")}}>
          <DiceFace val={dice[1]} size={SZ}/>
        </div>
      </div>
      {/* Row 2: die[2] center */}
      <div className={anim} style={{...delay("0.24s")}}>
        <DiceFace val={dice[2]} size={SZ}/>
      </div>
    </div>
  );
}

/* ─── Small helpers ─── */
function CuocButton({active,disabled,onClick}:{active:boolean;disabled?:boolean;onClick:()=>void}) {
  return (
    <button onClick={disabled?undefined:onClick} className="mt-1.5 transition-all" style={{
      padding:"3px 18px",borderRadius:20,cursor:disabled?"not-allowed":"pointer",
      background:disabled?"linear-gradient(180deg,#1a1000,#0e0900)":active?"linear-gradient(180deg,#FFD700,#c8860a)":"linear-gradient(180deg,#3d1f00,#2a1200)",
      border:`1.5px solid ${disabled?"#2a1800":active?"#FFD700":"#6b3800"}`,
      color:disabled?"rgba(180,120,0,0.3)":active?"#1a0800":"#d4a017",
      fontSize:11,fontWeight:900,letterSpacing:1,opacity:disabled?0.5:1,
      transform:disabled?"none":undefined,
    }}>CƯỢC</button>
  );
}
function ChipBtn({label,selected,onClick}:{label:string;selected:boolean;onClick:()=>void}) {
  return (
    <button onClick={onClick} className="active:scale-95 transition-all" style={{
      padding:"8px 0",borderRadius:10,cursor:"pointer",
      background:selected?"linear-gradient(180deg,#FFD700 0%,#c8860a 100%)":"linear-gradient(180deg,#2e1800 0%,#1a0d00 100%)",
      border:`1.5px solid ${selected?"#FFD700":"#5a3000"}`,
      color:selected?"#1a0800":"#d4a017",fontSize:12,fontWeight:900,letterSpacing:0.5,
      boxShadow:selected?"0 0 12px rgba(255,215,0,0.5),inset 0 1px 0 rgba(255,255,255,0.3)":"inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>{label}</button>
  );
}
function Bead({val}:{val:"T"|"X"}) {
  return <div style={{
    width:14,height:14,borderRadius:"50%",flexShrink:0,
    background:val==="T"?"radial-gradient(circle at 35% 30%,#ff6666,#C41E3A,#7a0010)":"radial-gradient(circle at 35% 30%,#ffffff,#dddddd,#aaaaaa)",
    border:`1px solid ${val==="T"?"#ff3333":"#ffffff"}`,
    boxShadow:val==="T"?"0 0 4px rgba(196,30,58,0.7)":"0 0 3px rgba(255,255,255,0.4)",
  }}/>;
}
function PopupShell({title,onClose,children,wide=false}:{title:string;onClose:()=>void;children:React.ReactNode;wide?:boolean}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{zIndex:60,background:"rgba(0,0,0,0.75)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:wide?"min(700px,96vw)":"min(370px,92vw)",maxHeight:"85vh",display:"flex",flexDirection:"column",
        borderRadius:18,overflow:"hidden",
        background:"linear-gradient(180deg,#2a1408 0%,#140900 100%)",
        boxShadow:"0 0 0 2px #6b3800,0 0 0 4px #D8A24A,0 0 0 6px #6b3800,0 20px 60px rgba(0,0,0,0.95)",
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",borderBottom:"1px solid rgba(139,94,0,0.4)",background:"linear-gradient(90deg,rgba(139,94,0,0.15),transparent)"}}>
          <span style={{color:"#FFD700",fontWeight:900,fontSize:13,letterSpacing:2}}>{title}</span>
          <button onClick={onClose} style={{color:"#FFD700",fontWeight:900,fontSize:18,background:"none",border:"none",cursor:"pointer",lineHeight:1}}>✕</button>
        </div>
        <div style={{overflowY:"auto",flex:1}}>{children}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SOI CẦU — Big Road casino-style matrix
═══════════════════════════════════════════ */
function SoiCauPopup({history,onClose}:{history:DiceRecord[];onClose:()=>void}) {
  const ROWS=6, CELL=22, GAP=1;
  const MIN_COLS=20;

  const {cells,maxCol} = useMemo(()=>{
    const cells:{col:number;row:number;rec:DiceRecord}[]=[];
    const occ=new Set<string>();
    let col=0, row=0;
    let prev:string|null=null;
    const ordered=[...history].reverse();
    for(const rec of ordered){
      if(prev!==null){
        if(rec.result===prev){
          if(row+1<ROWS) row++;
          else col++;
        } else {
          col++;
          row=0;
          while(occ.has(`${col}-${row}`)) col++;
        }
      }
      while(occ.has(`${col}-${row}`)) col++;
      occ.add(`${col}-${row}`);
      cells.push({col,row,rec});
      prev=rec.result;
    }
    return {cells, maxCol:cells.length>0?Math.max(...cells.map(c=>c.col))+1:0};
  },[history]);

  const taiCount=history.filter(r=>r.result==="T").length;
  const xiuCount=history.filter(r=>r.result==="X").length;
  const last=history[0];
  const displayCols=Math.max(maxCol,MIN_COLS);
  const svgW=displayCols*(CELL+GAP)+GAP;
  const svgH=ROWS*(CELL+GAP)+GAP;

  return (
    <PopupShell title="SOI CẦU" onClose={onClose} wide>
      <div style={{padding:"10px 12px"}}>
        {/* Stats overview */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,padding:"10px 14px",borderRadius:10,background:"rgba(0,0,0,0.35)",border:"1px solid rgba(139,94,0,0.35)"}}>
          <div style={{textAlign:"center"}}>
            <div style={{
              fontSize:20,fontWeight:900,color:"#111",background:"#e8e8e8",borderRadius:"50%",
              width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 3px",
              border:"2px solid #bbb",boxShadow:"0 2px 6px rgba(0,0,0,0.4)"
            }}>{xiuCount}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",letterSpacing:1}}>XỈU</div>
          </div>
          <div style={{textAlign:"center",fontSize:10}}>
            {last?(
              <>
                <div style={{fontWeight:900,color:"#FFCC66",fontSize:11,marginBottom:3}}>#{last.session}</div>
                <div style={{color:last.result==="T"?"#ff8888":"#8899ff",fontWeight:700}}>
                  {last.result==="T"?"🔴 TÀI":"⚪ XỈU"}&nbsp;({last.dice.join("-")})
                </div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",marginTop:2}}>Phiên gần nhất</div>
              </>
            ):(
              <span style={{color:"rgba(255,255,255,0.3)",fontSize:10}}>Chưa có dữ liệu</span>
            )}
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{
              fontSize:20,fontWeight:900,color:"#fff",background:"#1a1a1a",borderRadius:"50%",
              width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 3px",
              border:"2px solid #555",boxShadow:"0 2px 6px rgba(0,0,0,0.4)"
            }}>{taiCount}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",letterSpacing:1}}>TÀI</div>
          </div>
        </div>

        {/* Legend */}
        <div style={{display:"flex",gap:14,marginBottom:6,fontSize:9}}>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:14,height:14,borderRadius:"50%",background:"#111",border:"1.5px solid #555"}}/>
            <span style={{color:"rgba(255,255,255,0.45)"}}>Tài (11-18)</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:14,height:14,borderRadius:"50%",background:"#f0f0f0",border:"1.5px solid #bbb"}}/>
            <span style={{color:"rgba(255,255,255,0.45)"}}>Xỉu (3-10)</span>
          </div>
        </div>

        {/* Big Road grid */}
        <div style={{fontSize:9,color:"rgba(255,215,0,0.6)",fontWeight:900,marginBottom:5,letterSpacing:1}}>BẢNG CẦU CHÍNH</div>
        {history.length===0?(
          <div style={{color:"rgba(255,255,255,0.3)",fontSize:10,textAlign:"center",padding:"20px 0",borderRadius:8,border:"1px solid rgba(139,94,0,0.25)"}}>
            Chưa có dữ liệu — chờ kết quả đầu tiên
          </div>
        ):(
          <div style={{overflowX:"auto",borderRadius:8,border:"1px solid rgba(216,162,74,0.4)",background:"rgba(0,0,0,0.5)"}}>
            <svg width={svgW} height={svgH} style={{display:"block"}}>
              {Array.from({length:ROWS+1},(_,r)=>(
                <line key={`hr${r}`} x1={0} y1={r*(CELL+GAP)} x2={svgW} y2={r*(CELL+GAP)} stroke="rgba(139,94,0,0.4)" strokeWidth="1"/>
              ))}
              {Array.from({length:displayCols+1},(_,c)=>(
                <line key={`vc${c}`} x1={c*(CELL+GAP)} y1={0} x2={c*(CELL+GAP)} y2={svgH} stroke="rgba(139,94,0,0.4)" strokeWidth="1"/>
              ))}
              {cells.map(({col,row,rec},i)=>{
                const isTai=rec.result==="T";
                const cx=col*(CELL+GAP)+GAP/2+CELL/2+0.5;
                const cy=row*(CELL+GAP)+GAP/2+CELL/2+0.5;
                const total=rec.dice[0]+rec.dice[1]+rec.dice[2];
                return (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r={CELL/2-1.5}
                      fill={isTai?"#111":"#efefef"}
                      stroke={isTai?"#444":"#ccc"} strokeWidth="1"/>
                    <text x={cx} y={cy+3.5} textAnchor="middle" fontSize={9} fontWeight="bold" fill={isTai?"#fff":"#111"}>{total}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* Sub-road */}
        {history.length>0&&(
          <>
          <div style={{fontSize:9,color:"rgba(255,215,0,0.6)",fontWeight:900,margin:"10px 0 5px",letterSpacing:1}}>BẢNG CẦU PHỤ (40 phiên gần nhất)</div>
          <div style={{overflowX:"auto",borderRadius:8,border:"1px solid rgba(139,94,0,0.3)",background:"rgba(0,0,0,0.4)",padding:"5px 6px"}}>
            <div style={{display:"flex",gap:3,minWidth:"max-content",alignItems:"center"}}>
              {[...history].reverse().slice(0,40).map((rec,i)=>{
                const isTai=rec.result==="T";
                const total=rec.dice[0]+rec.dice[1]+rec.dice[2];
                return (
                  <div key={i} style={{
                    width:22,height:22,borderRadius:"50%",flexShrink:0,
                    background:isTai?"#1a1a1a":"#efefef",
                    border:`1.5px solid ${isTai?"#555":"#bbb"}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:7,fontWeight:900,color:isTai?"#fff":"#111",
                  }}>{total}</div>
                );
              })}
              <div style={{color:"#FFD700",fontSize:14,marginLeft:4,flexShrink:0}}>›</div>
            </div>
          </div>
          </>
        )}
      </div>
    </PopupShell>
  );
}

/* ═══════════════════════════════════════════
   LỊCH SỬ CHƠI POPUP — detailed bet history
═══════════════════════════════════════════ */
const PAYOUT_RATE=1.95;
function HistoryPopup({history,onClose}:{history:BetRecord[];onClose:()=>void}) {
  const [filter,setFilter]=useState<"all"|"won"|"lost">("all");
  const [page,setPage]=useState(0);
  const PAGE_SIZE=10;

  const filtered=useMemo(()=>history.filter(b=>
    filter==="all"?true:filter==="won"?b.won:!b.won
  ),[history,filter]);
  const totalPages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const curPage=Math.min(page,totalPages-1);
  const paged=filtered.slice(curPage*PAGE_SIZE,(curPage+1)*PAGE_SIZE);

  const pBtnStyle:{[k:string]:string|number}={
    padding:"3px 9px",borderRadius:6,fontSize:12,fontWeight:900,cursor:"pointer",
    background:"rgba(139,94,0,0.3)",border:"1px solid rgba(139,94,0,0.5)",color:"#FFD700",
  };

  const filterBtns:[string,"all"|"won"|"lost"][]=[["Tất cả","all"],["Thắng","won"],["Thua","lost"]];

  return (
    <PopupShell title="LỊCH SỬ CHƠI" onClose={onClose} wide>
      <div style={{padding:"8px 10px"}}>
        {/* Filters */}
        <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
          {filterBtns.map(([label,key])=>(
            <button key={key} onClick={()=>{setFilter(key);setPage(0);}} style={{
              padding:"4px 13px",borderRadius:20,fontSize:10,fontWeight:900,cursor:"pointer",
              background:filter===key?"linear-gradient(135deg,#b8860b,#FFD700)":"rgba(0,0,0,0.4)",
              border:`1px solid ${filter===key?"#FFD700":"rgba(139,94,0,0.4)"}`,
              color:filter===key?"#1a0800":"rgba(255,215,0,0.6)",
            }}>{label}</button>
          ))}
          <span style={{marginLeft:"auto",fontSize:9,color:"rgba(255,255,255,0.3)"}}>{filtered.length} lượt</span>
        </div>

        {filtered.length===0?(
          <div style={{padding:"28px",textAlign:"center",color:"rgba(255,255,255,0.3)",fontSize:11}}>
            {history.length===0?"Chưa có lịch sử chơi nào":"Không có lượt khớp bộ lọc"}
          </div>
        ):(
          <>
          {/* Table header */}
          <div style={{
            display:"grid",gridTemplateColumns:"52px 1fr 32px 68px 60px 68px",
            padding:"5px 8px",fontSize:8,fontWeight:900,letterSpacing:0.5,
            color:"rgba(255,215,0,0.5)",borderBottom:"1px solid rgba(139,94,0,0.35)",gap:4,
          }}>
            <span>PHIÊN</span><span>THỜI GIAN</span><span>CỬA</span>
            <span style={{textAlign:"right"}}>ĐẶT</span><span style={{textAlign:"center"}}>KẾT QUẢ</span>
            <span style={{textAlign:"right"}}>NHẬN</span>
          </div>
          {/* Rows */}
          {paged.map((b,i)=>{
            const received=b.won?Math.floor(b.amount*PAYOUT_RATE):0;
            return (
              <div key={i} style={{
                display:"grid",gridTemplateColumns:"52px 1fr 32px 68px 60px 68px",
                padding:"7px 8px",gap:4,alignItems:"center",
                borderBottom:"1px solid rgba(255,255,255,0.04)",
                background:i%2===0?"transparent":"rgba(255,255,255,0.015)",
              }}>
                <span style={{fontSize:9,color:"rgba(255,215,0,0.5)"}}>#{b.session}</span>
                <span style={{fontSize:8,color:"rgba(255,255,255,0.35)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b.time}</span>
                <div style={{
                  width:22,height:22,borderRadius:"50%",flexShrink:0,
                  background:b.side==="TAI"?"radial-gradient(#ff5555,#aa1111)":"radial-gradient(#7788ff,#2233bb)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:8,fontWeight:900,color:"#fff",
                }}>{b.side==="TAI"?"T":"X"}</div>
                <span style={{fontSize:9,color:"rgba(255,255,255,0.6)",textAlign:"right"}}>{fmtVN(b.amount)}</span>
                <div style={{textAlign:"center"}}>
                  <span style={{
                    fontSize:9,fontWeight:900,padding:"2px 5px",borderRadius:6,
                    color:b.won?"#44ee88":"#ff5555",
                    background:b.won?"rgba(68,238,136,0.1)":"rgba(255,85,85,0.1)",
                  }}>{b.won?"THẮNG":"THUA"}</span>
                </div>
                <span style={{fontSize:9,fontWeight:900,textAlign:"right",color:b.won?"#FFD700":"rgba(255,255,255,0.25)"}}>
                  {b.won?fmtVN(received):"—"}
                </span>
              </div>
            );
          })}
          {/* Pagination */}
          {totalPages>1&&(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"8px 0 2px",borderTop:"1px solid rgba(139,94,0,0.2)"}}>
              <button onClick={()=>setPage(0)} disabled={curPage===0} style={{...pBtnStyle,opacity:curPage===0?0.3:1}}>«</button>
              <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={curPage===0} style={{...pBtnStyle,opacity:curPage===0?0.3:1}}>‹</button>
              <span style={{fontSize:9,color:"rgba(255,215,0,0.6)",minWidth:56,textAlign:"center"}}>{curPage+1} / {totalPages}</span>
              <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={curPage>=totalPages-1} style={{...pBtnStyle,opacity:curPage>=totalPages-1?0.3:1}}>›</button>
              <button onClick={()=>setPage(totalPages-1)} disabled={curPage>=totalPages-1} style={{...pBtnStyle,opacity:curPage>=totalPages-1?0.3:1}}>»</button>
            </div>
          )}
          </>
        )}
      </div>
    </PopupShell>
  );
}

/* ════════════════════════════════════
   THROWING EFFECT — orbital toss
════════════════════════════════════ */
const SPARK_ANGLES = [0,30,60,90,120,150,180,210,240,270,300,330];
function ThrowingEffect() {
  return (
    <div style={{
      position:"relative", width:110, height:110,
      display:"flex", alignItems:"center", justifyContent:"center",
      overflow:"visible",
    }}>
      {/* 3 expanding ripple rings, staggered */}
      {[0, 295, 590].map((delay, i) => (
        <div key={i} className="throw-ripple" style={{
          position:"absolute",
          width: 68, height: 68,
          borderRadius:"50%",
          border: `${2.2 - i*0.4}px solid rgba(255,${185+i*15},0,${0.9-i*0.25})`,
          animationDelay:`${delay}ms`,
          pointerEvents:"none",
          boxSizing:"border-box",
        }}/>
      ))}

      {/* 12 spark arms radiating outward */}
      {SPARK_ANGLES.map((angle, i) => (
        <div key={i} style={{
          position:"absolute",
          width:"100%", height:"100%",
          transform:`rotate(${angle}deg)`,
          transformOrigin:"50% 50%",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          pointerEvents:"none",
        }}>
          <div className="throw-spark" style={{
            animationDelay:`${(i * 0.043).toFixed(3)}s`,
            animationDuration: i%3===0?"0.52s": i%3===1?"0.46s":"0.58s",
            width:  i%2===0 ? 6 : 4,
            height: i%2===0 ? 6 : 4,
            borderRadius:"50%",
            flexShrink:0,
            background: i%3===0
              ? "radial-gradient(circle,#ffffff 0%,#FFD700 45%,rgba(255,200,0,0))"
              : i%3===1
              ? "radial-gradient(circle,#fff8cc 0%,#FFA500 50%,rgba(255,150,0,0))"
              : "radial-gradient(circle,#ffeeaa 0%,#ff8800 60%,rgba(255,100,0,0))",
            boxShadow: "0 0 5px rgba(255,215,0,0.9)",
          }}/>
        </div>
      ))}

      {/* 3 dice tumbling in the air — each in its own flex-centred layer */}
      {([
        {cls:"dice-toss-0", val:2, sz:30},
        {cls:"dice-toss-1", val:5, sz:28},
        {cls:"dice-toss-2", val:3, sz:26},
      ] as {cls:string;val:number;sz:number}[]).map(({cls,val,sz})=>(
        <div key={cls} style={{
          position:"absolute", top:0, left:0, right:0, bottom:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          pointerEvents:"none", zIndex:2,
        }}>
          <div className={`${cls} throw-glow`} style={{display:"inline-flex"}}>
            <DiceFace val={val} size={sz}/>
          </div>
        </div>
      ))}

      {/* Label */}
      <div style={{
        position:"absolute", bottom:1, left:"50%", transform:"translateX(-50%)",
        color:"rgba(255,215,0,0.92)", fontSize:8, fontWeight:900, letterSpacing:1.5,
        textShadow:"0 0 10px rgba(255,215,0,0.7)", whiteSpace:"nowrap",
        pointerEvents:"none", zIndex:3,
      }}>✦ ĐANG LẮC ✦</div>
    </div>
  );
}

/* ════════════════════════════════════
   MAIN PAGE
════════════════════════════════════ */
export default function TaiXiuPage() {
  const {data:me}=useGetMe();
  const [balance,setBalance]=useState(5_000_000);
  useEffect(()=>{if(me?.balance)setBalance(me.balance);},[me?.balance]);

  const [jackpot,setJackpot]=useState(12_940_706);

  const [phase,setPhase]       = useState<Phase>("BETTING");
  const [countdown,setCountdown] = useState(ROUND);
  const [dice,setDice]         = useState([1,3,4]);
  const [history,setHistory]   = useState<Array<"T"|"X">>("TTXTTXXTXTXTXXTTXXTX".split("") as Array<"T"|"X">);
  const [diceHistory,setDiceHistory] = useState<DiceRecord[]>([]);
  const [betHistory,setBetHistory]   = useState<BetRecord[]>([]);
  const [sessionId,setSessionId]     = useState(6_800_580);
  const sessionIdRef = useRef(6_800_580);
  const [leaderboard,setLeaderboard] = useState<LBEntry[]>([
    {name:"gamechuabipja",totalWin:653_647_661,gamesPlayed:1240,wins:720},
    {name:"utphu0370131",totalWin:564_279_558,gamesPlayed:988,wins:610},
    {name:"utele428245206",totalWin:562_494_080,gamesPlayed:1100,wins:655},
    {name:"letzhihrooksok",totalWin:450_937_278,gamesPlayed:870,wins:490},
    {name:"utienrose283455",totalWin:440_722_346,gamesPlayed:920,wins:510},
    {name:"Bạn",totalWin:0,gamesPlayed:0,wins:0},
  ]);
  const [taiTotal,setTaiTotal] = useState(85_573_572);
  const [xiuTotal,setXiuTotal] = useState(79_243_665);
  const [taiCount,setTaiCount] = useState(226);
  const [xiuCount,setXiuCount] = useState(247);
  const [winStreak,setWinStreak]   = useState(0);
  const [loseStreak,setLoseStreak] = useState(0);
  const [taiBet,setTaiBet]     = useState(0);
  const [xiuBet,setXiuBet]     = useState(0);
  const [chip,setChip]         = useState(0);
  const [popup,setPopup]       = useState<Popup>(null);
  const [winResult,setWinResult] = useState<{won:boolean;amount:number}|null>(null);
  const [justRevealed,setJustRevealed] = useState(false);
  const [handMode,setHandMode] = useState(false);
  const [selectedSide,setSelectedSide] = useState<"TAI"|"XIU"|null>(null);
  const [resultCountdown,setResultCountdown] = useState(15);
  const [jackpotToast,setJackpotToast] = useState<number|null>(null);

  const timerRef       = useRef<ReturnType<typeof setInterval>|null>(null);
  const phaseRef       = useRef<ReturnType<typeof setTimeout>|null>(null);
  const pendingDice    = useRef<number[]>([1,3,4]);
  const hasTouchedBowl = useRef(false);
  const revealedRef    = useRef(false);

  const [focused, setFocused] = useState(false);
  const panelDragging  = useRef(false);
  const panelDragOffset = useRef({x:0,y:0});
  const [panelPos,setPanelPos] = useState<{x:number;y:number}|null>(null);
  const panelRef       = useRef<HTMLDivElement>(null);
  const circleRef      = useRef<HTMLDivElement>(null);

  // Lid (nắp bát) drag state — independent of panel
  const [lidPos,setLidPos] = useState<{x:number;y:number}|null>(null);
  const lidDragging    = useRef(false);
  const lidDragOffset  = useRef({x:0,y:0});
  const lidOrigin      = useRef({x:0,y:0});

  // Keep doResult in a ref to avoid stale closures in timers
  const doResultRef = useRef<()=>void>(()=>{});

  /* ── Responsive layout ── */
  const [winW,setWinW] = useState(()=>window.innerWidth);
  const [winH,setWinH] = useState(()=>window.innerHeight);
  useEffect(()=>{
    const h=()=>{setWinW(window.innerWidth);setWinH(window.innerHeight);setPanelPos(null);};
    window.addEventListener("resize",h);
    window.addEventListener("orientationchange",h);
    return ()=>{window.removeEventListener("resize",h);window.removeEventListener("orientationchange",h);};
  },[]);
  const isMobileLandscape = winW > winH && winH < 600;
  const isMobilePortrait  = winW <= 600;
  const isMobile = isMobileLandscape || isMobilePortrait;
  // szF: scale factor for the panel (CSS transform, 1 = desktop unchanged)
  const szFBase = isMobileLandscape
    ? Math.min((winW * 0.72) / 416, (winH - 20) / 310, 1.6)
    : isMobilePortrait
      ? Math.min((winW - 60) / 416, 1)
      : 1;
  const szF = szFBase * (focused ? 1 : 0.72);

  function getPanelCenter(){
    if(isMobile) return {x:winW/2, y:winH/2};
    return {x:window.innerWidth/2,y:Math.max(window.innerHeight/2-30,300)};
  }
  const pPos = panelPos ?? getPanelCenter();

  /* ── Init lid when THROWING+handMode ── */
  useEffect(()=>{
    if(phase==="THROWING"&&handMode){
      // position the lid over the center circle
      const tryInit=()=>{
        if(circleRef.current){
          const r=circleRef.current.getBoundingClientRect();
          const cx=r.left+r.width/2, cy=r.top+r.height/2;
          setLidPos({x:cx,y:cy});
          lidOrigin.current={x:cx,y:cy};
        } else {
          setTimeout(tryInit,60);
        }
      };
      setTimeout(tryInit,60);
    } else {
      setLidPos(null);
      lidDragging.current=false;
    }
  },[phase,handMode]);

  /* ── Phase logic ── */
  const startRound = useCallback(()=>{
    revealedRef.current=false;
    hasTouchedBowl.current=false;
    const next=sessionIdRef.current+1;
    sessionIdRef.current=next;
    setSessionId(next);
    setPhase("BETTING"); setCountdown(ROUND);
    setTaiBet(0); setXiuBet(0); setWinResult(null);
    setJustRevealed(false); setLidPos(null); setSelectedSide(null); setChip(0);
    setTaiTotal(Math.floor(Math.random()*150_000_000+20_000_000));
    setXiuTotal(Math.floor(Math.random()*150_000_000+20_000_000));
    setTaiCount(randInt(50,300)); setXiuCount(randInt(50,300));
  },[]);

  // Betting countdown
  useEffect(()=>{
    if(phase!=="BETTING") return;
    if(timerRef.current) clearInterval(timerRef.current);
    timerRef.current=setInterval(()=>{
      setCountdown(c=>{
        if(c<=1){
          clearInterval(timerRef.current!);
          pendingDice.current=[randInt(1,6),randInt(1,6),randInt(1,6)];
          setPhase("THROWING");
          return 0;
        }
        return c-1;
      });
    },1000);
    return ()=>{if(timerRef.current)clearInterval(timerRef.current);};
  },[phase]);

  useEffect(()=>{
    if(phase!=="THROWING") return;
    if(handMode) return; // player opens manually — no auto-timer
    phaseRef.current=setTimeout(()=>doResultRef.current(),THROW_MS);
    return ()=>{if(phaseRef.current)clearTimeout(phaseRef.current);};
  },[phase,handMode]);

  useEffect(()=>{
    if(phase!=="RESULT") return;
    setResultCountdown(15);
    let c=15;
    const t=setInterval(()=>{
      c--;
      setResultCountdown(c);
      if(c<=0){clearInterval(t);startRound();}
    },1000);
    return ()=>clearInterval(t);
  },[phase,startRound]);

  /* ── Hand mode: auto-open timer ── */
  useEffect(()=>{
    if(phase!=="THROWING"||!handMode) return;
    hasTouchedBowl.current=false;
    const t=setTimeout(()=>{if(!hasTouchedBowl.current)doResultRef.current();},10_000);
    return ()=>clearTimeout(t);
  },[phase,handMode]);

  function doResult(){
    if(revealedRef.current) return;
    revealedRef.current=true;
    const d=pendingDice.current as [number,number,number];
    setDice(d);
    const sum=d.reduce((a,b)=>a+b,0);
    const isTai=sum>=11;
    const timeStr=new Date().toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
    const sid=sessionIdRef.current;
    setHistory(h=>[isTai?"T":"X",...h.slice(0,19)]);
    setDiceHistory(h=>[{session:sid,dice:d,result:isTai?"T":"X",time:timeStr},...h.slice(0,47)]);
    const tb=taiBet; const xb=xiuBet;
    if(tb>0||xb>0){
      const side:BetRecord["side"]=tb>0?"TAI":"XIU";
      const betAmount=tb+xb; // chỉ đặt 1 cửa nên chỉ 1 số > 0
      const won=isTai?(tb>0):(xb>0);
      const profit=won?Math.floor(betAmount*(PAYOUT-1)):-betAmount;
      setBalance(b=>b+profit);
      if(won) setWinStreak(w=>w+1); else setWinStreak(0);
      if(!won){
        setLoseStreak(l=>l+1);
        // Trích 0.1% tiền thua cộng vào hũ
        const contribution=Math.floor(betAmount*0.001);
        if(contribution>0){
          setJackpot(j=>j+contribution);
          setJackpotToast(contribution);
          setTimeout(()=>setJackpotToast(null),2200);
        }
      } else setLoseStreak(0);
      setWinResult({won,amount:Math.abs(profit)});
      setBetHistory(h=>[{session:sid,side,amount:Math.abs(profit),won,time:timeStr},...h.slice(0,49)]);
      setLeaderboard(lb=>{
        const idx=lb.findIndex(e=>e.name==="Bạn");
        if(idx<0) return lb;
        const updated=[...lb];
        updated[idx]={...updated[idx],gamesPlayed:updated[idx].gamesPlayed+1,wins:updated[idx].wins+(won?1:0),totalWin:updated[idx].totalWin+(won?Math.abs(profit):0)};
        return updated.sort((a,b)=>b.totalWin-a.totalWin);
      });
    }
    setJustRevealed(true);
    setPhase("RESULT");
  }
  // Always keep ref up to date
  doResultRef.current=doResult;

  const sum   = dice.reduce((a,b)=>a+b,0);
  const isTai = sum>=11;
  const myWon = (taiBet>0||xiuBet>0)&&phase==="RESULT"
    ? (isTai?(taiBet-xiuBet):(xiuBet-taiBet))>0
    : null;

  /* ── Global pointer tracking ── */
  useEffect(()=>{
    function onMove(e:MouseEvent|TouchEvent){
      const c="touches" in e?e.touches[0]:e;
      // Lid drag takes priority
      if(lidDragging.current){
        const nx=c.clientX-lidDragOffset.current.x;
        const ny=c.clientY-lidDragOffset.current.y;
        setLidPos({x:nx,y:ny});
        const dx=nx-lidOrigin.current.x, dy=ny-lidOrigin.current.y;
        if(Math.sqrt(dx*dx+dy*dy)>70){
          lidDragging.current=false;
          setLidPos(null);
          doResultRef.current();
        }
        return;
      }
      if(panelDragging.current){
        const rect=panelRef.current?.getBoundingClientRect();
        const hw=rect?rect.width/2:190, hh=rect?rect.height/2:300;
        const x=Math.max(hw,Math.min(window.innerWidth-hw,  c.clientX-panelDragOffset.current.x));
        const y=Math.max(hh,Math.min(window.innerHeight-50, c.clientY-panelDragOffset.current.y));
        setPanelPos({x,y});
      }
    }
    function onEnd(){panelDragging.current=false; lidDragging.current=false;}
    window.addEventListener("mousemove",onMove,{passive:false});
    window.addEventListener("touchmove",onMove,{passive:false});
    window.addEventListener("mouseup",onEnd);
    window.addEventListener("touchend",onEnd);
    return ()=>{
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("touchmove",onMove);
      window.removeEventListener("mouseup",onEnd);
      window.removeEventListener("touchend",onEnd);
    };
  },[]);// eslint-disable-line

  function onPanelDragStart(e:React.MouseEvent|React.TouchEvent){
    if(isMobile) return; // no drag on mobile — panel stays centered
    // Block panel drag while lid is active (table stays fixed in hand mode)
    if(lidPos) return;
    if((e.target as HTMLElement).closest("button,input,select,.bowl-handle")) return;
    panelDragging.current=true;
    const c="touches" in e?e.touches[0]:e;
    panelDragOffset.current={x:c.clientX-pPos.x,y:c.clientY-pPos.y};
    e.preventDefault();
  }

  function onLidDragStart(e:React.MouseEvent|React.TouchEvent){
    if(!lidPos) return;
    if(!hasTouchedBowl.current){
      hasTouchedBowl.current=true;
      // Once player touches bowl → auto-open after 3s if they don't drag
      setTimeout(()=>doResultRef.current(),3000);
    }
    lidDragging.current=true;
    const c="touches" in e?e.touches[0]:e;
    lidDragOffset.current={x:c.clientX-lidPos.x,y:c.clientY-lidPos.y};
    e.stopPropagation();
    e.preventDefault();
  }

  const PANEL_W=416; const PANEL_H=200;
  const iconBtns=[
    {ico:"?",key:"rules" as Popup},{ico:"🏆",key:"leaderboard" as Popup},
    {ico:"📈",key:"soicau" as Popup},{ico:"📋",key:"history" as Popup},
  ];

  /* ── Circle content per phase ── */
  const circleContent = useMemo(()=>{
    if(phase==="BETTING") return (
      <span style={{
        fontSize:countdown<=9?40:33,fontWeight:900,lineHeight:1,fontFamily:"monospace",
        color:countdown<=10?"#ff4444":"#FFD700",
        textShadow:`0 0 18px ${countdown<=10?"rgba(255,68,68,0.9)":"rgba(255,215,0,0.9)"}`,
      }}>{countdown}</span>
    );
    if(phase==="THROWING"&&handMode) return (
      // Hand mode: dice are STILL under the draggable lid (no shake)
      <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
        <div style={{display:"flex",gap:3}}>
          <DiceFace val={pendingDice.current[0]} size={30}/>
          <DiceFace val={pendingDice.current[1]} size={30}/>
        </div>
        <DiceFace val={pendingDice.current[2]} size={30}/>
      </div>
    );
    if(phase==="THROWING") return (
      // Auto mode: large bowl covers entire circle
      <div className="bowl-float" style={{
        position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
      }}>
        <TopBowlSVG size={145}/>
      </div>
    );
    if(phase==="RESULT") return (
      <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"visible"}}>
        {/* 3 actual result dice shown immediately */}
        <DiceTriangle dice={dice} isTai={isTai} sum={sum} noAnim/>
        {/* Bowl lifts away revealing dice */}
        <div className="bowl-lift" style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)"}}>
          <TopBowlSVG size={120}/>
        </div>
      </div>
    );
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[phase, countdown, justRevealed, dice, isTai, sum, handMode]);

  return (
    <div className="fixed inset-0 overflow-hidden select-none" style={{background:"#000"}} onClick={()=>setFocused(false)}>


      {/* ── DRAGGABLE LID (hand mode) — fixed on screen, independent of panel ── */}
      {lidPos&&phase==="THROWING"&&handMode&&(
        <div
          onMouseDown={onLidDragStart}
          onTouchStart={onLidDragStart}
          style={{
            position:"fixed",
            left:lidPos.x, top:lidPos.y,
            transform:"translate(-50%,-50%)",
            zIndex:20, cursor:"grab", touchAction:"none",
            userSelect:"none",
          }}
        >
          <div className="bowl-glow-pulse" style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
            <TopBowlSVG size={135}/>
            <div style={{
              marginTop:2,
              color:"#FFD700",fontSize:9,fontWeight:900,whiteSpace:"nowrap",letterSpacing:1,
              textShadow:"0 0 10px rgba(255,215,0,0.9)",
            }}>✦ KÉO MỞ BÁT ✦</div>
          </div>
        </div>
      )}

      {/* ── DRAGGABLE PANEL — grab anywhere ── */}
      <div
        ref={panelRef}
        onMouseDown={onPanelDragStart}
        onTouchStart={onPanelDragStart}
        onClick={(e)=>{e.stopPropagation();setFocused(true);}}
        style={{
          position:"absolute",left:pPos.x,top:pPos.y,
          transform:`translate(-50%,-50%) scale(${szF})`,
          transformOrigin:"center center",
          transition:"transform 0.3s cubic-bezier(.17,.67,.3,1.2), opacity 0.3s ease",
          opacity: focused ? 1 : 0.45,
          zIndex:10,display:"flex",flexDirection:"column",alignItems:"center",
          cursor:"grab",touchAction:"none",willChange:"left,top",userSelect:"none",
        }}
      >

        {/* ── CASINO TABLE ── */}
        <div style={{position:"relative",width:PANEL_W,height:PANEL_H}}>
          <OvalFrame w={PANEL_W} h={PANEL_H}/>

          <div style={{position:"absolute",inset:12,display:"flex",flexDirection:"column",alignItems:"center",zIndex:1}}>
            <div style={{fontSize:10,color:"rgba(255,215,0,0.5)",marginBottom:2,letterSpacing:1}}>Phiên # {sessionId}</div>

            {/* Phase message */}
            <div style={{fontSize:10,color:"rgba(255,215,0,0.7)",marginBottom:4,minHeight:22,textAlign:"center",lineHeight:1.3}}>
              {phase==="BETTING"&&<span style={{color:"rgba(255,215,0,0.7)"}}>✨ Xin mời đặt cược!</span>}
              {phase==="THROWING"&&<span style={{color:"#FFA500",fontWeight:900}}>⚖️ Đang cân cửa...</span>}
              {phase==="RESULT"&&(
                <div>
                  <span style={{color:isTai?"#ff9999":"#99aaff",fontWeight:700}}>{isTai?"🔴 TÀI":"⚪ XỈU"} — Tổng {sum} điểm</span>
                  <div style={{fontSize:9,color:"rgba(255,215,0,0.45)",marginTop:1}}>còn {resultCountdown}s để bắt đầu phiên mới</div>
                </div>
              )}
            </div>

            {/* TÀI | CIRCLE | XỈU */}
            {(()=>{
              const taiWins = phase==="RESULT" && isTai;
              const xiuWins = phase==="RESULT" && !isTai;
              const canBetTai = xiuBet===0; // chỉ đặt 1 cửa
              const canBetXiu = taiBet===0;
              return (
              <div style={{display:"flex",alignItems:"center",gap:8,width:"100%"}}>
              {/* TÀI */}
              <div style={{
                flex:1,display:"flex",flexDirection:"column",alignItems:"center",
                background:taiWins?"rgba(196,30,58,0.35)":taiBet>0?"rgba(196,30,58,0.15)":"transparent",
                border:"none",
                borderRadius:12,padding:"6px 4px 4px",transition:"all .2s",
                boxShadow:taiWins?"0 0 28px rgba(255,60,60,0.8),0 0 56px rgba(196,30,58,0.55)":taiBet>0?"0 0 14px rgba(255,60,60,0.35)":"none",
              }}>
                <span style={{fontSize:22,fontWeight:900,color:taiWins?"#fff":"#ff9999",fontFamily:"'Arial Black',sans-serif",
                  textShadow:taiWins?"0 0 20px #ff4444,0 0 40px #ff0000,0 2px 8px rgba(0,0,0,0.9)":"0 2px 8px rgba(196,30,58,0.9)",
                  letterSpacing:1,transition:"all .2s"}}>TÀI</span>
                <span style={{fontSize:10,fontWeight:700,color:"rgba(255,165,0,0.7)",letterSpacing:0.5,marginTop:1}}>x{PAYOUT.toFixed(2)}</span>
                <span style={{fontSize:10,fontWeight:700,color:"#FFA500",letterSpacing:0.5}}>{fmtVN(taiTotal)}</span>
                {phase==="BETTING"&&canBetTai&&(
                  <button
                    onClick={()=>setSelectedSide("TAI")}
                    style={{
                      marginTop:4,padding:"3px 12px",borderRadius:20,cursor:"pointer",
                      background:selectedSide==="TAI"
                        ?"linear-gradient(180deg,#ff6666,#C41E3A)"
                        :"linear-gradient(180deg,#5a0010,#3a0008)",
                      border:"none",outline:"none",
                      color:"#fff",fontWeight:900,letterSpacing:0.5,
                      boxShadow:selectedSide==="TAI"?"0 0 12px rgba(255,50,50,0.7),0 0 24px rgba(196,30,58,0.4)":"none",
                      fontSize:10,whiteSpace:"nowrap",transition:"all .2s",
                    }}>
                    {selectedSide==="TAI" ? chip>0 ? fmtVN(chip) : "ĐÃ CHỌN" : "CƯỢC"}
                  </button>
                )}
                {phase==="BETTING"&&!canBetTai&&(
                  <span style={{fontSize:9,color:"rgba(255,100,100,0.4)",marginTop:4,fontStyle:"italic"}}>đã đặt XỈU</span>
                )}
                {taiBet>0&&(
                  <span style={{fontSize:10,color:"#FFD700",fontWeight:700,marginTop:2,
                    textShadow:"0 0 6px rgba(255,215,0,0.6)"}}>
                    {fmtVN(taiBet)}
                  </span>
                )}
              </div>

              <div ref={circleRef}><CenterCircle size={110}>{circleContent}</CenterCircle></div>

              {/* XỈU */}
              <div style={{
                flex:1,display:"flex",flexDirection:"column",alignItems:"center",
                background:xiuWins?"rgba(50,80,200,0.4)":xiuBet>0?"rgba(50,80,200,0.18)":"transparent",
                border:"none",
                borderRadius:12,padding:"6px 4px 4px",transition:"all .2s",
                boxShadow:xiuWins?"0 0 28px rgba(100,130,255,0.8),0 0 56px rgba(50,80,200,0.55)":xiuBet>0?"0 0 14px rgba(100,130,255,0.35)":"none",
              }}>
                <span style={{fontSize:22,fontWeight:900,color:xiuWins?"#fff":"#99aaff",fontFamily:"'Arial Black',sans-serif",
                  textShadow:xiuWins?"0 0 20px #6688ff,0 0 40px #4455ff,0 2px 8px rgba(0,0,0,0.9)":"0 2px 8px rgba(50,80,200,0.8)",
                  letterSpacing:1,transition:"all .2s"}}>XỈU</span>
                <span style={{fontSize:10,fontWeight:700,color:"rgba(255,165,0,0.7)",letterSpacing:0.5,marginTop:1}}>x{PAYOUT.toFixed(2)}</span>
                <span style={{fontSize:10,fontWeight:700,color:"#FFA500",letterSpacing:0.5}}>{fmtVN(xiuTotal)}</span>
                {phase==="BETTING"&&canBetXiu&&(
                  <button
                    onClick={()=>setSelectedSide("XIU")}
                    style={{
                      marginTop:4,padding:"3px 12px",borderRadius:20,cursor:"pointer",
                      background:selectedSide==="XIU"
                        ?"linear-gradient(180deg,#6688ff,#3344cc)"
                        :"linear-gradient(180deg,#0a0a40,#050520)",
                      border:"none",outline:"none",
                      color:"#fff",fontWeight:900,letterSpacing:0.5,
                      boxShadow:selectedSide==="XIU"?"0 0 12px rgba(80,100,255,0.7),0 0 24px rgba(50,80,200,0.4)":"none",
                      fontSize:10,whiteSpace:"nowrap",transition:"all .2s",
                    }}>
                    {selectedSide==="XIU" ? chip>0 ? fmtVN(chip) : "ĐÃ CHỌN" : "CƯỢC"}
                  </button>
                )}
                {phase==="BETTING"&&!canBetXiu&&(
                  <span style={{fontSize:9,color:"rgba(100,130,255,0.4)",marginTop:4,fontStyle:"italic"}}>đã đặt TÀI</span>
                )}
                {xiuBet>0&&(
                  <span style={{fontSize:10,color:"#FFD700",fontWeight:700,marginTop:2,
                    textShadow:"0 0 6px rgba(255,215,0,0.6)"}}>
                    {fmtVN(xiuBet)}
                  </span>
                )}
              </div>
              </div>
              );
            })()}

            {/* History beads */}
            <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"nowrap"}}>
              {history.slice(0,14).map((h,i)=><Bead key={i} val={h}/>)}
            </div>
            {/* Streaks */}
            <div style={{display:"flex",justifyContent:"space-between",width:"100%",marginTop:5,paddingInline:12}}>
              <span style={{fontSize:10,color:"rgba(255,215,0,0.6)"}}>{taiCount} 👤</span>
              <div style={{display:"flex",gap:10}}>
                <span style={{fontSize:9,color:"rgba(255,255,255,0.4)"}}>DÃY THẮNG:<span style={{color:winStreak>0?"#FFD700":"inherit"}}> {winStreak}</span></span>
                <span style={{fontSize:9,color:"rgba(255,255,255,0.4)"}}>DÃY THUA:<span style={{color:loseStreak>0?"#ff4444":"inherit"}}> {loseStreak}</span></span>
              </div>
              <span style={{fontSize:10,color:"rgba(255,215,0,0.6)"}}>{xiuCount} 👤</span>
            </div>
          </div>

          {/* Hand mode toggle — left side */}
          <button
            onClick={()=>{
              setHandMode(prev=>!prev);
            }}
            className="active:scale-90 transition-all"
            title={handMode?"Chế độ tay: BẬT":"Chế độ tay: TẮT"}
            style={{
              position:"absolute",left:-42,top:"50%",transform:"translateY(-50%)",
              width:34,height:34,borderRadius:"50%",cursor:"pointer",
              background:handMode
                ?"linear-gradient(135deg,#FFD700,#c8860a)"
                :"linear-gradient(180deg,#2e1800,#1a0d00)",
              border:`2px solid ${handMode?"#FFD700":"#6b3800"}`,
              boxShadow:handMode?"0 0 14px rgba(255,215,0,0.7)":"0 2px 8px rgba(0,0,0,0.7)",
              color:handMode?"#1a0800":"rgba(255,215,0,0.85)",
              fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",
            }}>🖐️</button>

          {/* Side icon buttons */}
          <div style={{position:"absolute",right:-38,top:"50%",transform:"translateY(-50%)",display:"flex",flexDirection:"column",gap:6}}>
            {iconBtns.map(b=>(
              <button key={b.key} onClick={()=>setPopup(popup===b.key?null:b.key)}
                className="active:scale-90 transition-all"
                style={{width:30,height:30,borderRadius:"50%",cursor:"pointer",
                  background:popup===b.key?"linear-gradient(135deg,#FFD700,#c8860a)":"linear-gradient(180deg,#2e1800,#1a0d00)",
                  border:`2px solid ${popup===b.key?"#FFD700":"#6b3800"}`,
                  boxShadow:"0 2px 8px rgba(0,0,0,0.7)",
                  color:popup===b.key?"#1a0800":"rgba(255,215,0,0.85)",
                  fontSize:13,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",
                }}>{b.ico}</button>
            ))}
          </div>
        </div>

        {/* Chip selector — only visible when a side is selected */}
        {phase==="BETTING"&&selectedSide&&(
          <div style={{width:PANEL_W,marginTop:12}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:8}}>
              {CHIPS.map(c=><ChipBtn key={c.value} label={c.label} selected={false} onClick={()=>setChip(prev=>prev+c.value)}/>)}
            </div>

            {/* Action buttons row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
              {/* XÁC NHẬN CƯỢC */}
              <button
                disabled={!selectedSide}
                onClick={()=>{
                  if(!selectedSide||chip<=0) return;
                  if(selectedSide==="TAI"){setTaiBet(t=>t+chip);setTaiTotal(t=>t+chip);}
                  else{setXiuBet(x=>x+chip);setXiuTotal(x=>x+chip);}
                  setChip(0);
                  setSelectedSide(null);
                }}
                className="active:scale-95 transition-all"
                style={{
                  padding:"9px 4px",borderRadius:12,fontWeight:900,fontSize:11,letterSpacing:0.5,
                  cursor:selectedSide?"pointer":"not-allowed",opacity:selectedSide?1:0.4,
                  background:selectedSide
                    ?"linear-gradient(135deg,#b8860b,#FFD700,#b8860b)"
                    :"linear-gradient(180deg,#2a1e00,#1a1200)",
                  border:`1.5px solid ${selectedSide?"#FFD700":"#4a3800"}`,
                  color:selectedSide?"#1a0800":"rgba(255,215,0,0.4)",
                  boxShadow:selectedSide?"0 0 14px rgba(255,215,0,0.5)":"none",
                }}>XÁC NHẬN CƯỢC</button>

              {/* TẤT TAY — đặt toàn bộ số dư, xác nhận ngay và đóng panel */}
              <button
                onClick={()=>{
                  if(!selectedSide||balance<=0) return;
                  const amt=balance;
                  if(selectedSide==="TAI"){setTaiBet(t=>t+amt);setTaiTotal(t=>t+amt);}
                  else{setXiuBet(x=>x+amt);setXiuTotal(x=>x+amt);}
                  setChip(0);
                  setSelectedSide(null);
                }}
                className="active:scale-95 transition-all"
                style={{
                  padding:"9px 4px",borderRadius:12,fontWeight:900,fontSize:11,letterSpacing:0.5,
                  cursor:"pointer",
                  background:"linear-gradient(135deg,#7a0000,#c41e1e,#7a0000)",
                  border:"1.5px solid #ff4444",
                  color:"#fff",
                  boxShadow:"0 0 14px rgba(196,30,30,0.5)",
                }}>🔥 TẤT TAY</button>
            </div>

            {/* HỦY — đóng bảng chọn tiền (không hoàn cược) */}
            <button onClick={()=>setSelectedSide(null)} className="active:scale-95 transition-all" style={{
              width:"100%",padding:"7px 0",borderRadius:12,fontWeight:900,fontSize:11,letterSpacing:1,cursor:"pointer",
              background:"linear-gradient(180deg,#2a0800,#1a0500)",border:"1.5px solid #5a2000",color:"rgba(255,150,100,0.8)",
              boxShadow:"0 4px 15px rgba(0,0,0,0.6)",
            }}>HỦY</button>
          </div>
        )}

        {/* Balance */}
        <div style={{marginTop:10,fontSize:11,color:"rgba(255,215,0,0.5)"}}>
          Số dư: <span style={{color:"#FFD700",fontWeight:700}}>{fmtVN(balance)}</span> xu
        </div>
      </div>

      {/* ── POPUPS ── */}
      {popup==="rules"&&(
        <PopupShell title="HƯỚNG DẪN CHƠI" onClose={()=>setPopup(null)}>
          <div style={{padding:"12px 16px",fontSize:11,lineHeight:1.7}}>
            {/* Luật chơi */}
            <div style={{marginBottom:12}}>
              <p style={{color:"#FFD700",fontWeight:900,fontSize:12,marginBottom:8,letterSpacing:1}}>⚀ LUẬT CHƠI</p>
              <p style={{color:"rgba(255,255,255,0.55)",marginBottom:6}}>Tài Xỉu sử dụng <span style={{color:"#FFD700"}}>3 viên xúc xắc</span>. Sau khi hết thời gian cược, hệ thống lắc xúc xắc để xác định kết quả.</p>
              <div style={{display:"flex",gap:10,marginTop:8}}>
                <div style={{flex:1,padding:"8px",borderRadius:8,background:"rgba(136,153,255,0.1)",border:"1px solid rgba(136,153,255,0.3)",textAlign:"center"}}>
                  <div style={{fontSize:18,fontWeight:900,color:"#88aaff",marginBottom:3}}>XỈU</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>Tổng điểm từ <span style={{color:"#88aaff",fontWeight:700}}>3 → 10</span></div>
                </div>
                <div style={{flex:1,padding:"8px",borderRadius:8,background:"rgba(255,136,136,0.1)",border:"1px solid rgba(255,136,136,0.3)",textAlign:"center"}}>
                  <div style={{fontSize:18,fontWeight:900,color:"#ff8888",marginBottom:3}}>TÀI</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>Tổng điểm từ <span style={{color:"#ff8888",fontWeight:700}}>11 → 18</span></div>
                </div>
              </div>
              <div style={{marginTop:8,padding:"6px 10px",borderRadius:6,background:"rgba(255,215,0,0.07)",fontSize:10,color:"rgba(255,255,255,0.5)"}}>
                Ví dụ: 5 + 4 + 3 = <span style={{color:"#ff8888",fontWeight:900}}>12 → TÀI</span>
              </div>
            </div>

            <div style={{borderTop:"1px solid rgba(139,94,0,0.3)",paddingTop:10,marginBottom:12}}>
              <p style={{color:"#FFD700",fontWeight:900,fontSize:12,marginBottom:8,letterSpacing:1}}>🎯 CÁCH CHƠI</p>
              {[
                "Chọn số tiền cược bằng các chip.",
                "Chọn cửa TÀI hoặc XỈU rồi nhấn CƯỢC.",
                "Xác nhận đặt cược.",
                "Chờ kết quả và nhận thưởng nếu dự đoán đúng.",
              ].map((step,i)=>(
                <div key={i} style={{display:"flex",gap:8,marginBottom:5,alignItems:"flex-start"}}>
                  <span style={{background:"rgba(255,215,0,0.2)",color:"#FFD700",fontWeight:900,fontSize:9,borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{i+1}</span>
                  <span style={{color:"rgba(255,255,255,0.6)",fontSize:10}}>{step}</span>
                </div>
              ))}
            </div>

            <div style={{borderTop:"1px solid rgba(139,94,0,0.3)",paddingTop:10,marginBottom:12}}>
              <p style={{color:"#FFD700",fontWeight:900,fontSize:12,marginBottom:6,letterSpacing:1}}>⏱ THỜI GIAN PHIÊN</p>
              <p style={{color:"rgba(255,255,255,0.55)",fontSize:10}}>Mỗi phiên kéo dài khoảng <span style={{color:"#FFD700"}}>45 giây</span>. Khi đếm về 0, hệ thống ngừng nhận cược và tiến hành quay kết quả.</p>
            </div>

            <div style={{borderTop:"1px solid rgba(139,94,0,0.3)",paddingTop:10,marginBottom:12}}>
              <p style={{color:"#FFD700",fontWeight:900,fontSize:12,marginBottom:8,letterSpacing:1}}>💰 TRẢ THƯỞNG</p>
              <div style={{padding:"8px 10px",borderRadius:8,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(139,94,0,0.3)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{color:"rgba(255,255,255,0.5)",fontSize:10}}>Cược</span>
                  <span style={{color:"rgba(255,255,255,0.7)",fontSize:10,fontWeight:700}}>100.000 VNĐ</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{color:"rgba(255,255,255,0.5)",fontSize:10}}>Tỷ lệ</span>
                  <span style={{color:"#FFD700",fontSize:10,fontWeight:900}}>x1.95</span>
                </div>
                <div style={{borderTop:"1px solid rgba(139,94,0,0.3)",paddingTop:4,display:"flex",justifyContent:"space-between"}}>
                  <span style={{color:"rgba(255,255,255,0.5)",fontSize:10}}>Nhận về</span>
                  <span style={{color:"#44ee88",fontSize:10,fontWeight:900}}>195.000 VNĐ</span>
                </div>
              </div>
            </div>

            <div style={{borderTop:"1px solid rgba(139,94,0,0.3)",paddingTop:10,marginBottom:8}}>
              <p style={{color:"#FFD700",fontWeight:900,fontSize:12,marginBottom:6,letterSpacing:1}}>🏆 HŨ THƯỞNG</p>
              <p style={{color:"rgba(255,255,255,0.55)",fontSize:10}}>Hũ được tích lũy từ mỗi lượt cược (trích <span style={{color:"#FFD700"}}>0.5%</span>). Khi hũ vượt <span style={{color:"#FFD700"}}>500 triệu</span>, sẽ nổ ngẫu nhiên và thưởng toàn bộ cho người thắng ván đó.</p>
            </div>

            <div style={{borderTop:"1px solid rgba(139,94,0,0.3)",paddingTop:8}}>
              <p style={{color:"rgba(255,215,0,0.4)",fontSize:9,lineHeight:1.6}}>⚠ Mỗi phiên là độc lập. Kết quả được xác định ngẫu nhiên. Chơi có trách nhiệm và quản lý vốn hợp lý.</p>
            </div>
          </div>
        </PopupShell>
      )}
      {popup==="leaderboard"&&(
        <PopupShell title="BẢNG XẾP HẠNG" onClose={()=>setPopup(null)}>
          <div>
            {/* Header */}
            <div style={{display:"grid",gridTemplateColumns:"32px 1fr 76px 52px 46px",padding:"5px 10px",fontSize:9,fontWeight:900,color:"rgba(255,215,0,0.5)",borderBottom:"1px solid rgba(139,94,0,0.25)",gap:3}}>
              <span>#</span><span>TÊN</span><span style={{textAlign:"right"}}>TỔNG THẮNG</span><span style={{textAlign:"right"}}>VÁN</span><span style={{textAlign:"right"}}>TỶ LỆ</span>
            </div>
            {leaderboard.map((p,i)=>{
              const crowns=["👑","🥈","🥉"];
              const winRate=p.gamesPlayed>0?Math.round(p.wins/p.gamesPlayed*100):0;
              const isMe=p.name==="Bạn";
              return (
                <div key={p.name} style={{display:"grid",gridTemplateColumns:"32px 1fr 76px 52px 46px",padding:"7px 10px",gap:3,borderBottom:"1px solid rgba(255,255,255,0.04)",background:isMe?"rgba(255,215,0,0.1)":i<3?`rgba(255,215,0,${0.07-i*0.02})`:"transparent",alignItems:"center"}}>
                  <span style={{fontSize:12,color:i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":isMe?"#FFD700":"rgba(255,255,255,0.4)",fontWeight:900}}>{crowns[i]||`#${i+1}`}</span>
                  <span style={{fontSize:10,color:isMe?"#FFD700":"rgba(255,255,255,0.75)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:isMe?900:400}}>{p.name}</span>
                  <span style={{fontSize:10,color:"#FFA500",textAlign:"right"}}>{fmtVN(p.totalWin)}</span>
                  <span style={{fontSize:10,color:"rgba(255,255,255,0.5)",textAlign:"right"}}>{p.gamesPlayed}</span>
                  <span style={{fontSize:10,color:winRate>=50?"#44ff88":"#ff6666",textAlign:"right"}}>{winRate}%</span>
                </div>
              );
            })}
            {/* Tỷ lệ & Nổ hũ */}
            <div style={{padding:"10px 12px",borderTop:"1px solid rgba(139,94,0,0.25)",marginTop:4}}>
              <div style={{fontSize:9,color:"rgba(255,215,0,0.7)",fontWeight:900,marginBottom:4}}>📊 TỶ LỆ & NỔ HŨ</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",lineHeight:1.8}}>
                • Thắng 1 cửa (TÀI/XỈU): nhận <span style={{color:"#FFD700"}}>x1.95</span> số tiền cược<br/>
                • Tỷ lệ thắng lý thuyết: <span style={{color:"#FFD700"}}>48.6%</span> mỗi cửa<br/>
                • Nổ hũ: mỗi ván trích <span style={{color:"#FFD700"}}>0.5%</span> tổng cược vào hũ.<br/>
                  &nbsp;&nbsp;Hũ nổ ngẫu nhiên khi &gt; 500 triệu, thưởng toàn bộ<br/>
                  &nbsp;&nbsp;cho người thắng ván đó.
              </div>
            </div>
          </div>
        </PopupShell>
      )}
      {popup==="soicau"&&(
        <SoiCauPopup history={diceHistory} onClose={()=>setPopup(null)}/>
      )}
      {popup==="history"&&(
        <HistoryPopup history={betHistory} onClose={()=>setPopup(null)}/>
      )}
    </div>
  );
}
