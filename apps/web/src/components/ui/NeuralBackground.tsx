'use client';

type NodeDef  = { cx: number; cy: number; r: number; delay: number; gold?: boolean };
type EdgeDef  = { x1: number; y1: number; x2: number; y2: number; dur: number; delay: number; gold?: boolean };

const NODES: NodeDef[] = [
  { cx: 60,    cy: 110, r: 3,   delay: 0.0 },
  { cx: 250,   cy: 65,  r: 2.5, delay: 0.6 },
  { cx: 460,   cy: 150, r: 4,   delay: 1.3 },
  { cx: 690,   cy: 85,  r: 2.5, delay: 0.2, gold: true },
  { cx: 940,   cy: 120, r: 3.5, delay: 1.9 },
  { cx: 1150,  cy: 75,  r: 2.5, delay: 0.8 },
  { cx: 150,   cy: 290, r: 2.5, delay: 1.4 },
  { cx: 370,   cy: 270, r: 3.5, delay: 0.5, gold: true },
  { cx: 595,   cy: 330, r: 3,   delay: 2.1 },
  { cx: 810,   cy: 290, r: 2.5, delay: 0.9 },
  { cx: 1050,  cy: 310, r: 3,   delay: 1.6 },
  { cx: 70,    cy: 510, r: 2,   delay: 1.1 },
  { cx: 295,   cy: 490, r: 3,   delay: 0.4 },
  { cx: 530,   cy: 550, r: 2.5, delay: 2.3, gold: true },
  { cx: 755,   cy: 510, r: 3.5, delay: 0.7 },
  { cx: 990,   cy: 530, r: 2.5, delay: 1.8 },
  { cx: 195,   cy: 690, r: 3,   delay: 2.6 },
  { cx: 450,   cy: 670, r: 2,   delay: 0.3 },
  { cx: 695,   cy: 710, r: 3.5, delay: 1.5, gold: true },
  { cx: 930,   cy: 690, r: 2,   delay: 0.1 },
  { cx: 1140,  cy: 650, r: 3,   delay: 2.0 },
];

const EDGES: EdgeDef[] = [
  { x1: 60,   y1: 110, x2: 250,  y2: 65,  dur: 2.8, delay: 0.0 },
  { x1: 250,  y1: 65,  x2: 460,  y2: 150, dur: 2.5, delay: 0.4 },
  { x1: 460,  y1: 150, x2: 690,  y2: 85,  dur: 3.1, delay: 0.8,  gold: true },
  { x1: 690,  y1: 85,  x2: 940,  y2: 120, dur: 2.7, delay: 0.3 },
  { x1: 940,  y1: 120, x2: 1150, y2: 75,  dur: 3.0, delay: 1.2 },
  { x1: 60,   y1: 110, x2: 150,  y2: 290, dur: 3.2, delay: 0.6 },
  { x1: 250,  y1: 65,  x2: 370,  y2: 270, dur: 2.6, delay: 1.0,  gold: true },
  { x1: 460,  y1: 150, x2: 370,  y2: 270, dur: 3.4, delay: 1.4 },
  { x1: 460,  y1: 150, x2: 595,  y2: 330, dur: 2.7, delay: 0.7 },
  { x1: 690,  y1: 85,  x2: 595,  y2: 330, dur: 3.1, delay: 1.8 },
  { x1: 690,  y1: 85,  x2: 810,  y2: 290, dur: 2.5, delay: 0.5,  gold: true },
  { x1: 940,  y1: 120, x2: 810,  y2: 290, dur: 3.3, delay: 1.1 },
  { x1: 940,  y1: 120, x2: 1050, y2: 310, dur: 2.8, delay: 2.0 },
  { x1: 1150, y1: 75,  x2: 1050, y2: 310, dur: 2.6, delay: 0.9 },
  { x1: 150,  y1: 290, x2: 370,  y2: 270, dur: 3.0, delay: 1.3 },
  { x1: 370,  y1: 270, x2: 595,  y2: 330, dur: 2.4, delay: 0.1,  gold: true },
  { x1: 595,  y1: 330, x2: 810,  y2: 290, dur: 3.2, delay: 0.6 },
  { x1: 810,  y1: 290, x2: 1050, y2: 310, dur: 2.7, delay: 1.7 },
  { x1: 150,  y1: 290, x2: 70,   y2: 510, dur: 3.1, delay: 0.4 },
  { x1: 370,  y1: 270, x2: 295,  y2: 490, dur: 2.9, delay: 1.5 },
  { x1: 370,  y1: 270, x2: 530,  y2: 550, dur: 2.6, delay: 0.8 },
  { x1: 595,  y1: 330, x2: 530,  y2: 550, dur: 3.3, delay: 2.1,  gold: true },
  { x1: 595,  y1: 330, x2: 755,  y2: 510, dur: 2.8, delay: 0.3 },
  { x1: 810,  y1: 290, x2: 755,  y2: 510, dur: 3.0, delay: 1.0 },
  { x1: 810,  y1: 290, x2: 990,  y2: 530, dur: 2.5, delay: 1.9,  gold: true },
  { x1: 1050, y1: 310, x2: 990,  y2: 530, dur: 3.2, delay: 0.7 },
  { x1: 70,   y1: 510, x2: 295,  y2: 490, dur: 2.7, delay: 1.4 },
  { x1: 295,  y1: 490, x2: 530,  y2: 550, dur: 3.1, delay: 0.2 },
  { x1: 530,  y1: 550, x2: 755,  y2: 510, dur: 2.9, delay: 0.9 },
  { x1: 755,  y1: 510, x2: 990,  y2: 530, dur: 2.6, delay: 1.6 },
  { x1: 295,  y1: 490, x2: 195,  y2: 690, dur: 3.0, delay: 0.5 },
  { x1: 295,  y1: 490, x2: 450,  y2: 670, dur: 2.8, delay: 2.2,  gold: true },
  { x1: 530,  y1: 550, x2: 450,  y2: 670, dur: 3.3, delay: 0.7 },
  { x1: 530,  y1: 550, x2: 695,  y2: 710, dur: 2.6, delay: 1.3,  gold: true },
  { x1: 755,  y1: 510, x2: 695,  y2: 710, dur: 3.1, delay: 0.1 },
  { x1: 755,  y1: 510, x2: 930,  y2: 690, dur: 2.7, delay: 1.8 },
  { x1: 990,  y1: 530, x2: 930,  y2: 690, dur: 2.9, delay: 0.4 },
  { x1: 990,  y1: 530, x2: 1140, y2: 650, dur: 3.4, delay: 1.0 },
  { x1: 195,  y1: 690, x2: 450,  y2: 670, dur: 2.5, delay: 0.6 },
  { x1: 450,  y1: 670, x2: 695,  y2: 710, dur: 3.0, delay: 1.5 },
  { x1: 695,  y1: 710, x2: 930,  y2: 690, dur: 2.8, delay: 0.3 },
  { x1: 930,  y1: 690, x2: 1140, y2: 650, dur: 3.2, delay: 1.2 },
];

/* Particle paths — mix of blue and gold */
const PARTICLES: Array<{ d: string; dur: number; delay: number; gold?: boolean }> = [
  { d: 'M250,65 L460,150',    dur: 3.5, delay: 0.0 },
  { d: 'M460,150 L595,330',   dur: 4.0, delay: 1.2,  gold: true },
  { d: 'M690,85 L810,290',    dur: 3.8, delay: 0.6,  gold: true },
  { d: 'M370,270 L530,550',   dur: 4.5, delay: 2.0 },
  { d: 'M595,330 L755,510',   dur: 3.6, delay: 0.4,  gold: true },
  { d: 'M755,510 L930,690',   dur: 4.2, delay: 1.6 },
  { d: 'M940,120 L1050,310',  dur: 3.9, delay: 0.9 },
  { d: 'M295,490 L450,670',   dur: 4.1, delay: 2.4,  gold: true },
];

export default function NeuralBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
      style={{ zIndex: 0 }}
    >
      {/* Deep space base */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,40,100,0.18) 0%, transparent 60%)' }} />

      {/* Ambient blue orbs */}
      <div style={{
        position: 'absolute', top: '8%', right: '12%',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,130,255,0.055) 0%, transparent 65%)',
        animation: 'orb-float-1 20s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '8%', left: '6%',
        width: 560, height: 560, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(60,30,180,0.04) 0%, transparent 65%)',
        animation: 'orb-float-2 25s ease-in-out infinite',
      }} />
      {/* Gold accent orb */}
      <div style={{
        position: 'absolute', top: '40%', right: '30%',
        width: 360, height: 360, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,170,0,0.025) 0%, transparent 65%)',
        animation: 'orb-float-1 30s ease-in-out infinite reverse',
      }} />

      {/* Neural SVG layer */}
      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {PARTICLES.map((p, i) => (
            <path key={`pp-${i}`} id={`pp-${i}`} d={p.d} />
          ))}
          <radialGradient id="node-core-blue" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#00c0ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0080ff" stopOpacity="0.15" />
          </radialGradient>
          <radialGradient id="node-core-gold" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#ffe066" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffb700" stopOpacity="0.15" />
          </radialGradient>
        </defs>

        {/* ── Edges ── */}
        {EDGES.map((e, i) => (
          <line
            key={`e-${i}`}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke={e.gold ? '#ffb700' : '#00a0ff'}
            strokeWidth={e.gold ? '0.9' : '0.7'}
            strokeOpacity={e.gold ? '0.22' : '0.16'}
            strokeDasharray={e.gold ? '6 14' : '4 14'}
            style={{
              animation: `dash-flow ${e.dur}s linear infinite`,
              animationDelay: `${e.delay}s`,
            }}
          />
        ))}

        {/* ── Nodes ── */}
        {NODES.map((n, i) => (
          <g key={`n-${i}`}>
            <circle
              cx={n.cx} cy={n.cy} r={n.r * 2.8}
              fill="none"
              stroke={n.gold ? '#ffb700' : '#00a0ff'}
              strokeWidth="0.7"
              strokeOpacity={n.gold ? '0.25' : '0.2'}
              style={{
                animation: `neural-node-pulse ${3 + (i % 5) * 0.4}s ease-in-out infinite`,
                animationDelay: `${n.delay + 0.3}s`,
                transformBox: 'fill-box', transformOrigin: 'center',
              }}
            />
            <circle
              cx={n.cx} cy={n.cy} r={n.r}
              fill={n.gold ? 'url(#node-core-gold)' : 'url(#node-core-blue)'}
              style={{
                animation: `neural-node-pulse ${2.5 + (i % 4) * 0.5}s ease-in-out infinite`,
                animationDelay: `${n.delay}s`,
                transformBox: 'fill-box', transformOrigin: 'center',
              }}
            />
          </g>
        ))}

        {/* ── Moving particles ── */}
        {PARTICLES.map((p, i) => (
          <circle key={`part-${i}`} r="2.2"
            fill={p.gold ? '#ffe066' : '#00d0ff'}
            fillOpacity={p.gold ? '0.9' : '0.8'}>
            <animateMotion dur={`${p.dur}s`} repeatCount="indefinite" begin={`${p.delay}s`}>
              <mpath href={`#pp-${i}`} />
            </animateMotion>
            <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.08;0.92;1" dur={`${p.dur}s`} begin={`${p.delay}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>

      {/* Subtle bottom vignette */}
      <div className="absolute inset-x-0 bottom-0 h-40"
        style={{ background: 'linear-gradient(to top, rgba(3,6,14,0.5), transparent)' }} />
      {/* Subtle top vignette */}
      <div className="absolute inset-x-0 top-0 h-24"
        style={{ background: 'linear-gradient(to bottom, rgba(3,6,14,0.3), transparent)' }} />
    </div>
  );
}
