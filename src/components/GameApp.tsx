'use client'
// Client Component wrapper so Next.js page (Server Component) can render the game.
// ssr: false avoids "localStorage is not defined" during prerender —
// the game is 100% client-side (terminal state, progress in localStorage).
import dynamic from 'next/dynamic'

const App = dynamic(() => import('../App.jsx'), { ssr: false })

export function GameApp() {
  return <App />
}
