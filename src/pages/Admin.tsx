export default function Admin() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: '#FFF9F0', paddingTop: 64 }}>
      <div className="text-center">
        <h1
          className="font-bold mb-4"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
            color: '#1A1A2E',
          }}
        >
          Admin Panel
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", color: '#64748B', fontSize: '1.125rem' }}>
          Control room for agent configuration. Coming soon.
        </p>
      </div>
    </div>
  );
}
