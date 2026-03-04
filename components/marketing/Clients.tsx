'use client';

const capabilities = [
  { value: 'ORACLE', label: 'Strategy Navigator', sub: 'Stakeholder & negotiation AI' },
  { value: 'SENTINEL', label: 'Horizon Watch', sub: 'Global early warning system' },
  { value: 'PMESII', label: 'Full Spectrum', sub: 'Political · Military · Economic · Social' },
  { value: 'Claude AI', label: 'AI Backbone', sub: 'Powered by Anthropic Claude' },
  { value: 'Real-time', label: 'Live Intelligence', sub: 'Continuous signal monitoring' },
  { value: '150+', label: 'Languages', sub: 'OSINT in every major language' },
];

const sectors = [
  'GOVERNMENT & DEFENSE',
  'STRATEGIC ADVISORY',
  'MULTILATERAL INSTITUTIONS',
  'PRIVATE EQUITY & INVESTMENT',
  'ENERGY & INFRASTRUCTURE',
  'TECHNOLOGY & AEROSPACE',
  'TRADE & REGULATORY AFFAIRS',
  'CRISIS MANAGEMENT',
];

const useCases = [
  {
    title: 'Negotiation Strategy',
    description: 'Model multi-party negotiations with stakeholder mapping and game-theoretic outcome simulation. Identify the exact sequence of moves that shifts the coalition toward your goal.',
  },
  {
    title: 'Political Risk Assessment',
    description: 'Track government stability, legislative dynamics, and actor sentiment across regions. Generate forecasts with probability bands for investor and operational decisions.',
  },
  {
    title: 'Early Warning & Crisis Response',
    description: 'Monitor open-source signals across 150+ languages. Receive AI-generated alerts on emerging conflicts, policy shifts, and social instability before they escalate.',
  },
  {
    title: 'Actor Targeting & Influence Mapping',
    description: 'Identify key decision-makers, map their influence networks, and determine the optimal targeting sequence — who to engage, in what order, with what message.',
  },
];

export default function Clients() {
  return (
    <>
      {/* Platform stats */}
      <section className="relative py-24 px-6 border-y border-[#E2E8F0]">
        <div className="absolute inset-0 bg-[#F1F5F9]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {capabilities.map((s, i) => (
              <div key={i} className="text-center">
                <div className="font-display font-800 text-blue-gradient mb-1"
                  style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)' }}>
                  {s.value}
                </div>
                <div className="font-mono-custom text-[0.7rem] tracking-[0.2em] uppercase text-[#0F172A] mb-0.5">
                  {s.label}
                </div>
                <div className="text-[0.75rem] text-[#475569]">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sector coverage */}
      <section id="clients" className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-[#2563EB]" />
              <span className="font-mono-custom text-[0.7rem] tracking-[0.35em] uppercase text-[#2563EB]">Who Uses KAIROS</span>
              <span className="w-8 h-px bg-[#2563EB]" />
            </div>
            <h2 className="font-display font-800 text-[#0F172A]"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', letterSpacing: '-0.02em' }}>
              Built for High-Stakes Decision Makers
            </h2>
            <p className="mt-4 text-[#475569] max-w-xl mx-auto text-base">
              KAIROS is designed for institutions and individuals operating in complex, adversarial, and high-consequence environments.
            </p>
          </div>

          {/* Sector grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px border border-[#E2E8F0] mb-24">
            {sectors.map((sector, i) => (
              <div key={i} className="bg-white border border-[#E2E8F0] flex items-center justify-center p-8 hover:bg-[#F1F5F9] hover:border-[#CBD5E1] transition-all duration-300 group">
                <span className="font-mono-custom text-[0.7rem] tracking-[0.2em] text-[#64748B] group-hover:text-[#475569] transition-colors text-center">
                  {sector}
                </span>
              </div>
            ))}
          </div>

          {/* Use case cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((uc, i) => (
              <div key={i} className="bg-white border border-[#E2E8F0] p-8 relative hover:border-[#CBD5E1] transition-all duration-300 group">
                <div className="absolute top-0 left-0 w-8 h-px bg-[#2563EB]" />
                <div className="font-mono-custom text-[0.7rem] tracking-[0.25em] uppercase text-[#2563EB] mb-3">
                  Use Case
                </div>
                <h3 className="font-display font-700 text-lg text-[#0F172A] mb-3">{uc.title}</h3>
                <p className="text-[#475569] text-base leading-relaxed">{uc.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
