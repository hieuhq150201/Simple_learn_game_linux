'use client'
import { useEffect, useRef } from 'react'
import { TrophyIcon } from './TrophyIcon'

interface ChapterCompleteModalProps {
  chapterId: number
  chapterTitle: string
  onClose: () => void
  onNextChapter?: () => void
}

export default function ChapterCompleteModal({ chapterId, chapterTitle, onClose, onNextChapter }: ChapterCompleteModalProps) {
  const xpRef = useRef<HTMLParagraphElement>(null)

  // Animate XP counter
  useEffect(() => {
    const xp = chapterId * 500
    let current = 0
    const step = Math.ceil(xp / 40)
    const timer = setInterval(() => {
      current = Math.min(current + step, xp)
      if (xpRef.current) xpRef.current.textContent = `+${current}`
      if (current >= xp) clearInterval(timer)
    }, 30)
    return () => clearInterval(timer)
  }, [chapterId])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-md border-2 border-green-500/60 rounded-xl bg-gray-950 shadow-2xl shadow-green-900/30 overflow-hidden animate-celebrate-in">
        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,0,0.015) 3px, rgba(0,255,0,0.015) 4px)' }}
        />

        {/* Header bar */}
        <div className="bg-green-900/30 border-b border-green-700/40 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 font-mono text-xs tracking-widest font-bold">CHAPTER COMPLETE</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center gap-5 px-8 py-8">
          <TrophyIcon tier="gold" size={80} unlocked />

          <div className="text-center">
            <p className="text-green-400 font-mono text-xs tracking-[0.25em] mb-1">CHƯƠNG {chapterId} ĐÃ CHINH PHỤC</p>
            <h2 className="text-white font-bold text-xl">{chapterTitle}</h2>
          </div>

          {/* XP earned */}
          <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-600/30 rounded-lg px-5 py-2.5">
            <span className="text-yellow-400 text-2xl">⚡</span>
            <div>
              <p className="text-yellow-300 font-mono font-bold text-xl" ref={xpRef}>+0</p>
              <p className="text-yellow-600 text-xs font-mono">XP kiếm được</p>
            </div>
          </div>

          {/* Separator */}
          <div className="w-full flex items-center gap-3">
            <div className="flex-1 h-px bg-green-900/50" />
            <span className="text-green-800 text-xs font-mono">◆</span>
            <div className="flex-1 h-px bg-green-900/50" />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            {onNextChapter && (
              <button
                onClick={() => { onClose(); onNextChapter() }}
                className="flex-1 bg-green-700 hover:bg-green-600 text-white font-mono font-bold text-sm py-2.5 px-4 rounded-lg transition-colors"
              >
                Chương tiếp theo →
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 border border-green-700/50 hover:border-green-500 text-green-400 font-mono text-sm py-2.5 px-4 rounded-lg transition-colors"
            >
              Về bản đồ chương
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
