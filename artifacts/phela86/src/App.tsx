import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import LobbyPage from "@/pages/LobbyPage";
import TaiXiuPage from "@/pages/TaiXiuPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import WalletPage from "@/pages/WalletPage";
import ProfilePage from "@/pages/ProfilePage";

const queryClient = new QueryClient();

function useIsMobilePortrait() {
  const check = () =>
    window.innerWidth < 1024 && window.innerHeight > window.innerWidth;
  const [portrait, setPortrait] = useState(check);
  useEffect(() => {
    const handler = () => setPortrait(check());
    window.addEventListener("resize", handler);
    window.addEventListener("orientationchange", handler);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("orientationchange", handler);
    };
  }, []);
  return portrait;
}

function RotatePrompt() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0D0D0D]">
      <div className="flex flex-col items-center gap-6 px-8 text-center">
        <div style={{ animation: "rotateHint 2s ease-in-out infinite" }}>
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5">
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <circle cx="12" cy="17" r="1" fill="#FFD700" />
          </svg>
        </div>
        <p className="text-white text-lg font-bold">Xoay ngang điện thoại</p>
        <p className="text-white/50 text-sm">để có trải nghiệm chơi tốt nhất</p>
      </div>
      <style>{`
        @keyframes rotateHint {
          0%,100% { transform: rotate(0deg); }
          30%      { transform: rotate(90deg); }
          70%      { transform: rotate(90deg); }
        }
      `}</style>
    </div>
  );
}

function BottomNav() {
  const [loc] = useLocation();
  const items = [
    { to: "/", label: "Sảnh", icon: HomeIcon },
    { to: "/game/taixiu", label: "Tài Xỉu", icon: DiceIcon },
    { to: "/leaderboard", label: "BXH", icon: TrophyIcon },
    { to: "/wallet", label: "Ví", icon: WalletIcon },
    { to: "/profile", label: "Tôi", icon: UserIcon },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0D0D0D]">
      <div className="flex">
        {items.map(({ to, label, icon: Icon }) => {
          const active = loc === to || (to !== "/" && loc.startsWith(to));
          return (
            <Link key={to} to={to} className="flex-1">
              <div className={`flex flex-col items-center py-2 gap-0.5 transition-colors ${active ? "text-[#FFD700]" : "text-white/40"}`}>
                <Icon active={active} />
                <span className="text-[10px] font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#FFD700" : "none"} stroke={active ? "#FFD700" : "currentColor"} strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function DiceIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#FFD700" : "currentColor"} strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="3" />
      <circle cx="8" cy="8" r="1.5" fill={active ? "#FFD700" : "currentColor"} />
      <circle cx="16" cy="8" r="1.5" fill={active ? "#FFD700" : "currentColor"} />
      <circle cx="12" cy="12" r="1.5" fill={active ? "#FFD700" : "currentColor"} />
      <circle cx="8" cy="16" r="1.5" fill={active ? "#FFD700" : "currentColor"} />
      <circle cx="16" cy="16" r="1.5" fill={active ? "#FFD700" : "currentColor"} />
    </svg>
  );
}
function TrophyIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#FFD700" : "currentColor"} strokeWidth="2">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  );
}
function WalletIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#FFD700" : "currentColor"} strokeWidth="2">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}
function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#FFD700" : "currentColor"} strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function Router() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-16">
      <Switch>
        <Route path="/" component={LobbyPage} />
        <Route path="/game/taixiu" component={TaiXiuPage} />
        <Route path="/leaderboard" component={LeaderboardPage} />
        <Route path="/wallet" component={WalletPage} />
        <Route path="/profile" component={ProfilePage} />
      </Switch>
      <BottomNav />
    </div>
  );
}

export default function App() {
  const isMobilePortrait = useIsMobilePortrait();
  return (
    <QueryClientProvider client={queryClient}>
      {isMobilePortrait && <RotatePrompt />}
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
        <Toaster />
      </WouterRouter>
    </QueryClientProvider>
  );
}
