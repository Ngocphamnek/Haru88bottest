import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import TaiXiuPage from "@/pages/TaiXiuPage";

const queryClient = new QueryClient();

function ForceLandscape({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({ isPortrait: false, isMobile: false, w: 0, h: 0 });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w < 1024 && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
      setState({ isPortrait: mobile && h > w, isMobile: mobile, w, h });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  if (!state.isMobile || !state.isPortrait) return <>{children}</>;

  const { w, h } = state;
  return (
    <div style={{ width: w, height: h, overflow: "hidden", position: "fixed", top: 0, left: 0 }}>
      <div style={{
        width: h, height: w,
        transform: `rotate(90deg) translateX(${(h - w) / 2}px) translateY(${(w - h) / 2}px)`,
        transformOrigin: "center center",
        position: "absolute", top: 0, left: 0, overflow: "hidden",
      }}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ForceLandscape>
        <TaiXiuPage />
        <Toaster />
      </ForceLandscape>
    </QueryClientProvider>
  );
}
