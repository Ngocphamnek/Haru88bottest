import { useState } from "react";
import { Link } from "wouter";
import { useGetLobbyStats, useGetFeaturedRooms, useListRooms, useListGames } from "@workspace/api-client-react";

function fmtVN(n: number) { return n.toLocaleString("vi-VN"); }

const GAME_ICONS: Record<string, string> = {
  taixiu: "🎲", baucua: "🦀", phela: "🃏", poker: "♠", tienlen: "🂡",
};
const GAME_LABELS: Record<string, string> = {
  taixiu: "Tài Xỉu", baucua: "Bầu Cua", phela: "Phé Lá", poker: "Poker", tienlen: "Tiến Lên",
};
const STATUS_COLOR: Record<string, string> = {
  waiting: "#22c55e", playing: "#FFD700", full: "#C41E3A",
};
const STATUS_LABEL: Record<string, string> = {
  waiting: "Chờ", playing: "Đang chơi", full: "Đầy",
};

type GameFilter = "all" | "taixiu" | "baucua" | "phela" | "poker" | "tienlen";

export default function LobbyPage() {
  const [filter, setFilter] = useState<GameFilter>("all");
  const { data: stats } = useGetLobbyStats();
  const { data: featured } = useGetFeaturedRooms();
  const { data: rooms } = useListRooms(filter !== "all" ? { gameType: filter } : {});
  const { data: games } = useListGames();

  const filters: { key: GameFilter; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "taixiu", label: "Tài Xỉu" },
    { key: "baucua", label: "Bầu Cua" },
    { key: "phela", label: "Phé Lá" },
    { key: "poker", label: "Poker" },
    { key: "tienlen", label: "Tiến Lên" },
  ];

  return (
    <div className="flex flex-col bg-[#0D0D0D] min-h-screen">
      {/* Header */}
      <div className="px-4 pt-5 pb-3"
        style={{ background: "linear-gradient(180deg, #1a0a00 0%, #0D0D0D 100%)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-[#FFD700]" style={{ textShadow: "0 0 15px rgba(255,215,0,0.5)" }}>
              PheLa86
            </h1>
            <p className="text-xs text-white/40">Sảnh chơi game</p>
          </div>
          <div className="rounded-xl px-3 py-1.5 text-right"
            style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)" }}>
            <p className="text-[10px] text-white/50">Đang online</p>
            <p className="text-sm font-bold text-[#FFD700]">{fmtVN(stats?.onlinePlayers ?? 247)}</p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-2 mb-1">
          {[
            { label: "Phòng đang chơi", value: stats?.activeRooms ?? 32 },
            { label: "Ván hôm nay", value: fmtVN(stats?.totalGamesToday ?? 3847) },
            { label: "Jackpot", value: fmtVN(stats?.jackpotTotal ?? 98500000) + " xu" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg p-2 text-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[9px] text-white/40 leading-tight">{label}</p>
              <p className="text-xs font-bold text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Game type cards */}
      {games && games.length > 0 && (
        <div className="px-4 mb-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {games.map(g => (
              <Link key={g.id} to={g.id === "taixiu" ? "/game/taixiu" : "/"}>
                <div className="flex-shrink-0 w-24 rounded-xl p-3 text-center transition-transform active:scale-95"
                  style={{ background: "linear-gradient(135deg, #1a1a1a, #111)", border: "1px solid rgba(255,215,0,0.15)" }}>
                  <div className="text-2xl mb-1">{GAME_ICONS[g.id] ?? "🎮"}</div>
                  <p className="text-xs font-bold text-white">{g.displayName}</p>
                  <p className="text-[10px] text-white/40">{g.activeRooms} phòng</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Hot rooms */}
      {featured && featured.length > 0 && (
        <div className="px-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-white">Phòng nổi bật</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full text-black font-bold"
              style={{ background: "#FFD700" }}>HOT</span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {featured.slice(0, 3).map(r => (
              <div key={r.id} className="flex-shrink-0 w-44 rounded-xl p-3"
                style={{ background: "linear-gradient(135deg, #1a0800, #0f0f0f)", border: "1px solid rgba(196,30,58,0.3)", boxShadow: "0 0 12px rgba(196,30,58,0.1)" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{r.name}</span>
                  {r.isVip && <span className="text-[9px] px-1.5 py-0.5 rounded text-black font-bold" style={{ background: "#FFD700" }}>VIP</span>}
                </div>
                <p className="text-[10px] text-white/50 mb-2">{GAME_LABELS[r.gameType] ?? r.gameType}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">{r.playerCount}/{r.maxPlayers} người</span>
                  <span className="text-[10px] font-bold" style={{ color: STATUS_COLOR[r.status] }}>{STATUS_LABEL[r.status]}</span>
                </div>
                <p className="text-[10px] text-[#FFD700] mt-1">{fmtVN(r.minBet)} — {fmtVN(r.maxBet)} xu</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="px-4 mb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: filter === key ? "#FFD700" : "rgba(255,255,255,0.07)",
                color: filter === key ? "#000" : "rgba(255,255,255,0.6)",
                border: filter === key ? "none" : "1px solid rgba(255,255,255,0.1)",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Room list */}
      <div className="px-4 flex flex-col gap-2 pb-4">
        <p className="text-xs text-white/40">{rooms?.length ?? 0} phòng</p>
        {(rooms ?? []).map(r => (
          <div key={r.id} className="rounded-xl p-3 flex items-center gap-3 transition-all active:scale-98"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: r.isVip ? "linear-gradient(135deg,#8B6914,#FFD700)" : "rgba(255,255,255,0.08)" }}>
              {GAME_ICONS[r.gameType] ?? "🎮"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm font-bold text-white truncate">{r.name}</span>
                {r.isHot && <span className="text-[9px] px-1.5 py-0.5 rounded text-black font-bold flex-shrink-0" style={{ background: "#C41E3A", color: "white" }}>HOT</span>}
                {r.isVip && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0" style={{ background: "#FFD700", color: "#000" }}>VIP</span>}
                {r.hasPassword && <span className="text-[10px] text-white/30">🔒</span>}
              </div>
              <p className="text-[11px] text-white/40">{GAME_LABELS[r.gameType] ?? r.gameType} · {fmtVN(r.minBet)}–{fmtVN(r.maxBet)} xu</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-bold" style={{ color: STATUS_COLOR[r.status] }}>{STATUS_LABEL[r.status]}</p>
              <p className="text-[10px] text-white/40">{r.playerCount}/{r.maxPlayers}</p>
            </div>
          </div>
        ))}
        {(!rooms || rooms.length === 0) && (
          <div className="text-center py-10 text-white/30 text-sm">Không có phòng nào</div>
        )}
      </div>
    </div>
  );
}
