import { useEffect, useRef } from "react";
import dragonImg from "@assets/image_1781851554063.png";

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; type: "ember"|"smoke";
}

export function DragonFireBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    const particles: Particle[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function spawn() {
      if (!canvas) return;
      const cx = canvas.width * (0.25 + Math.random() * 0.5);
      const cy = canvas.height * (0.35 + Math.random() * 0.2);
      particles.push({
        x: cx, y: cy,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 2.5 + 0.5),
        life: 0, maxLife: 55 + Math.random() * 80,
        size: Math.random() * 2.5 + 0.5,
        type: Math.random() > 0.65 ? "smoke" : "ember",
      });
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 4; i++) spawn();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx + Math.sin(p.life * 0.08) * 0.6;
        p.y += p.vy;
        p.vy -= 0.025;
        p.life++;
        if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }
        const t = p.life / p.maxLife;
        const alpha = t < 0.15 ? t / 0.15 : 1 - t;

        if (p.type === "ember") {
          const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
          gr.addColorStop(0, `rgba(255,245,180,${alpha})`);
          gr.addColorStop(0.4, `rgba(255,120,0,${alpha * 0.75})`);
          gr.addColorStop(1, `rgba(180,0,0,0)`);
          ctx.fillStyle = gr;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(60,0,0,${alpha * 0.12})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      {/* Dragon background image */}
      <img src={dragonImg} alt="" style={{
        position:"absolute", top:0, left:0,
        width:"100%", height:"55%",
        objectFit:"cover", objectPosition:"center top",
        opacity:0.88, pointerEvents:"none", zIndex:0,
      }}/>
      {/* Dark gradient overlay */}
      <div style={{
        position:"absolute", inset:0, zIndex:1, pointerEvents:"none",
        background:"linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.1) 20%, rgba(0,0,0,0.65) 48%, rgba(0,0,0,0.95) 65%, #050001 82%)",
      }}/>
      {/* Side vignette */}
      <div style={{
        position:"absolute", inset:0, zIndex:1, pointerEvents:"none",
        background:"radial-gradient(ellipse 100% 95% at 50% 28%, transparent 35%, rgba(0,0,0,0.6) 100%)",
      }}/>
      {/* Ember canvas */}
      <canvas ref={canvasRef} style={{
        position:"absolute", top:0, left:0,
        width:"100%", height:"100%",
        pointerEvents:"none", zIndex:2, opacity:0.7,
      }}/>
    </>
  );
}
