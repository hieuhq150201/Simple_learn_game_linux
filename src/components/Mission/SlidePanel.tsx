'use client'
import { useEffect } from 'react'

interface SlidePanelProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

export default function SlidePanel({ open, title, onClose, children }: SlidePanelProps): JSX.Element {
  // Đóng khi bấm Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="absolute inset-0 z-30 bg-black/40 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`absolute top-0 right-0 h-full w-[320px] z-40 flex flex-col bg-hp-card border-l border-hp-border shadow-2xl transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-hp-border shrink-0">
          <span className="text-hp-fg font-semibold text-sm">{title}</span>
          <button
            onClick={onClose}
            className="text-hp-subtle hover:text-hp-fg text-xl leading-none"
            aria-label="Đóng panel"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  )
}
