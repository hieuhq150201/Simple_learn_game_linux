interface AvatarProps {
  avatarUrl?: string | null
  displayName?: string | null
  email?: string
  size?: number
  className?: string
}

export function Avatar({ avatarUrl, displayName, email, size = 28, className = '' }: AvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        width={size}
        height={size}
        className={`rounded-full object-cover border border-green-800 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  const initial = (displayName?.[0] ?? email?.[0] ?? '?').toUpperCase()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="6" fill="#0f1a0f" />
      {/* scanline effect */}
      <rect width="32" height="1" y="8"  fill="#4ade80" opacity="0.07" />
      <rect width="32" height="1" y="16" fill="#4ade80" opacity="0.07" />
      <rect width="32" height="1" y="24" fill="#4ade80" opacity="0.07" />
      {/* corner brackets */}
      <path d="M3 3 h5 M3 3 v5"  stroke="#4ade80" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M29 3 h-5 M29 3 v5" stroke="#4ade80" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M3 29 h5 M3 29 v-5"  stroke="#4ade80" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M29 29 h-5 M29 29 v-5" stroke="#4ade80" strokeWidth="1.5" fill="none" opacity="0.6" />
      {/* initial */}
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontFamily="monospace"
        fontWeight="bold"
        fontSize="14"
        fill="#4ade80"
      >
        {initial}
      </text>
    </svg>
  )
}
