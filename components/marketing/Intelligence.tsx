'use client';

const regions = [
  { region: 'East Asia', items: ['JP-China Strategic Relations', 'Taiwan Strait Dynamics', 'Korean Peninsula Policy', 'South China Sea Disputes', 'Indo-Pacific Alliances'] },
  { region: 'Middle East', items: ['Gulf State Stability', 'Iran Nuclear Diplomacy', 'Yemen & Syria Conflicts', 'FDI & Trade Frameworks', 'Bilateral Security Pacts'] },
  { region: 'Europe', items: ['NATO Collective Defense', 'EU Policy Dynamics', 'Energy Security', 'CBR-N Risk Monitoring', 'Eastern Flank Stability'] },
  { region: 'Americas', items: ['Latin America Political Risk', 'Energy Nationalization', 'Cross-Border Trade', 'Illicit Finance Flows', 'Bilateral Investment Treaties'] },
  { region: 'Africa', items: ['Regional Crisis Monitoring', 'Horn of Africa Stability', 'Resource Corridor Risk', 'Coup Contagion Tracking', 'AU Diplomatic Dynamics'] },
  { region: 'Global', items: ['PMESII Spectrum Analysis', 'Extremism Early Warning', 'Nuclear & WMD Policy', 'Sovereign Investment Risk', 'Great Power Competition'] },
];

const capabilities = [
  { label: 'Stakeholder Mapping', icon: '◎' },
  { label: 'Scenario Analysis', icon: '◈' },
  { label: 'War Gaming', icon: '◆' },
  { label: 'Actor Targeting', icon: '◇' },
  { label: 'Conflict Prediction', icon: '△' },
  { label: 'Horizon Scanning', icon: '◉' },
  { label: 'Crisis Response', icon: '▲' },
  { label: 'Political Stability', icon: '○' },
  { label: 'Influence Mapping', icon: '◐' },
  { label: 'Coalition Analysis', icon: '⬡' },
  { label: 'PMESII Effects', icon: '▷' },
  { label: 'Outcome Simulation', icon: '◑' },
  { label: 'Strategy Search', icon: '▸' },
  { label: 'Red Team Simulation', icon: '◀' },
  { label: 'Diplomatic Modeling', icon: '⬢' },
  { label: 'Sentiment Analytics', icon: '◒' },
];

export default function Intelligence() {
  return (
    <section id="intelligence" className="relative py-32 px-6 bg-[#F1F5F9]">
      <div className="absolute inset-0 bg-grid opacity-25" />
      <div className="max-w-7xl mx-auto relative z-10">

        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="w-8 h-px bg-[#2563EB]" />
            <span className="font-mono-custom text-[0.7rem] tracking-[0.35em] uppercase text-[#2563EB]">Coverage</span>
            <span className="w-8 h-px bg-[#2563EB]" />
          </div>
          <h2 className="font-display font-800 text-[#0F172A]"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', letterSpacing: '-0.02em' }}>
            AI Modeling Across<br />the Full PMESII Spectrum
          </h2>
          <p className="mt-4 text-[#475569] max-w-xl mx-auto text-base">
            KAIROS covers political, military, economic, social, informational, and infrastructure domains — from individual actor targeting to regional conflict forecasting.
          </p>
        </div>

        {/* Capabilities grid */}
        <div className="flex flex-wrap gap-2 justify-center mb-20">
          {capabilities.map((c, i) => (
            <div key={i}
              className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2 hover:border-[#CBD5E1] hover:bg-[#F1F5F9] transition-all duration-300 group">
              <span className="text-[#2563EB] text-sm group-hover:text-[#3B82F6] transition-colors">{c.icon}</span>
              <span className="font-mono-custom text-[0.7rem] tracking-[0.15em] uppercase text-[#475569] group-hover:text-[#0F172A] transition-colors">
                {c.label}
              </span>
            </div>
          ))}
        </div>

        {/* Regional coverage */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regions.map((r, i) => (
            <div key={i} className="bg-[#F8FAFC] border border-[#E2E8F0] p-6 hover:border-[#CBD5E1] transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-5 bg-[#2563EB]" />
                <span className="font-display font-700 text-base tracking-[0.1em] text-[#0F172A]">{r.region}</span>
              </div>
              <ul className="space-y-2">
                {r.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-3 text-[0.85rem] text-[#475569] group-hover:text-[#0F172A] transition-colors">
                    <span className="w-1 h-1 rounded-full bg-[#CBD5E1] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA block */}
        <div className="mt-20 border border-[#E2E8F0] bg-[#F8FAFC] p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(37,99,235,0.05) 0%, transparent 70%)'
          }} />
          <div className="relative z-10">
            <div className="font-mono-custom text-[0.7rem] tracking-[0.3em] uppercase text-[#2563EB] mb-4">
              Platform Access
            </div>
            <h3 className="font-display font-800 text-[#0F172A] text-2xl md:text-3xl mb-4">
              Start Modeling Your Scenarios Now
            </h3>
            <p className="text-[#475569] text-base mb-8 max-w-md mx-auto">
              KAIROS is a working tool, not just a platform. Open the dashboard and run your first stakeholder analysis in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/dashboard"
                className="inline-block font-mono-custom text-[0.8rem] tracking-[0.2em] uppercase bg-[#2563EB] text-white px-10 py-4 hover:bg-[#3B82F6] transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                Open Platform →
              </a>
              <a href="/auth/signup"
                className="inline-block font-mono-custom text-[0.8rem] tracking-[0.2em] uppercase border border-[#E2E8F0] text-[#475569] px-10 py-4 hover:border-[#2563EB] hover:text-[#3B82F6] transition-all duration-300">
                Request Access
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
