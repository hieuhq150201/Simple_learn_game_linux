'use client'
import { useEffect, useRef } from 'react';
import TerminalOutput from './TerminalOutput.jsx';
import TerminalInput from './TerminalInput.jsx';

// Khung terminal UI: scroll output + input dòng lệnh, auto-scroll xuống cuối khi có entry mới
export default function Terminal({ entries, commandHistory, onSubmit, isLoading }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [entries]);

  return (
    <div className="flex flex-col h-full border border-term-border rounded-lg overflow-hidden bg-black/40">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-term-border bg-gray-900/60">
        <span className="w-3 h-3 rounded-full bg-red-500/70" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <span className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-2 text-xs text-gray-500">root@hacklab:~</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 text-sm leading-relaxed">
        {entries.length === 0 && (
          <div className="text-gray-500">Gõ lệnh để bắt đầu. Gõ `help` để xem các bước cần làm, `hint` nếu bí.</div>
        )}
        <TerminalOutput entries={entries} />
      </div>

      <div className="px-4 py-3 border-t border-term-border text-sm">
        <TerminalInput onSubmit={onSubmit} history={commandHistory} disabled={isLoading} />
      </div>
    </div>
  );
}
