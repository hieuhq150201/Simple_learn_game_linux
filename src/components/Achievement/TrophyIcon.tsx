type TrophyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

const tierColors: Record<TrophyTier, { cup: string; handle: string; base: string; shine: string; glow: string }> = {
  bronze: { cup: '#cd7f32', handle: '#9c5a1d', base: '#b8661a', shine: 'rgba(255,200,120,0.25)', glow: 'rgba(205,127,50,0.5)' },
  silver: { cup: '#c8c8c8', handle: '#909090', base: '#b0b0b0', shine: 'rgba(255,255,255,0.3)', glow: 'rgba(180,180,180,0.4)' },
  gold: { cup: '#ffd700', handle: '#b8960c', base: '#daa520', shine: 'rgba(255,255,180,0.35)', glow: 'rgba(255,215,0,0.5)' },
  platinum: { cup: '#d8d8f8', handle: '#8080c0', base: '#a8a8e0', shine: 'rgba(220,220,255,0.4)', glow: 'rgba(140,140,220,0.5)' },
  diamond: { cup: '#a8f0ff', handle: '#40a8d0', base: '#60c8e8', shine: 'rgba(200,250,255,0.45)', glow: 'rgba(80,200,230,0.6)' },
}

interface TrophyIconProps {
  tier?: TrophyTier
  size?: number
  unlocked?: boolean
  className?: string
}

export function TrophyIcon({ tier = 'gold', size = 40, unlocked = true, className = '' }: TrophyIconProps) {
  const c = tierColors[tier]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 48"
      className={className}
      style={{
        filter: unlocked ? `drop-shadow(0 0 5px ${c.glow})` : 'none',
        opacity: unlocked ? 1 : 0.18,
        transition: 'opacity 0.3s, filter 0.3s',
      }}
    >
      {/* Cup bowl */}
      <path d="M9 3 H31 L26 22 H14 Z" fill={c.cup} />
      {/* Shine on cup */}
      <path d="M13 5 L11 16 L14 15 L15 5 Z" fill={c.shine} />
      {/* Left handle */}
      <path d="M9 6 C1 6 1 18 9 18" fill="none" stroke={c.handle} strokeWidth="2.5" strokeLinecap="round" />
      {/* Right handle */}
      <path d="M31 6 C39 6 39 18 31 18" fill="none" stroke={c.handle} strokeWidth="2.5" strokeLinecap="round" />
      {/* Stem */}
      <rect x="17.5" y="22" width="5" height="12" rx="1" fill={c.handle} />
      {/* Base */}
      <rect x="9" y="34" width="22" height="6" rx="3" fill={c.base} />
      {/* Base shine */}
      <rect x="9" y="34" width="22" height="2.5" rx="2" fill={c.shine} />
      {/* Star accent on cup (for gold+) */}
      {(tier === 'gold' || tier === 'platinum' || tier === 'diamond') && (
        <text x="20" y="16" textAnchor="middle" fontSize="8" fill="white" opacity="0.7">★</text>
      )}
    </svg>
  )
}

export type { TrophyTier }
