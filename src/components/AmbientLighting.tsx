const AmbientLighting = () => (
  <div id="ambient-lighting-engine" className="absolute inset-0 pointer-events-none overflow-hidden z-0">
    <div
      className="absolute top-[-12%] right-[-8%] w-[700px] h-[700px] rounded-full blur-[140px] opacity-20 animate-ambient-1"
      style={{ background: 'radial-gradient(circle at 30% 20%, #f38b76, #bc4638 60%, #80261b)' }}
    />
    <div
      className="absolute top-[15%] left-[-12%] w-[500px] h-[500px] rounded-full blur-[130px] opacity-15 animate-ambient-2"
      style={{ background: 'radial-gradient(circle at 60% 40%, #e28fb1, #bd5b82 65%, transparent)' }}
    />
    <div
      className="absolute top-[45%] right-[15%] w-[450px] h-[450px] rounded-full blur-[110px] opacity-12 animate-ambient-3"
      style={{ background: 'radial-gradient(circle at 40% 50%, #f38b76, #d57e8c 50%, #e28fb1)' }}
    />
    <div
      className="absolute bottom-[5%] right-[-5%] w-[550px] h-[550px] rounded-full blur-[120px] opacity-18 animate-ambient-4"
      style={{ background: 'radial-gradient(circle at 50% 60%, #bd5b82, #803251 70%)' }}
    />
    <div
      className="absolute bottom-[25%] left-[-8%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 animate-ambient-3"
      style={{ animationDelay: '-11s', background: 'radial-gradient(circle, #bc4638, #f38b76 60%, transparent)' }}
    />
    <div
      className="absolute top-[5%] left-[calc(50%-300px)] w-[600px] h-[300px] rounded-full blur-[100px] opacity-8 animate-ambient-pulse"
      style={{ background: 'radial-gradient(ellipse at center, #f38b76, #e28fb1 60%, transparent)' }}
    />
    <div
      className="absolute top-[30%] left-[5%] w-[350px] h-[350px] rounded-full blur-[100px] opacity-10 animate-ambient-2"
      style={{ animationDelay: '-8s', background: 'radial-gradient(circle at 40% 60%, #6b8f71, #4a7c5c 60%, transparent)' }}
    />
    <div
      className="absolute bottom-[10%] left-[20%] w-[320px] h-[320px] rounded-full blur-[90px] opacity-12 animate-ambient-4"
      style={{ animationDelay: '-6s', background: 'radial-gradient(circle at 30% 70%, #c9a96e, #b8914a 60%, transparent)' }}
    />
    <div
      className="absolute top-[60%] left-[-5%] w-[280px] h-[280px] rounded-full blur-[80px] opacity-8 animate-ambient-1"
      style={{ animationDelay: '-15s', background: 'radial-gradient(circle at 50% 30%, #9d6072, #6b4e62 70%, transparent)' }}
    />

    {/* Radial vignette overlay for depth */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(17,17,17,0.04) 100%)' }}
    />

    {/* Subtle noise layer */}
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.015]"
      style={{
        backgroundImage:
          "url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%221%22/%3E%3C/svg%3E')",
      }}
    />

    {/* Floating dots pattern */}
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.06] z-0"
      style={{ backgroundImage: 'radial-gradient(circle, #bc4638 1px, transparent 1px)', backgroundSize: '48px 48px' }}
    />

    {/* Diagonal accent lines */}
    <div className="absolute top-0 right-0 w-[60%] h-full pointer-events-none z-0 overflow-hidden opacity-[0.04]">
      <svg viewBox="0 0 400 1200" className="w-full h-full" preserveAspectRatio="none">
        <line x1="0" y1="0" x2="400" y2="1200" stroke="#bd5b82" strokeWidth="1" />
        <line x1="50" y1="0" x2="450" y2="1200" stroke="#bd5b82" strokeWidth="0.5" />
        <line x1="100" y1="0" x2="500" y2="1200" stroke="#bd5b82" strokeWidth="0.5" />
        <line x1="150" y1="0" x2="550" y2="1200" stroke="#f38b76" strokeWidth="0.5" />
        <line x1="200" y1="0" x2="600" y2="1200" stroke="#f38b76" strokeWidth="0.5" />
      </svg>
    </div>

    {/* Bottom left warm glow */}
    <div className="absolute bottom-0 left-0 w-[800px] h-[800px] pointer-events-none z-0">
      <svg viewBox="0 0 800 800" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <radialGradient id="bottomGlow" cx="0" cy="100%" r="100%">
            <stop offset="0%" stopColor="#c9a96e" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#c9a96e" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="800" fill="url(#bottomGlow)" />
      </svg>
    </div>

    {/* Center subtle light wash */}
    <div className="absolute top-[20%] left-[25%] w-[50%] h-[40%] pointer-events-none z-0">
      <svg viewBox="0 0 500 400" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <radialGradient id="centerWash" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="500" height="400" fill="url(#centerWash)" />
      </svg>
    </div>
  </div>
);

export default AmbientLighting;
