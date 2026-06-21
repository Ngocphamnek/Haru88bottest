import { useState } from "react";
import { useGetMe, useListTransactions, useCreateTransaction, getGetMeQueryKey, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

function fmtVN(n: number) { return n.toLocaleString("vi-VN"); }

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

const TYPE_LABEL: Record<string, string> = { deposit: "Nạp xu", withdrawal: "Rút xu", win: "Thắng", loss: "Thua", bonus: "Thưởng" };
const TYPE_COLOR: Record<string, string> = { deposit: "#22c55e", withdrawal: "#C41E3A", win: "#FFD700", loss: "#C41E3A", bonus: "#a855f7" };
const TYPE_SIGN: Record<string, string> = { deposit: "+", withdrawal: "-", win: "+", loss: "-", bonus: "+" };

export default function WalletPage() {
  const qc = useQueryClient();
  const { data: me } = useGetMe();
  const { data: txs } = useListTransactions();
  const createTx = useCreateTransaction();
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState(100000);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (loading) return;
    setLoading(true);
    createTx.mutate({ data: { type: tab === "deposit" ? "deposit" : "withdrawal", amount } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
        qc.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        setLoading(false);
      },
      onError: () => setLoading(false),
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0D0D]">
      <div className="px-4 pt-5 pb-4" style={{ background: "linear-gradient(180deg,#1a0a00,#0D0D0D)" }}>
        <h1 className="text-xl font-black text-[#FFD700] mb-3" style={{ textShadow: "0 0 12px rgba(255,215,0,0.5)" }}>Ví của tôi</h1>
        <div className="rounded-2xl p-4 mb-3" style={{ background: "linear-gradient(135deg,#1a1200,#2a1f00)", border: "1px solid rgba(255,215,0,0.3)", boxShadow: "0 0 25px rgba(255,215,0,0.1)" }}>
          <p className="text-xs text-white/50 mb-1">Số dư hiện tại</p>
          <p className="text-3xl font-black text-[#FFD700]" style={{ textShadow: "0 0 15px rgba(255,215,0,0.5)" }}>
            {fmtVN(me?.balance ?? 5000000)}
          </p>
          <p className="text-xs text-white/40 mt-0.5">xu</p>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
            <span className="text-xs text-white/40">Vàng:</span>
            <span className="text-sm font-bold text-yellow-400">{fmtVN(me?.goldCoins ?? 1200)} 🌟</span>
          </div>
        </div>

        <div className="flex rounded-xl overflow-hidden border border-white/10 mb-4">
          {(["deposit", "withdraw"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className="flex-1 py-2.5 text-sm font-bold transition-all"
              style={{ background: tab === t ? "#FFD700" : "transparent", color: tab === t ? "#000" : "rgba(255,255,255,0.5)" }}>
              {t === "deposit" ? "Nạp xu" : "Rút xu"}
            </button>
          ))}
        </div>

        <p className="text-xs text-white/40 mb-2">Chọn số tiền</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {QUICK_AMOUNTS.map(v => (
            <button key={v} onClick={() => setAmount(v)}
              className="py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{
                background: amount === v ? "linear-gradient(135deg,#FFD700,#FFA500)" : "rgba(255,255,255,0.07)",
                color: amount === v ? "#000" : "#fff",
                border: amount === v ? "none" : "1px solid rgba(255,255,255,0.1)",
              }}>
              {fmtVN(v)}
            </button>
          ))}
        </div>

        <div className="text-center mb-3 text-sm text-white/60">Số tiền: <span className="text-[#FFD700] font-bold">{fmtVN(amount)} xu</span></div>

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3.5 rounded-2xl font-black text-base transition-all active:scale-98 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#FFD700,#FFA500)", color: "#000", boxShadow: "0 0 20px rgba(255,215,0,0.4)" }}>
          {loading ? "Đang xử lý..." : tab === "deposit" ? "Nạp xu ngay" : "Rút xu"}
        </button>
      </div>

      <div className="px-4 flex flex-col gap-2 pb-4">
        <p className="text-sm font-bold text-white/60 mb-1">Lịch sử giao dịch</p>
        {(txs ?? []).map(tx => (
          <div key={tx.id} className="flex items-center gap-3 rounded-xl p-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: `${TYPE_COLOR[tx.type]}20`, border: `1px solid ${TYPE_COLOR[tx.type]}40` }}>
              <span className="text-base font-black" style={{ color: TYPE_COLOR[tx.type] }}>{TYPE_SIGN[tx.type]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{TYPE_LABEL[tx.type] ?? tx.type}</p>
              <p className="text-[10px] text-white/40 truncate">{tx.description}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold" style={{ color: TYPE_COLOR[tx.type] }}>
                {TYPE_SIGN[tx.type]}{fmtVN(tx.amount)}
              </p>
              <p className="text-[10px] text-white/30">
                {new Date(tx.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
        ))}
        {(!txs || txs.length === 0) && (
          <div className="text-center py-8 text-white/30 text-sm">Chưa có giao dịch nào</div>
        )}
      </div>
    </div>
  );
}
