'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    for (let i = 0; i < 55; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: Math.random() * 1.5 + 0.5,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.strokeStyle = `rgba(37,99,235,${(1 - dist / 150) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(37,99,235,0.3)';
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <div className="relative min-h-screen bg-white flex flex-col overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 opacity-40 pointer-events-none" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
            <circle cx="16" cy="16" r="13" fill="none" stroke="#2563EB" strokeWidth="1.5"/>
            <line x1="16" y1="3" x2="16" y2="29" stroke="#2563EB" strokeWidth="0.5" opacity="0.6"/>
            <line x1="3" y1="16" x2="29" y2="16" stroke="#2563EB" strokeWidth="0.5" opacity="0.6"/>
            <circle cx="16" cy="16" r="3" fill="#2563EB" opacity="0.8"/>
          </svg>
          <span className="font-display font-800 text-lg tracking-[0.2em] text-[#0F172A]">KAIROS</span>
        </div>
        <Link href="/auth/login"
          className="text-sm font-semibold text-[#475569] hover:text-[#2563EB] transition-colors">
          Sign In &rarr;
        </Link>
      </header>

      {/* Center content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-lg">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-full px-4 py-1.5 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
            <span className="text-xs font-semibold text-[#2563EB] tracking-widest uppercase">Intelligence Platform</span>
          </div>

          {/* Headline */}
          <h1 className="font-display font-800 text-[#0F172A] tracking-tight mb-5"
            style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', lineHeight: '1.0' }}>
            KAIROS
          </h1>

          <p className="text-base text-[#64748B] leading-relaxed mb-10 max-w-sm mx-auto">
            AI-powered geopolitical intelligence. Forecast risks, model stakeholders, and profile global actors in real time.
          </p>

          {/* Capability pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {['ORACLE · Strategy', 'SENTINEL · Risk', 'ACTOR · Intel', 'Live Feeds'].map(c => (
              <span key={c} className="text-xs font-semibold text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-3.5 py-1.5">
                {c}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/login"
              className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg px-8 py-3.5 transition-colors shadow-sm">
              Access Platform &rarr;
            </Link>
            <Link href="/auth/signup"
              className="w-full sm:w-auto border border-[#E2E8F0] text-[#475569] hover:border-[#2563EB] hover:text-[#2563EB] text-sm font-semibold rounded-lg px-8 py-3.5 transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-5 border-t border-[#F1F5F9]">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#CBD5E1]">
          Restricted &middot; KAIROS Intelligence Platform
        </p>
      </footer>
    </div>
  );
}
