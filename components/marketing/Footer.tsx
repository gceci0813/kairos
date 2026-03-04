import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
                <circle cx="16" cy="16" r="13" fill="none" stroke="#2563EB" strokeWidth="1.5"/>
                <line x1="16" y1="3" x2="16" y2="29" stroke="#2563EB" strokeWidth="0.5" opacity="0.6"/>
                <line x1="3" y1="16" x2="29" y2="16" stroke="#2563EB" strokeWidth="0.5" opacity="0.6"/>
                <circle cx="16" cy="16" r="3" fill="#2563EB" opacity="0.8"/>
              </svg>
              <span className="font-display font-800 text-xl tracking-[0.2em] text-[#0F172A]">KAIROS</span>
            </div>
            <p className="text-[#475569] text-base leading-relaxed max-w-xs mb-6">
              Decision intelligence for high-stakes environments. Model stakeholders, forecast outcomes, and act at the critical moment.
            </p>
            <div className="font-mono-custom text-[0.7rem] tracking-[0.15em] text-[#64748B]">
              WASHINGTON DC · NEW YORK · TOKYO · DUBAI
            </div>
          </div>

          {/* Platform */}
          <div>
            <div className="font-mono-custom text-[0.7rem] tracking-[0.25em] uppercase text-[#2563EB] mb-5">
              Platform
            </div>
            <ul className="space-y-3">
              {['ORACLE Strategy Navigator', 'SENTINEL Horizon Watch', 'Custom Integrations', 'Enterprise API', 'Documentation'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-base text-[#475569] hover:text-[#3B82F6] transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="font-mono-custom text-[0.7rem] tracking-[0.25em] uppercase text-[#2563EB] mb-5">
              Company
            </div>
            <ul className="space-y-3">
              {['About KAIROS', 'Use Cases', 'Team', 'Careers', 'Contact'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-base text-[#475569] hover:text-[#3B82F6] transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#E2E8F0] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-mono-custom text-[0.7rem] tracking-[0.15em] text-[#64748B]">
            © 2025 KAIROS. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-8">
            {['Privacy Policy', 'Terms of Service', 'Security'].map((item) => (
              <a key={item} href="#" className="font-mono-custom text-[0.7rem] tracking-[0.15em] uppercase text-[#64748B] hover:text-[#2563EB] transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 text-[0.75rem] text-[#64748B] leading-relaxed max-w-3xl">
          This platform contains general information only. KAIROS is not rendering business, financial, investment, or other professional advice. Predictive analytics results are probabilistic and do not guarantee specific outcomes. Powered by Anthropic Claude AI.
        </div>
      </div>
    </footer>
  );
}
