'use client';

const products = [
  {
    id: 'oracle',
    code: '// ORACLE',
    name: 'ORACLE',
    tagline: 'Strategy Navigation System',
    description: 'A decision intelligence platform for anticipating and shaping outcomes in negotiation, policy, and political environments. ORACLE maps stakeholder networks, simulates bargaining dynamics, and delivers a ranked portfolio of winning tactics — who to target, when, and how.',
    badge: 'AI-Powered',
    features: [
      'Stakeholder mapping — interests, influence, salience',
      'Outcome simulation with game-theoretic modeling',
      'Coalition formation and swing-actor identification',
      'AI strategy search: core, defensive, hedging plays',
      'Scenario stress-testing and sensitivity analysis',
      'Ranked COA matrix with confidence scores',
    ],
    useCases: ['Negotiations', 'M&A Advisory', 'Policy & Lobbying', 'Dispute Resolution', 'Political Risk'],
    color: '#2563EB',
    href: '/dashboard/oracle',
  },
  {
    id: 'sentinel',
    code: '// SENTINEL',
    name: 'SENTINEL',
    tagline: 'Global Horizon Watch',
    description: 'An open-source intelligence platform that monitors and forecasts geopolitical, political, economic, and social events across the PMESII spectrum. SENTINEL delivers early warnings, actor tracking, and AI-generated situation reports — updated continuously from global data streams.',
    badge: 'Live Intelligence',
    features: [
      '24/7 global situational awareness',
      'Multi-language open-source signal monitoring',
      'Actor + network tracking with sentiment scoring',
      '1-week to 3-month event forecasts',
      'AI natural language situation reports',
      'Customizable alert thresholds by region or topic',
    ],
    useCases: ['Political Stability', 'Conflict Monitoring', 'Investment Risk', 'Crisis Response', 'PMESII Analysis'],
    color: '#0284C7',
    href: '/dashboard/sentinel',
  },
];

export default function Products() {
  return (
    <section id="products" className="relative py-32 px-6">
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(37,99,235,0.04) 0%, transparent 70%)'
      }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="w-8 h-px bg-[#2563EB]" />
            <span className="font-mono-custom text-[0.7rem] tracking-[0.35em] uppercase text-[#2563EB]">Platform</span>
            <span className="w-8 h-px bg-[#2563EB]" />
          </div>
          <h2 className="font-display font-800 text-[#0F172A]"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.02em' }}>
            Two Tools.<br />One Strategic Advantage.
          </h2>
          <p className="mt-4 text-[#475569] max-w-xl mx-auto">
            KAIROS delivers next-generation decision intelligence — anticipate what will happen, then shape the outcome.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {products.map((product) => (
            <div key={product.id}
              className="group relative bg-white border border-[#E2E8F0] p-10 hover:border-[#CBD5E1] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)]">

              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${product.color}50, transparent)` }} />

              <div className="font-mono-custom text-[0.7rem] tracking-[0.2em] mb-6"
                style={{ color: product.color + '70' }}>
                {product.code}
              </div>

              <div className="mb-8">
                <div className="flex items-end gap-4 mb-2">
                  <h3 className="font-display font-800 text-3xl tracking-[0.1em]"
                    style={{ color: product.color }}>
                    {product.name}
                  </h3>
                  <span className="font-mono-custom text-[0.7rem] tracking-[0.2em] uppercase text-[#475569] mb-1.5">
                    {product.tagline}
                  </span>
                </div>
                <div className="w-16 h-px" style={{ background: product.color + '40' }} />
              </div>

              <p className="text-[#475569] text-base leading-relaxed mb-8">
                {product.description}
              </p>

              <div className="inline-flex items-center gap-2 border px-4 py-2 mb-8"
                style={{ borderColor: product.color + '30', background: product.color + '08' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: product.color }} />
                <span className="font-mono-custom text-[0.7rem] tracking-[0.15em] uppercase" style={{ color: product.color }}>
                  {product.badge}
                </span>
              </div>

              <div className="mb-8">
                <div className="font-mono-custom text-[0.7rem] tracking-[0.25em] uppercase text-[#64748B] mb-4">
                  Capabilities
                </div>
                <ul className="space-y-2">
                  {product.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-base text-[#475569]">
                      <span style={{ color: product.color }} className="mt-0.5 text-sm flex-shrink-0">▸</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="font-mono-custom text-[0.7rem] tracking-[0.25em] uppercase text-[#64748B] mb-3">
                  Applications
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.useCases.map((uc, i) => (
                    <span key={i} className="font-mono-custom text-[0.7rem] tracking-[0.1em] uppercase px-3 py-1.5 border border-[#E2E8F0] text-[#475569]">
                      {uc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-[#E2E8F0]">
                <a href={product.href}
                  className="font-mono-custom text-[0.75rem] tracking-[0.2em] uppercase flex items-center gap-3 transition-all duration-300 group/link"
                  style={{ color: product.color }}>
                  <span className="group-hover/link:translate-x-1 transition-transform">Open Tool →</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
