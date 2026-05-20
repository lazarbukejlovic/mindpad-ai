'use client';

interface AIBrainVisualProps {
  className?: string;
}

/* 8 cardinal paths from outer terminals → brain core */
const paths = [
  { id: 'p-n',  d: 'M 400 10 C 398 100 400 180 400 250',   node: [400, 130],  term: [400, 10]   },
  { id: 'p-ne', d: 'M 745 105 C 650 210 572 268 506 315',  node: [628, 212],  term: [745, 105]  },
  { id: 'p-e',  d: 'M 820 400 C 700 400 618 400 550 400',  node: [682, 400],  term: [820, 400]  },
  { id: 'p-se', d: 'M 745 695 C 650 600 572 540 506 490',  node: [628, 588],  term: [745, 695]  },
  { id: 'p-s',  d: 'M 400 790 C 400 700 400 622 400 550',  node: [400, 668],  term: [400, 790]  },
  { id: 'p-sw', d: 'M 55 695 C 150 600 228 540 294 490',   node: [172, 588],  term: [55, 695]   },
  { id: 'p-w',  d: 'M -20 400 C 100 400 182 400 250 400',  node: [118, 400],  term: [-20, 400]  },
  { id: 'p-nw', d: 'M 55 105 C 150 210 228 268 294 315',   node: [172, 212],  term: [55, 105]   },
];

/* Zigzag "lightning" overlays — secondary jagged lines on same paths */
const lightningOverlays = [
  'M 400 10 L 398 60 L 402 110 L 399 160 L 401 200 L 400 250',
  'M 745 105 L 718 140 L 688 178 L 655 215 L 620 248 L 585 278 L 550 305 L 506 315',
  'M 820 400 L 770 402 L 720 398 L 670 401 L 620 399 L 575 400 L 550 400',
  'M 745 695 L 718 660 L 688 622 L 655 585 L 620 552 L 585 522 L 550 498 L 506 490',
  'M 400 790 L 402 740 L 398 690 L 401 640 L 399 590 L 400 550',
  'M 55 695 L 82 660 L 112 622 L 145 585 L 180 552 L 215 522 L 250 498 L 294 490',
  'M -20 400 L 30 402 L 80 398 L 130 401 L 180 399 L 225 400 L 250 400',
  'M 55 105 L 82 140 L 112 178 L 145 215 L 180 248 L 215 278 L 250 305 L 294 315',
];

const particleDurs  = ['3.6s', '4.0s', '3.3s', '4.6s', '3.8s', '3.0s', '4.8s', '4.3s'];
const particleBegin = ['0s',   '0.5s', '1.0s', '1.5s', '2.0s', '2.5s', '0.8s', '1.8s'];
const flashDurs     = ['6s',   '7.5s', '5.5s', '8s',   '6.5s', '5s',   '9s',   '7s'];
const flashBegin    = ['1s',   '2.2s', '0.4s', '3.1s', '4.0s', '1.7s', '2.8s', '0.9s'];

export default function AIBrainVisual({ className }: AIBrainVisualProps) {
  return (
    <svg
      viewBox="0 0 800 800"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        {/* Brain core gradient — cyan/blue */}
        <radialGradient id="brain-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#0070e0" stopOpacity="0.35" />
          <stop offset="45%"  stopColor="#003090" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#000820" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="brain-core-grad" cx="38%" cy="32%" r="62%">
          <stop offset="0%"   stopColor="#e8f8ff" stopOpacity="0.95" />
          <stop offset="22%"  stopColor="#50d0ff" stopOpacity="0.75" />
          <stop offset="55%"  stopColor="#0070c8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#000820" stopOpacity="0.85" />
        </radialGradient>

        {/* Gold lightning gradient */}
        <radialGradient id="gold-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#ffcc00" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ff8800" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="gold-path-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ffb700" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ff8800" stopOpacity="0.7" />
        </linearGradient>

        {/* Gold particle gradient */}
        <radialGradient id="gold-particle" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#ffe066" stopOpacity="1" />
          <stop offset="60%"  stopColor="#ffb700" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ff8800" stopOpacity="0" />
        </radialGradient>

        {/* Cyan particle gradient */}
        <radialGradient id="cyan-particle" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#00f0ff" stopOpacity="1" />
          <stop offset="100%" stopColor="#0080ff" stopOpacity="0" />
        </radialGradient>

        {/* Glow filter for brain */}
        <filter id="brain-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* Glow filter for gold */}
        <filter id="gold-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* Path defs for animateMotion */}
        {paths.map((p) => (
          <path key={p.id} id={p.id} d={p.d} />
        ))}
      </defs>

      {/* ── Deep space ambient layer ── */}
      <circle cx="400" cy="400" r="380" fill="url(#brain-aura)" />
      <circle cx="400" cy="400" r="320" fill="url(#gold-aura)" style={{ animation: 'workspace-pulse 6s ease-in-out infinite' }} />

      {/* ── Gold outer corona rings ── */}
      <circle cx="400" cy="400" r="310" fill="none" stroke="#ffb700" strokeWidth="0.5" strokeOpacity="0.07"
        style={{ animation: 'gold-pulse 5s ease-in-out infinite' }} />
      <circle cx="400" cy="400" r="350" fill="none" stroke="#ffc800" strokeWidth="0.4" strokeOpacity="0.05"
        style={{ animation: 'gold-pulse 7s ease-in-out infinite', animationDelay: '2s' }} />

      {/* ── Neural connections — GOLD lightning streams ── */}
      {paths.map((p, i) => (
        <g key={p.id}>
          {/* Outer gold glow halo */}
          <use
            href={`#${p.id}`}
            fill="none"
            stroke="#ffb700"
            strokeWidth="6"
            strokeOpacity="0.06"
          />
          {/* Main gold dashed path */}
          <use
            href={`#${p.id}`}
            fill="none"
            stroke="#ffc400"
            strokeWidth="1.5"
            strokeOpacity="0.38"
            strokeDasharray="10 16"
            style={{ animation: `dash-flow ${4 + i * 0.35}s linear infinite` }}
          />
          {/* Bright inner highlight */}
          <use
            href={`#${p.id}`}
            fill="none"
            stroke="#ffe066"
            strokeWidth="0.6"
            strokeOpacity="0.55"
            strokeDasharray="5 22"
            style={{ animation: `dash-flow ${3 + i * 0.25}s linear infinite`, animationDelay: `${i * 0.2}s` }}
          />
          {/* Lightning zigzag overlay — flashes */}
          <path
            d={lightningOverlays[i]}
            fill="none"
            stroke="#ffe500"
            strokeWidth="1.2"
            strokeOpacity="0"
          >
            <animate attributeName="stroke-opacity" values="0;0;0.7;0.3;0.8;0;0" dur={flashDurs[i]} begin={flashBegin[i]} repeatCount="indefinite" />
          </path>

          {/* Gold terminal node */}
          <circle
            cx={p.term[0]} cy={p.term[1]} r="4.5"
            fill="#ffb700" fillOpacity="0.45"
            style={{ animation: `gold-pulse ${3.5 + i * 0.4}s ease-in-out infinite` }}
          />
          <circle cx={p.term[0]} cy={p.term[1]} r="2" fill="#ffe066" fillOpacity="0.85" />

          {/* Gold mid-node */}
          <circle
            cx={p.node[0]} cy={p.node[1]} r="5.5"
            fill="#ffc400" fillOpacity="0.35"
            style={{ animation: `gold-spark ${4.2 + i * 0.35}s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }}
          />
          <circle
            cx={p.node[0]} cy={p.node[1]} r="2.5"
            fill="#ffe066" fillOpacity="0.75"
          />

          {/* Gold particle travelling toward brain */}
          <circle r="3.5" fill="url(#gold-particle)">
            <animateMotion dur={particleDurs[i]} begin={particleBegin[i]} repeatCount="indefinite">
              <mpath {...({ href: `#${p.id}` } as object)} />
            </animateMotion>
            <animate attributeName="opacity" values="0;1;1;0" dur={particleDurs[i]} begin={particleBegin[i]} repeatCount="indefinite" keyTimes="0;0.08;0.88;1" />
          </circle>
        </g>
      ))}

      {/* ── Brain outer rings ── */}
      <circle cx="400" cy="400" r="220" fill="none" stroke="#0090e0" strokeWidth="1" strokeOpacity="0.18"
        style={{ animation: 'neural-node-pulse 4.5s ease-in-out infinite' }} />
      <circle cx="400" cy="400" r="265" fill="none" stroke="#0070c0" strokeWidth="0.6" strokeOpacity="0.1"
        style={{ animation: 'neural-node-pulse 5.5s ease-in-out infinite', animationDelay: '2s' }} />

      {/* ── Main brain sphere ── */}
      <circle
        cx="400" cy="400" r="165"
        fill="url(#brain-core-grad)"
        stroke="#00b0ff" strokeWidth="1.5" strokeOpacity="0.5"
        style={{ animation: 'glow-pulse 5s ease-in-out infinite' }}
        filter="url(#brain-glow)"
      />

      {/* Hemisphere ellipses */}
      <ellipse cx="365" cy="400" rx="115" ry="132" fill="none" stroke="#00e8ff" strokeWidth="0.8" strokeOpacity="0.13" />
      <ellipse cx="435" cy="400" rx="115" ry="132" fill="none" stroke="#00e8ff" strokeWidth="0.8" strokeOpacity="0.13" />

      {/* Corpus callosum divider */}
      <line x1="400" y1="248" x2="400" y2="552" stroke="#00d0ff" strokeWidth="0.7" strokeOpacity="0.22" strokeDasharray="4 6" />

      {/* Brain fold lines — left hemisphere */}
      <path d="M 288 358 Q 323 338 350 356 Q 370 370 384 356" fill="none" stroke="#00e8ff" strokeWidth="1" strokeOpacity="0.32" />
      <path d="M 282 390 Q 316 376 340 393 Q 362 408 380 391" fill="none" stroke="#00e8ff" strokeWidth="1" strokeOpacity="0.32" />
      <path d="M 290 422 Q 323 408 344 426 Q 364 444 382 423" fill="none" stroke="#00e8ff" strokeWidth="1" strokeOpacity="0.28" />

      {/* Brain fold lines — right hemisphere */}
      <path d="M 512 358 Q 477 338 450 356 Q 430 370 416 356" fill="none" stroke="#00e8ff" strokeWidth="1" strokeOpacity="0.32" />
      <path d="M 518 390 Q 484 376 460 393 Q 438 408 420 391" fill="none" stroke="#00e8ff" strokeWidth="1" strokeOpacity="0.32" />
      <path d="M 510 422 Q 477 408 456 426 Q 436 444 418 423" fill="none" stroke="#00e8ff" strokeWidth="1" strokeOpacity="0.28" />

      {/* Top arch fold */}
      <path d="M 352 306 Q 376 292 400 296 Q 424 292 448 306" fill="none" stroke="#00e8ff" strokeWidth="1" strokeOpacity="0.22" />

      {/* Scan line */}
      <clipPath id="brain-scan-clip"><circle cx="400" cy="400" r="163" /></clipPath>
      <g clipPath="url(#brain-scan-clip)">
        <line x1="238" y1="270" x2="562" y2="270" stroke="#00e5ff" strokeWidth="1.5" strokeOpacity="0">
          <animate attributeName="y1" values="240;560;240" dur="4.5s" repeatCount="indefinite" />
          <animate attributeName="y2" values="240;560;240" dur="4.5s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0;0.38;0.38;0" dur="4.5s" repeatCount="indefinite" keyTimes="0;0.07;0.93;1" />
        </line>
      </g>

      {/* Inner glow rings (where gold paths converge into brain) */}
      <circle cx="400" cy="400" r="175" fill="none" stroke="#ffb700" strokeWidth="1.2" strokeOpacity="0.1"
        style={{ animation: 'gold-pulse 3s ease-in-out infinite' }} />
      <circle cx="400" cy="400" r="185" fill="none" stroke="#ffd060" strokeWidth="0.7" strokeOpacity="0.07"
        style={{ animation: 'gold-pulse 4s ease-in-out infinite', animationDelay: '1.5s' }} />

      {/* Central intelligence core */}
      <circle cx="400" cy="392" r="22" fill="white" fillOpacity="0.1"
        style={{ animation: 'glow-pulse 2.5s ease-in-out infinite' }} />
      <circle cx="400" cy="392" r="9" fill="white" fillOpacity="0.55" />
      <circle cx="400" cy="392" r="4" fill="#e0f8ff" fillOpacity="0.9" />

      {/* Subtle cyan particles emanating from core */}
      <circle r="2" fill="url(#cyan-particle)" fillOpacity="0.7"
        style={{ animation: 'glow-pulse 3s ease-in-out infinite', animationDelay: '0s' }}>
        <animateTransform attributeName="transform" type="translate" from="400 392" to="420 370" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle r="2" fill="url(#cyan-particle)" fillOpacity="0.7">
        <animateTransform attributeName="transform" type="translate" from="400 392" to="378 415" dur="2.3s" begin="0.7s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0" dur="2.3s" begin="0.7s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
