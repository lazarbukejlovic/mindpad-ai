'use client';

type NodeDef  = { cx: number; cy: number; r: number; delay: number };
type EdgeDef  = { x1: number; y1: number; x2: number; y2: number; dur: number; delay: number };
type Particle = { d: string; dur: number; delay: number };

const NODES: NodeDef[] = [
  { cx: 80,   cy: 120, r: 3,   delay: 0.0 },
  { cx: 270,  cy: 70,  r: 2.5, delay: 0.6 },
  { cx: 480,  cy: 160, r: 4,   delay: 1.3 },
  { cx: 700,  cy: 90,  r: 2.5, delay: 0.2 },
  { cx: 950,  cy: 130, r: 3.5, delay: 1.9 },
  { cx: 1160, cy: 80,  r: 2.5, delay: 0.8 },
  { cx: 160,  cy: 300, r: 2.5, delay: 1.4 },
  { cx: 380,  cy: 280, r: 3.5, delay: 0.5 },
  { cx: 600,  cy: 340, r: 3,   delay: 2.1 },
  { cx: 820,  cy: 300, r: 2,   delay: 0.9 },
  { cx: 1060, cy: 320, r: 3,   delay: 1.6 },
  { cx: 80,   cy: 520, r: 2,   delay: 1.1 },
  { cx: 300,  cy: 500, r: 3,   delay: 0.4 },
  { cx: 540,  cy: 560, r: 2.5, delay: 2.3 },
  { cx: 760,  cy: 520, r: 3.5, delay: 0.7 },
  { cx: 1000, cy: 540, r: 2.5, delay: 1.8 },
  { cx: 200,  cy: 700, r: 3,   delay: 2.6 },
  { cx: 460,  cy: 680, r: 2,   delay: 0.3 },
  { cx: 700,  cy: 720, r: 3.5, delay: 1.5 },
  { cx: 940,  cy: 700, r: 2,   delay: 0.1 },
  { cx: 1150, cy: 660, r: 3,   delay: 2.0 },
];

const EDGES: EdgeDef[] = [
  // top row
  { x1: 80,  y1: 120, x2: 270,  y2: 70,  dur: 2.8, delay: 0.0 },
  { x1: 270, y1: 70,  x2: 480,  y2: 160, dur: 2.5, delay: 0.4 },
  { x1: 480, y1: 160, x2: 700,  y2: 90,  dur: 3.1, delay: 0.8 },
  { x1: 700, y1: 90,  x2: 950,  y2: 130, dur: 2.7, delay: 0.3 },
  { x1: 950, y1: 130, x2: 1160, y2: 80,  dur: 3.0, delay: 1.2 },
  // top → mid-upper
  { x1: 80,  y1: 120, x2: 160,  y2: 300, dur: 3.2, delay: 0.6 },
  { x1: 270, y1: 70,  x2: 160,  y2: 300, dur: 2.6, delay: 1.0 },
  { x1: 270, y1: 70,  x2: 380,  y2: 280, dur: 2.9, delay: 0.2 },
  { x1: 480, y1: 160, x2: 380,  y2: 280, dur: 3.4, delay: 1.4 },
  { x1: 480, y1: 160, x2: 600,  y2: 340, dur: 2.7, delay: 0.7 },
  { x1: 700, y1: 90,  x2: 600,  y2: 340, dur: 3.1, delay: 1.8 },
  { x1: 700, y1: 90,  x2: 820,  y2: 300, dur: 2.5, delay: 0.5 },
  { x1: 950, y1: 130, x2: 820,  y2: 300, dur: 3.3, delay: 1.1 },
  { x1: 950, y1: 130, x2: 1060, y2: 320, dur: 2.8, delay: 2.0 },
  { x1: 1160, y1: 80, x2: 1060, y2: 320, dur: 2.6, delay: 0.9 },
  // mid-upper row
  { x1: 160, y1: 300, x2: 380,  y2: 280, dur: 3.0, delay: 1.3 },
  { x1: 380, y1: 280, x2: 600,  y2: 340, dur: 2.4, delay: 0.1 },
  { x1: 600, y1: 340, x2: 820,  y2: 300, dur: 3.2, delay: 0.6 },
  { x1: 820, y1: 300, x2: 1060, y2: 320, dur: 2.7, delay: 1.7 },
  // mid-upper → mid-lower
  { x1: 160, y1: 300, x2: 80,   y2: 520, dur: 3.1, delay: 0.4 },
  { x1: 380, y1: 280, x2: 300,  y2: 500, dur: 2.9, delay: 1.5 },
  { x1: 380, y1: 280, x2: 540,  y2: 560, dur: 2.6, delay: 0.8 },
  { x1: 600, y1: 340, x2: 540,  y2: 560, dur: 3.3, delay: 2.1 },
  { x1: 600, y1: 340, x2: 760,  y2: 520, dur: 2.8, delay: 0.3 },
  { x1: 820, y1: 300, x2: 760,  y2: 520, dur: 3.0, delay: 1.0 },
  { x1: 820, y1: 300, x2: 1000, y2: 540, dur: 2.5, delay: 1.9 },
  { x1: 1060, y1: 320, x2: 1000, y2: 540, dur: 3.2, delay: 0.7 },
  // mid-lower row
  { x1: 80,  y1: 520, x2: 300,  y2: 500, dur: 2.7, delay: 1.4 },
  { x1: 300, y1: 500, x2: 540,  y2: 560, dur: 3.1, delay: 0.2 },
  { x1: 540, y1: 560, x2: 760,  y2: 520, dur: 2.9, delay: 0.9 },
  { x1: 760, y1: 520, x2: 1000, y2: 540, dur: 2.6, delay: 1.6 },
  // mid-lower → bottom
  { x1: 300, y1: 500, x2: 200,  y2: 700, dur: 3.0, delay: 0.5 },
  { x1: 300, y1: 500, x2: 460,  y2: 680, dur: 2.8, delay: 2.2 },
  { x1: 540, y1: 560, x2: 460,  y2: 680, dur: 3.3, delay: 0.7 },
  { x1: 540, y1: 560, x2: 700,  y2: 720, dur: 2.6, delay: 1.3 },
  { x1: 760, y1: 520, x2: 700,  y2: 720, dur: 3.1, delay: 0.1 },
  { x1: 760, y1: 520, x2: 940,  y2: 700, dur: 2.7, delay: 1.8 },
  { x1: 1000, y1: 540, x2: 940, y2: 700, dur: 2.9, delay: 0.4 },
  { x1: 1000, y1: 540, x2: 1150, y2: 660, dur: 3.4, delay: 1.0 },
  // bottom row
  { x1: 200, y1: 700, x2: 460,  y2: 680, dur: 2.5, delay: 0.6 },
  { x1: 460, y1: 680, x2: 700,  y2: 720, dur: 3.0, delay: 1.5 },
  { x1: 700, y1: 720, x2: 940,  y2: 700, dur: 2.8, delay: 0.3 },
  { x1: 940, y1: 700, x2: 1150, y2: 660, dur: 3.2, delay: 1.2 },
];

// Particles: SVG path 'd' attribute, duration, delay
const PARTICLES: Particle[] = [
  { d: 'M270,70 L480,160',    dur: 3.5, delay: 0.0 },
  { d: 'M480,160 L600,340',   dur: 4.0, delay: 1.2 },
  { d: 'M700,90 L820,300',    dur: 3.8, delay: 0.6 },
  { d: 'M380,280 L540,560',   dur: 4.5, delay: 2.0 },
  { d: 'M600,340 L760,520',   dur: 3.6, delay: 0.4 },
  { d: 'M760,520 L940,700',   dur: 4.2, delay: 1.6 },
  { d: 'M950,130 L1060,320',  dur: 3.9, delay: 0.9 },
  { d: 'M300,500 L460,680',   dur: 4.1, delay: 2.4 },
];

export default function ElectricNetworkBackground({ className }: { className?: string }) {
  return (
    <div
      className={`fixed inset-0 overflow-hidden pointer-events-none select-none${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      style={{ zIndex: 0 }}
    >
      {/* Deep space background */}
      <div className="absolute inset-0" style={{ background: '#03060e' }} />

      {/* Ambient glow orbs */}
      <div
        className="absolute rounded-full"
        style={{
          top: '10%', left: '20%',
          width: 640, height: 640,
          background: 'radial-gradient(circle, rgba(0,140,255,0.07) 0%, transparent 65%)',
          animation: 'orb-float-1 16s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          bottom: '15%', right: '15%',
          width: 520, height: 520,
          background: 'radial-gradient(circle, rgba(100,60,220,0.05) 0%, transparent 65%)',
          animation: 'orb-float-2 20s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          top: '55%', left: '55%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(0,200,160,0.03) 0%, transparent 65%)',
          animation: 'orb-float-1 24s ease-in-out infinite reverse',
        }}
      />

      {/* Neural SVG layer */}
      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Particle motion paths */}
          {PARTICLES.map((p, i) => (
            <path key={`pp-${i}`} id={`pp-${i}`} d={p.d} />
          ))}
          <radialGradient id="node-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#00a0ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00a0ff" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {/* ── Edges ── */}
        {EDGES.map((e, i) => (
          <line
            key={`e-${i}`}
            x1={e.x1} y1={e.y1}
            x2={e.x2} y2={e.y2}
            stroke="#00a0ff"
            strokeWidth="0.7"
            strokeOpacity="0.14"
            strokeDasharray="4 12"
            style={{
              animation: `dash-flow ${e.dur}s linear infinite`,
              animationDelay: `${e.delay}s`,
            }}
          />
        ))}

        {/* ── Nodes ── */}
        {NODES.map((n, i) => (
          <g key={`n-${i}`}>
            {/* halo ring */}
            <circle
              cx={n.cx} cy={n.cy}
              r={n.r * 2.8}
              fill="none"
              stroke="#00a0ff"
              strokeWidth="0.6"
              strokeOpacity="0.18"
              style={{
                animation: `neural-node-pulse ${3 + (i % 5) * 0.4}s ease-in-out infinite`,
                animationDelay: `${n.delay + 0.3}s`,
                transformBox: 'fill-box',
                transformOrigin: 'center',
              }}
            />
            {/* core dot */}
            <circle
              cx={n.cx} cy={n.cy}
              r={n.r}
              fill="url(#node-core)"
              style={{
                animation: `neural-node-pulse ${2.5 + (i % 4) * 0.5}s ease-in-out infinite`,
                animationDelay: `${n.delay}s`,
                transformBox: 'fill-box',
                transformOrigin: 'center',
              }}
            />
          </g>
        ))}

        {/* ── Animated particles along paths ── */}
        {PARTICLES.map((p, i) => (
          <circle key={`part-${i}`} r="2" fill="#00c8ff" fillOpacity="0.85">
            <animateMotion
              dur={`${p.dur}s`}
              repeatCount="indefinite"
              begin={`${p.delay}s`}
            >
              <mpath href={`#pp-${i}`} />
            </animateMotion>
          </circle>
        ))}
      </svg>

      {/* Subtle bottom fade so content on top reads clearly */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: 'linear-gradient(to top, rgba(3,6,14,0.6), transparent)' }}
      />
    </div>
  );
}
