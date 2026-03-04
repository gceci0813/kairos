'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';

const TICKER_ITEMS = [
  'GEOPOLITICAL RISK INTELLIGENCE',
  'STAKEHOLDER MAPPING',
  'EARLY WARNING SYSTEM',
  'COALITION DYNAMICS',
  'POLITICAL FORECASTING',
  'CONFLICT PREDICTION',
  'DECISION INTELLIGENCE',
  'OUTCOME SIMULATION',
];

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    const count = 65;
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 2 + 0.5,
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
            const opacity = (1 - dist / 160) * 0.12;
            ctx.strokeStyle = `rgba(37, 99, 235, ${opacity})`;
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
        ctx.fillStyle = 'rgba(37, 99, 235, 0.35)';
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 opacity-50" />
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(37,99,235,0.07) 0%, transparent 70%)'
      }} />

      {/* Ticker */}
      <div className="relative z-10 mt-[80px] border-y border-[#E2E8F0] bg-white/60 overflow-hidden py-2.5">
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="font-mono-custom text-[0.7rem] tracking-[0.3em] text-[#64748B] px-8 flex items-center gap-8">
              {item}
              <span className="text-[#2563EB]">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center pt-16 pb-24">
        <div className="opacity-0-init animate-fade-in delay-100 inline-flex items-center gap-3 mb-10">
          <span className="w-8 h-px bg-[#2563EB]" />
          <span className="font-mono-custom text-[0.7rem] tracking-[0.35em] uppercase text-[#2563EB]">
            Decision Intelligence Platform
          </span>
          <span className="w-8 h-px bg-[#2563EB]" />
        </div>

        <h1 className="font-display font-800 opacity-0-init animate-fade-in-up delay-200"
          style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', lineHeight: '1', letterSpacing: '-0.02em' }}>
          <span className="block text-[#0F172A]">CLARITY</span>
          <span className="block text-blue-gradient">IN THE</span>
          <span className="block text-[#0F172A]">CRITICAL MOMENT.</span>
        </h1>

        <p className="mt-8 max-w-xl text-[#475569] text-lg leading-relaxed opacity-0-init animate-fade-in-up delay-400">
          AI-powered geopolitical and strategic intelligence. Model stakeholder dynamics, forecast outcomes, and identify winning strategies before your adversaries react.
        </p>

        {/* Capability pillars */}
        <div className="mt-14 flex flex-wrap justify-center items-center gap-6 opacity-0-init animate-fade-in-up delay-500">
          {[
            { label: 'Strategy Navigator', icon: '◎' },
            { label: 'Early Warning', icon: '◈' },
            { label: 'Actor Targeting', icon: '◆' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-white border border-[#E2E8F0] px-5 py-3">
              <span className="text-[#2563EB] text-sm">{item.icon}</span>
              <span className="font-mono-custom text-[0.7rem] tracking-[0.2em] uppercase text-[#475569]">{item.label}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 opacity-0-init animate-fade-in-up delay-600">
          <Link href="/auth/signup"
            className="font-mono-custom text-[0.8rem] tracking-[0.2em] uppercase bg-[#2563EB] text-white px-8 py-4 hover:bg-[#3B82F6] transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]">
            Request Access →
          </Link>
          <Link href="/dashboard"
            className="font-mono-custom text-[0.8rem] tracking-[0.2em] uppercase border border-[#E2E8F0] text-[#475569] px-8 py-4 hover:border-[#2563EB] hover:text-[#3B82F6] hover:bg-[rgba(37,99,235,0.05)] transition-all duration-300">
            Open Platform →
          </Link>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0-init animate-fade-in delay-800">
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono-custom text-[0.65rem] tracking-[0.3em] uppercase text-[#64748B]">Scroll</span>
            <div className="w-px h-12 bg-gradient-to-b from-[#2563EB] to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
