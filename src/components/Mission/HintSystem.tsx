'use client'
import dynamic from 'next/dynamic'
import { useState } from 'react'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

interface HintSystemProps {
  onRequestHint: () => void
  hintsUsedCount: number
  maxHints: number
}

type HintState = 'fresh' | 'encouraged' | 'curious' | 'last' | 'locked'

function getHintState(used: number, max: number): HintState {
  if (used >= max) return 'locked'
  if (used === 0) return 'fresh'
  if (used === 1) return 'encouraged'
  if (used === max - 1) return 'last'
  return 'curious'
}

const STATE_CONFIG: Record<HintState, {
  emoji: string
  lottieFile?: string
  lottieSize: number
  text: string
  subtext?: string
  btnLabel: string
  btnClass: string
  boxClass: string
}> = {
  fresh: {
    emoji: '💡',
    lottieSize: 0,
    text: 'Bí rồi à? Không sao — gợi ý đây.',
    btnLabel: 'Xem gợi ý đầu tiên',
    btnClass: 'border-yellow-400/40 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-400/10',
    boxClass: 'border-yellow-400/20',
  },
  encouraged: {
    emoji: '💪',
    lottieSize: 0,
    text: 'Ổn thôi, nhưng thật ra đang rất gần rồi đó.',
    subtext: 'Thử thêm một lần nữa trước khi đọc nhé?',
    btnLabel: 'Xem gợi ý tiếp theo',
    btnClass: 'border-green-400/40 text-green-600 dark:text-green-400 hover:bg-green-400/10',
    boxClass: 'border-green-400/20',
  },
  curious: {
    emoji: '🤔',
    lottieFile: '/lottie/thinking.json',
    lottieSize: 44,
    text: 'Gợi ý thứ 2 rồi đó. Không phán xét —',
    subtext: 'nhưng đáp án đang ở ngay trước mặt thôi.',
    btnLabel: 'Xem gợi ý tiếp theo',
    btnClass: 'border-orange-400/40 text-orange-600 dark:text-orange-400 hover:bg-orange-400/10',
    boxClass: 'border-orange-400/20',
  },
  last: {
    emoji: '😏',
    lottieFile: '/lottie/facepalm.json',
    lottieSize: 52,
    text: 'Gợi ý cuối đây. Tin là sau lần này sẽ hiểu —',
    subtext: 'vì đơn giản là không còn lần nào nữa đâu 😄',
    btnLabel: 'Gợi ý cuối — và là cuối thật',
    btnClass: 'border-red-400/40 text-red-500 dark:text-red-400 hover:bg-red-400/10',
    boxClass: 'border-red-400/20',
  },
  locked: {
    emoji: '☠️',
    lottieFile: '/lottie/skull.json',
    lottieSize: 52,
    text: 'Hết hint rồi. Nhưng đáp án vẫn đang nằm',
    subtext: 'ngay trong terminal — chỉ cần nhìn lại thôi. Hacker thật không bỏ cuộc đâu 👀',
    btnLabel: 'Đã dùng hết hint',
    btnClass: 'opacity-40 cursor-not-allowed border-hp-border text-hp-subtle',
    boxClass: 'border-hp-border',
  },
}

export default function HintSystem({ onRequestHint, hintsUsedCount, maxHints }: HintSystemProps): JSX.Element {
  const [animating, setAnimating] = useState(false)
  const [lottieData, setLottieData] = useState<Record<string, unknown> | null>(null)

  const state = getHintState(hintsUsedCount, maxHints)
  const cfg = STATE_CONFIG[state]

  // Lazy load Lottie JSON khi cần
  const loadLottie = async (file: string) => {
    try {
      const res = await fetch(file)
      const data = await res.json()
      setLottieData(data)
    } catch { /* fallback to emoji */ }
  }

  function handleHint() {
    if (state === 'locked') return
    setAnimating(true)
    setTimeout(() => setAnimating(false), 400)
    if (cfg.lottieFile) loadLottie(cfg.lottieFile)
    onRequestHint()
  }

  // Respect prefers-reduced-motion
  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  return (
    <div className={`rounded-md border p-3 flex flex-col gap-2 transition-colors ${cfg.boxClass} ${animating && !prefersReduced ? 'animate-shake' : ''}`}>
      <div className="flex items-start gap-2">
        {cfg.lottieFile && lottieData ? (
          <div style={{ width: cfg.lottieSize, height: cfg.lottieSize, flexShrink: 0 }}>
            <Lottie animationData={lottieData} loop style={{ width: cfg.lottieSize, height: cfg.lottieSize }} />
          </div>
        ) : (
          <span className="text-lg shrink-0">{cfg.emoji}</span>
        )}
        <div>
          <p className="text-hp-fg text-xs leading-relaxed">{cfg.text}</p>
          {cfg.subtext && <p className="text-hp-muted text-xs leading-relaxed">{cfg.subtext}</p>}
        </div>
      </div>

      {/* Progress bar hints */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-0.5">
          {Array.from({ length: maxHints }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i < hintsUsedCount ? 'bg-yellow-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        <span className="text-hp-subtle text-[10px] font-mono shrink-0">{hintsUsedCount}/{maxHints}</span>
      </div>

      <button
        onClick={handleHint}
        disabled={state === 'locked'}
        className={`w-full py-1.5 rounded border text-xs font-mono transition-colors ${cfg.btnClass}`}
      >
        {cfg.btnLabel}
      </button>
    </div>
  )
}
