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
    for (let i = 0; i < 70; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
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
          if (dist < 160) {
            ctx.strokeStyle = `rgba(59,130,246,${(1 - dist / 160) * 0.25})`;
            ctx.lineWidth = 0.6;
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
        ctx.fillStyle = 'rgba(59,130,246,0.5)';
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
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: '#060D1A' }}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0.7 }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(37,99,235,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.06) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }} />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(37,99,235,0.18) 0%, transparent 70%)',
      }} />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DC2626] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DC2626]" />
          </div>
          <span className="text-[10px] font-bold text-[#DC2626] tracking-widest uppercase">Live</span>
        </div>
        <Link href="/auth/login"
          className="text-sm font-semibold text-[#94A3B8] hover:text-white transition-colors">
          Sign In &rarr;
        </Link>
      </header>

      {/* Center */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center -mt-8">

        {/* Logo */}
        <div className="mb-7" style={{ filter: 'drop-shadow(0 0 24px rgba(37,99,235,0.6))' }}>
          <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20 mx-auto">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#3B82F6" strokeWidth="1.2"/>
            <circle cx="40" cy="40" r="22" fill="none" stroke="#3B82F6" strokeWidth="0.5" opacity="0.35"/>
            <circle cx="40" cy="40" r="11" fill="none" stroke="#3B82F6" strokeWidth="0.5" opacity="0.2"/>
            <line x1="40" y1="6" x2="40" y2="74" stroke="#3B82F6" strokeWidth="0.6" opacity="0.4"/>
            <line x1="6" y1="40" x2="74" y2="40" stroke="#3B82F6" strokeWidth="0.6" opacity="0.4"/>
            <line x1="16" y1="16" x2="64" y2="64" stroke="#3B82F6" strokeWidth="0.4" opacity="0.15"/>
            <line x1="64" y1="16" x2="16" y2="64" stroke="#3B82F6" strokeWidth="0.4" opacity="0.15"/>
            <circle cx="40" cy="40" r="5" fill="#2563EB"/>
            <circle cx="40" cy="40" r="2" fill="white"/>
          </svg>
        </div>

        {/* Name */}
        <h1 className="font-display font-800 text-white mb-2"
          style={{ fontSize: 'clamp(3.5rem, 10vw, 6.5rem)', lineHeight: '1', letterSpacing: '0.18em' }}>
          KAIROS
        </h1>

        {/* Subtitle */}
        <p className="text-xs font-bold text-[#60A5FA] tracking-[0.35em] uppercase mb-8">
          Geopolitical Intelligence Platform
        </p>

        {/* Description */}
        <p className="text-sm text-[#64748B] max-w-[300px] leading-relaxed mb-10">
          AI-powered geopolitical analysis — forecast risks, map stakeholders, and profile global actors in real time.
        </p>

        {/* Capability chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {[
            { label: 'ORACLE', sub: 'Strategy' },
            { label: 'SENTINEL', sub: 'Risk' },
            { label: 'ACTOR', sub: 'Intel' },
            { label: 'Live Feeds', sub: 'Real-Time' },
          ].map(c => (
            <div key={c.label}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[#94A3B8]"
              style={{ borderColor: 'rgba(37,99,235,0.25)', background: 'rgba(37,99,235,0.06)' }}>
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#60A5FA]">{c.label}</span>
              <span className="text-[10px] text-[#475569]">&middot; {c.sub}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link href="/auth/login"
            className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg px-9 py-3.5 transition-colors"
            style={{ boxShadow: '0 0 24px rgba(37,99,235,0.35)' }}>
            Access Platform &rarr;
          </Link>
          <Link href="/auth/signup"
            className="w-full sm:w-auto text-[#64748B] hover:text-[#94A3B8] text-sm font-semibold rounded-lg px-9 py-3.5 transition-colors border"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            Create Account
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6">
        <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.1)' }}>
          Restricted &middot; Authorized Access Only
        </p>
      </footer>
    </div>
  );
}
