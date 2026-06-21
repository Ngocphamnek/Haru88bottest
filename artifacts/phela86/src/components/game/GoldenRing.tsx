import type { ReactNode } from "react";

interface GoldenRingProps {
  value: number;
  max: number;
  size?: number;
  children?: ReactNode;
  dimmed?: boolean;
}

export function GoldenRing({ value, max, size = 116, children, dimmed = false }: GoldenRingProps) {
  const stroke = 7;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const progress = Math.max(0, Math.min(1, value / max));
  const dashOffset = circ * (1 - progress);
  const cx = size / 2;

  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      {/* Outer glow ring */}
      <div style={{
        position:"absolute", inset:-3, borderRadius:"50%",
        boxShadow:dimmed
          ?"none"
          :`0 0 18px rgba(255,180,0,${0.3 + progress * 0.4}), 0 0 36px rgba(255,80,0,${0.15 + progress * 0.2})`,
        transition:"box-shadow 1s",
        pointerEvents:"none",
      }}/>
      <svg width={size} height={size} style={{ position:"absolute", top:0, left:0, transform:"rotate(-90deg)" }}>
        <defs>
          <linearGradient id="haru-ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#8B4513"/>
            <stop offset="35%"  stopColor="#FFD700"/>
            <stop offset="65%"  stopColor="#FFA500"/>
            <stop offset="100%" stopColor="#cc6600"/>
          </linearGradient>
          <linearGradient id="haru-ring-low" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#8B0000"/>
            <stop offset="50%"  stopColor="#ff2222"/>
            <stop offset="100%" stopColor="#8B0000"/>
          </linearGradient>
          <filter id="ring-glow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx={cx} cy={cx} r={r} fill="none"
          stroke="rgba(60,20,0,0.5)" strokeWidth={stroke + 2}/>
        {/* Progress arc */}
        {!dimmed && (
          <circle cx={cx} cy={cx} r={r} fill="none"
            stroke={value <= 10 ? "url(#haru-ring-low)" : "url(#haru-ring-grad)"}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            filter="url(#ring-glow)"
            style={{ transition:"stroke-dashoffset 1s linear, stroke 0.3s" }}
          />
        )}
        {/* Inner border circle */}
        <circle cx={cx} cy={cx} r={r - stroke / 2 - 2} fill="none"
          stroke="rgba(255,215,0,0.1)" strokeWidth={0.5}/>
        <circle cx={cx} cy={cx} r={r + stroke / 2 + 2} fill="none"
          stroke="rgba(255,215,0,0.08)" strokeWidth={0.5}/>
      </svg>
      {/* Inner fill */}
      <div style={{
        position:"absolute",
        top:stroke + 2, left:stroke + 2, right:stroke + 2, bottom:stroke + 2,
        borderRadius:"50%",
        background:"radial-gradient(circle at 38% 38%, rgba(80,10,0,0.9), rgba(10,0,0,0.97))",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      }}>
        {children}
      </div>
    </div>
  );
}
