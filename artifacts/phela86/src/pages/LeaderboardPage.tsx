import { useState } from "react";
import { useGetLeaderboard, useGetLeaderboardSummary } from "@workspace/api-client-react";

function fmtVN(n: number) { return n.toLocaleString("vi-VN"); }

type Period = "daily" | "weekly" | "monthly" | "alltime";

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const { data: entries } = useGetLeaderboard({ period });
  const { data: summary } = useGetLeaderboardSummary();

  const tabs: { key: Period; label: string }[] = [
    { key: "daily", label: "Hôm nay" },
    { key: "weekly", label: "Tuần" },
    { key: "monthly", label: "Tháng" },
    { key: "alltime", label: "Tất cả" },
  ];

  const top3 = entries?.slice(0, 3) ?? [];
  const rest = entries?.slice(3) ?? [];

  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumHeights = ["h-20", "h-28", "h-16"];
  const podiumRanks = [2, 1, 3];
  const podiumColors = ["#C0C0C0", "#FFD700", "#CD7F32"];
  const podiumCrowns = ["🥈", "👑", "🥉"];

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0D0D]">
      <div className="px-4 pt-5 pb-3" style={{ background: "linear-gradient(180deg,#1a0a00,#0D0D0D)" }}>
        <h1 className="text-xl font-black text-[#FFD700] mb-1" style={{ textShadow: "0 0 12px rgba(255,215,0,0.5)" }}>Bảng Xếp Hạng</h1>
        {summary && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg p-2" style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.15)" }}>
              <p className="text-[10px] text-white/40">Thắng lớn nhất</p>
              <p className="text-sm font-bold text-[#FFD700]">{fmtVN(summary.biggestWin)} xu</p>
            </div>
            <div className="rounded-lg p-2" style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.15)" }}>
              <p className="text-[10px] text-white/40">Người chơi hàng đầu</p>
              <p className="text-sm font-bold text-white truncate">{summary.topPlayer}</p>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setPeriod(key)}
              className="px-3 py-1 rounded-full text-xs font-bold transition-all"
              style={{ background: period === key ? "#FFD700" : "rgba(255,255,255,0.07)", color: period === key ? "#000" : "rgba(255,255,255,0.5)" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {top3.length > 0 && (
        <div className="px-4 py-4 flex justify-center items-end gap-3 mb-2">
          {podiumOrder.map((entry, idx) => entry && (
            <div key={entry.playerId} className="flex flex-col items-center">
              <span className="text-xl mb-1">{podiumCrowns[idx]}</span>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black mb-1"
                style={{ background: `linear-gradient(135deg,${podiumColors[idx]}80,${podiumColors[idx]})`, border: `2px solid ${podiumColors[idx]}` }}>
                {entry.username.charAt(0).toUpperCase()}
              </div>
              <p className="text-[10px] text-white font-bold text-center max-w-[60px] truncate">{entry.username}</p>
              <p className="text-[9px] text-white/40">{fmtVN(entry.totalWinnings)} xu</p>
              <div className={`${podiumHeights[idx]} w-16 rounded-t-lg mt-1 flex items-center justify-center`}
                style={{ background: `linear-gradient(180deg,${podiumColors[idx]}60,${podiumColors[idx]}30)`, border: `1px solid ${podiumColors[idx]}40` }}>
                <span className="text-lg font-black" style={{ color: podiumColors[idx] }}>#{podiumRanks[idx]}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="px-4 flex flex-col gap-2 pb-4">
        {rest.map(entry => (
          <div key={entry.playerId} className="flex items-center gap-3 rounded-xl p-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="w-6 text-center text-sm font-bold text-white/40">#{entry.rank}</span>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              {entry.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{entry.username}</p>
              <p className="text-[10px] text-white/40">Lv.{entry.level} · {entry.gamesPlayed} ván</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-[#FFD700]">{fmtVN(entry.totalWinnings)}</p>
              <p className="text-[10px] text-white/40">{Math.round(entry.winRate * 100)}% thắng</p>
            </div>
          </div>
        ))}
        {(!entries || entries.length === 0) && (
          <div className="text-center py-10 text-white/30 text-sm">Chưa có dữ liệu</div>
        )}
      </div>
    </div>
  );
}
