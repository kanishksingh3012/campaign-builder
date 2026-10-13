import type { ReactNode } from 'react'

// Banner creatives for the fictional brand, drawn as SVG so they stay sharp at any size.
// Artwork has fixed colours on purpose: an ad looks the same in light and dark mode.

const W = 600
const H = 220

/** A crimped snack bag with the brand label. */
function Pack({ x, y, rotate = 0, scale = 1, body, band, label }: { x: number; y: number; rotate?: number; scale?: number; body: string; band: string; label: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d="M-44 -66 l8 -8 8 8 8 -8 8 8 8 -8 8 8 8 -8 8 8 8 -8 8 8 8 -8 V66 l-8 8 -8 -8 -8 8 -8 -8 -8 8 -8 -8 -8 8 -8 -8 -8 8 -8 -8 -8 8 Z" fill={body} />
      <path d="M-44 -66 V66 l8 8 V-74 Z" fill="#000" opacity="0.12" />
      <rect x="-44" y="-22" width="88" height="44" fill={band} />
      <text x="0" y="-3" textAnchor="middle" fontSize="13" fontWeight="700" fill={body}>
        Crisp &amp; Co
      </text>
      <text x="0" y="13" textAnchor="middle" fontSize="9" fill={body} opacity="0.85">
        {label}
      </text>
      <ellipse cx="0" cy="-46" rx="16" ry="9" fill={band} opacity="0.9" />
    </g>
  )
}

function Chip({ x, y, r = 0, fill = '#FFD36B' }: { x: number; y: number; r?: number; fill?: string }) {
  return <ellipse cx={x} cy={y} rx="20" ry="11" transform={`rotate(${r} ${x} ${y})`} fill={fill} stroke="#00000022" />
}

function Cta({ x, y, fill, ink, children }: { x: number; y: number; fill: string; ink: string; children: string }) {
  return (
    <g>
      <rect x={x} y={y} width="104" height="30" rx="15" fill={fill} />
      <text x={x + 52} y={y + 20} textAnchor="middle" fontSize="13" fontWeight="600" fill={ink}>
        {children}
      </text>
    </g>
  )
}

function CrunchTime() {
  return (
    <>
      <rect width={W} height={H} fill="#F26A1B" />
      <circle cx="470" cy="110" r="150" fill="#FF8A3D" />
      <Chip x={352} y={52} r={-20} />
      <Chip x={560} y={64} r={30} />
      <Chip x={372} y={178} r={15} fill="#FFE29A" />
      <Chip x={556} y={170} r={-35} />
      <Pack x={466} y={112} rotate={8} scale={1.05} body="#FFF3E0" band="#C8370A" label="Classic Salted" />
      <text x="40" y="100" fontSize="46" fontWeight="800" fill="#FFF8EE" letterSpacing="-1.5">
        Crunch time.
      </text>
      <text x="42" y="130" fontSize="17" fill="#FFE6CF">
        Classic Salted, 52 g for ₹20
      </text>
      <Cta x={42} y={148} fill="#2A1206" ink="#FFF3E0">
        Add to cart
      </Cta>
    </>
  )
}

function FestivePack() {
  const diyas = [330, 392, 454, 516, 578]
  return (
    <>
      <rect width={W} height={H} fill="#4A1030" />
      <path d="M0 26 Q150 58 300 26 T600 26" fill="none" stroke="#E9B44C" strokeWidth="1.5" opacity="0.7" />
      {[30, 90, 150, 210, 270, 330, 390, 450, 510, 570].map((x, i) => (
        <circle key={x} cx={x} cy={i % 2 ? 40 : 30} r="5" fill={['#E9B44C', '#F26A1B', '#F7E3A1'][i % 3]} />
      ))}
      {diyas.map((x) => (
        <g key={x} transform={`translate(${x} 186)`}>
          <path d="M0 -30 q9 12 0 22 q-9 -10 0 -22" fill="#FFC53D" />
          <path d="M-18 0 q18 18 36 0 Z" fill="#C8752A" />
        </g>
      ))}
      <Pack x={402} y={104} rotate={-10} scale={0.8} body="#F7E3A1" band="#7A1E48" label="Masala Crunch" />
      <Pack x={470} y={98} rotate={2} scale={0.88} body="#FFF3E0" band="#C8370A" label="Party Pack" />
      <Pack x={538} y={106} rotate={12} scale={0.8} body="#F7E3A1" band="#2F6B4F" label="Cream & Onion" />
      <text x="40" y="96" fontSize="38" fontWeight="800" fill="#F7E3A1" letterSpacing="-1">
        Light up the party
      </text>
      <text x="42" y="124" fontSize="16" fill="#E7BFD1">
        Assorted party pack, 6 × 52 g for ₹110
      </text>
      <Cta x={42} y={142} fill="#E9B44C" ink="#3A0C25">
        Shop the pack
      </Cta>
    </>
  )
}

/** Deliberately over-written: this is the creative review rejects for too much text. */
function NewFlavours() {
  return (
    <>
      <rect width={W} height={H} fill="#0E6B67" />
      <Pack x={544} y={118} rotate={10} scale={0.62} body="#FFF3E0" band="#C8370A" label="Peri Peri" />
      <text x="24" y="52" fontSize="40" fontWeight="800" fill="#FDF6E3" letterSpacing="-1">
        New! Two bold flavours
      </text>
      <text x="24" y="88" fontSize="24" fontWeight="700" fill="#FFD36B">
        Peri Peri and Cheese Rings are here
      </text>
      <text x="24" y="118" fontSize="18" fill="#D6F2EE">
        Limited time launch offer, try both today and save more
      </text>
      <text x="24" y="144" fontSize="18" fill="#D6F2EE">
        Free delivery on your first order of any new flavour
      </text>
      <text x="24" y="170" fontSize="16" fill="#D6F2EE">
        Offer valid in select cities while stocks last. T&amp;C apply.
      </text>
      <text x="24" y="200" fontSize="22" fontWeight="800" fill="#FDF6E3">
        Order now, crunch now, repeat!
      </text>
    </>
  )
}

function Makhana() {
  const puffs: [number, number, number][] = [
    [352, 60, 17], [392, 150, 21], [338, 170, 13], [560, 52, 15], [572, 160, 19], [420, 44, 11],
  ]
  return (
    <>
      <rect width={W} height={H} fill="#DCE8D2" />
      <ellipse cx="470" cy="230" rx="210" ry="90" fill="#C5D8B8" />
      {puffs.map(([x, y, r]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={r} fill="#FBF7EC" stroke="#00000014" />
          <circle cx={x - r / 3} cy={y - r / 4} r={r / 6} fill="#8A6A44" opacity="0.55" />
          <circle cx={x + r / 3} cy={y + r / 5} r={r / 8} fill="#8A6A44" opacity="0.45" />
        </g>
      ))}
      <Pack x={476} y={110} rotate={-6} scale={1.02} body="#2F5D3A" band="#FBF7EC" label="Roasted Makhana" />
      <text x="40" y="84" fontSize="34" fontWeight="800" fill="#1F3D27" letterSpacing="-1">
        Light. Roasted.
      </text>
      <text x="40" y="122" fontSize="34" fontWeight="800" fill="#1F3D27" letterSpacing="-1">
        Makhana.
      </text>
      <text x="42" y="148" fontSize="16" fill="#3F5B45">
        70 g of guilt-free crunch for ₹99
      </text>
      <Cta x={42} y={162} fill="#1F3D27" ink="#F2F7EC">
        Try it
      </Cta>
    </>
  )
}

function MatchDay() {
  return (
    <>
      <rect width={W} height={H} fill="#0F1E3D" />
      <path d="M300 -10 L210 220 H330 Z" fill="#FFFFFF" opacity="0.06" />
      <path d="M520 -10 L400 220 H560 Z" fill="#FFFFFF" opacity="0.07" />
      <path d="M0 196 H600 V220 H0 Z" fill="#1E7A46" />
      <path d="M0 196 H600" stroke="#FFFFFF" strokeWidth="2" opacity="0.5" />
      <g transform="translate(398 46)">
        <circle r="18" fill="#C8281E" />
        <path d="M-13 -13 Q0 0 -13 13 M-7 -17 Q6 0 -7 17" fill="none" stroke="#FFF3E0" strokeWidth="1.4" />
      </g>
      <Pack x={452} y={110} rotate={-8} scale={0.9} body="#FFF3E0" band="#C8370A" label="Party Pack" />
      <Pack x={530} y={116} rotate={9} scale={0.82} body="#F7E3A1" band="#2F6B4F" label="Cream & Onion" />
      <text x="40" y="92" fontSize="40" fontWeight="800" fill="#FFFFFF" letterSpacing="-1.2">
        Match day combo
      </text>
      <text x="42" y="120" fontSize="16" fill="#B9C7E6">
        Party pack + Cream &amp; Onion, ready in minutes
      </text>
      <Cta x={42} y={138} fill="#F26A1B" ink="#FFF8EE">
        Get the combo
      </Cta>
    </>
  )
}

const DESIGNS: Record<string, () => ReactNode> = {
  'Crunch time banner': CrunchTime,
  'Festive party pack': FestivePack,
  'New flavours launch': NewFlavours,
  'Makhana healthy snacking': Makhana,
  'Match day combo': MatchDay,
}

export const hasCreativeArt = (name: string) => name in DESIGNS

/** The drawn banner for a creative, cropped to fill whatever box it is given. */
export function CreativeArt({ name, className = '' }: { name: string; className?: string }) {
  const Design = DESIGNS[name]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Banner: ${name}`} className={`block w-full rounded-xl ${className}`} fontFamily="inherit">
      <Design />
    </svg>
  )
}
