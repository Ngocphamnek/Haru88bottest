import { useGetMe } from "@workspace/api-client-react";

function fmtVN(n: number) { return n.toLocaleString("vi-VN"); }

const VIP_LABELS = ["Thường", "Bạc", "Vàng", "Kim Cương", "VIP", "SVIP"];
const VIP_COLORS = ["#9ca3af", "#C0C0C0", "#FFD700", "#60a5fa", "#a855f7", "#C41E3A"];

const RECENT_GAMES = [
  { game: "Tài Xỉu", result: "win", amount: 50000, time: "10 phút trước" },
  { game: "Tài Xỉu", result: "loss", amount: -10000, time: "25 phút trước" },
  { game: "Bầu Cua", result: "win", amount: 100000, time: "1 giờ trước" },
  { game: "Phé Lá", result: "loss", amount: -50000, time: "2 giờ trước" },
  { game: "Tài Xỉu", result: "win", amount: 200000, time: "3 giờ trước" },
];

export default function ProfilePage() {
  const { data: me } = useGetMe();
  if (!me) return <div className="flex items-center justify-center min-h-screen bg-[#0D0D0D] text-white/40 text-sm">Đang tải...</div>;

  const vipColor = VIP_COLORS[me.vipLevel] ?? VIP_COLORS[0];
  const vipLabel = VIP_LABELS[me.vipLevel] ?? "Thường";
  const totalGames = me.wins + me.losses;
  const winRatePct = totalGames > 0 ? Math.round(me.winRate * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0D0D]">
      <div className="px-4 pt-6 pb-4" style={{ background: "linear-gradient(180deg,#1a0a00,#0D0D0D)" }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black flex-shrink-0"
            style={{ background: `linear-gradient(135deg,${vipColor}60,${vipColor}30)`, border: `2px solid ${vipColor}`, boxShadow: `0 0 20px ${vipColor}40` }}>
            {me.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-white">{me.username}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${vipColor}30`, color: vipColor, border: `1px solid ${vipColor}60` }}>
                {vipLabel}
              </span>
              <span className="text-xs text-white/40">Cấp {me.level}</span>
            </div>
            <p className="text-xs text-white/30 mt-1">Tham gia {new Date(me.joinedAt).toLocaleDateString("vi-VN")}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-xl p-3" style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.15)" }}>
            <p className="text-[10px] text-white/40">Số dư</p>
            <p className="text-base font-black text-[#FFD700]">{fmtVN(me.balance)}</p>
            <p className="text-[9px] text-white/30">xu</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}>
            <p className="text-[10px] text-white/40">Vàng</p>
            <p className="text-base font-black text-purple-400">{fmtVN(me.goldCoins)}</p>
            <p className="text-[9px] text-white/30">gold coins</p>
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-xs text-white/40 mb-3">Thống kê</p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="text-lg font-black text-[#22c55e]">{me.wins}</p>
              <p className="text-[10px] text-white/40">Thắng</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-[#C41E3A]">{me.losses}</p>
              <p className="text-[10px] text-white/40">Thua</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-[#FFD700]">{winRatePct}%</p>
              <p className="text-[10px] text-white/40">Tỷ lệ</p>
            </div>
          </div>
          <div className="w-full rounded-full overflow-hidden h-2" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${winRatePct}%`, background: "linear-gradient(90deg,#C41E3A,#FFD700,#22c55e)" }} />
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <p className="text-sm font-bold text-white/60 mb-2">Ván gần nhất</p>
        <div className="flex flex-col gap-2">
          {RECENT_GAMES.map((g, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                style={{ background: g.result === "win" ? "rgba(34,197,94,0.15)" : "rgba(196,30,58,0.15)" }}>
                {g.result === "win" ? "✓" : "✗"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{g.game}</p>
                <p className="text-[10px] text-white/40">{g.time}</p>
              </div>
              <p className="text-sm font-bold" style={{ color: g.result === "win" ? "#22c55e" : "#C41E3A" }}>
                {g.amount > 0 ? "+" : ""}{fmtVN(g.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
