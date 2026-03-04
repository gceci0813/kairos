export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <style>{`
        .auth-left-panel { display: none; }
        @media (min-width: 1024px) { .auth-left-panel { display: flex; } }
        .auth-mobile-logo { display: block; }
        @media (min-width: 1024px) { .auth-mobile-logo { display: none; } }
      `}</style>
      {/* Left branding panel — hidden on mobile */}
      <div className="auth-left-panel w-[44%] bg-[#0F172A] flex-col justify-between p-14 relative overflow-hidden">
        {/* Subtle grid */}
        <div className="absolute inset-0" style={{
          backgroundImage:
            'linear-gradient(rgba(37,99,235,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.08) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        {/* Blue radial glow */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 70% 55% at 25% 65%, rgba(37,99,235,0.18) 0%, transparent 65%)',
        }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9 flex-shrink-0">
              <circle cx="20" cy="20" r="17" fill="none" stroke="#2563EB" strokeWidth="1.5"/>
              <line x1="20" y1="3" x2="20" y2="37" stroke="#2563EB" strokeWidth="0.6" opacity="0.5"/>
              <line x1="3" y1="20" x2="37" y2="20" stroke="#2563EB" strokeWidth="0.6" opacity="0.5"/>
              <circle cx="20" cy="20" r="3.5" fill="#2563EB" opacity="0.9"/>
            </svg>
            <span className="font-display font-800 text-3xl tracking-[0.3em] text-white">KAIROS</span>
          </div>
          <p className="font-mono-custom text-[0.6rem] tracking-[0.3em] uppercase text-[#3B82F6] opacity-70 ml-[52px]">
            Geopolitical Intelligence Platform
          </p>
        </div>

        {/* Centre content */}
        <div className="relative z-10 space-y-10">
          {/* Status indicators */}
          <div>
            <div className="font-mono-custom text-[0.58rem] tracking-[0.3em] uppercase text-[#475569] mb-4">
              System Status
            </div>
            {[
              { label: 'Intelligence feeds', color: '#16A34A', pulse: true },
              { label: 'AI analysis engines', color: '#2563EB', pulse: false },
              { label: 'Threat monitoring', color: '#2563EB', pulse: false },
            ].map(({ label, color, pulse }) => (
              <div key={label} className="flex items-center gap-2.5 mb-2.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0${pulse ? ' animate-pulse' : ''}`}
                  style={{ backgroundColor: color }}
                />
                <span className="font-mono-custom text-[0.72rem] tracking-[0.05em] text-[#94A3B8]">{label}</span>
                <span className="font-mono-custom text-[0.62rem] text-[#475569] ml-auto">ONLINE</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-[#1E293B]" />

          {/* Quote */}
          <blockquote className="border-l-2 border-[#2563EB] pl-5">
            <p className="text-[#94A3B8] text-[0.9rem] leading-relaxed italic">
              "Intelligence is not about prediction — it's about reducing uncertainty at the margin."
            </p>
          </blockquote>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <div className="font-mono-custom text-[0.58rem] tracking-[0.2em] uppercase text-[#334155]">
            Restricted Access · Authorized Personnel Only
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 bg-white flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  );
}
