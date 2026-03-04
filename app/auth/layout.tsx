export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6 relative">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(37,99,235,0.04) 0%, transparent 70%)'
      }} />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
