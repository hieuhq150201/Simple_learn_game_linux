'use client'
import { classifyLine } from '../../utils/terminalColors';
import type { TerminalEntry } from './useTerminal';

// Render 1 entry trong lịch sử terminal: prompt + lệnh, output (colored), explanation, hint
const LINE_COLOR: Record<string, string> = {
  default: 'text-green-400',
  error: 'text-red-400',
};

function OutputLine({ line }: { line: string }): JSX.Element {
  const type = classifyLine(line);
  return <div className={LINE_COLOR[type]}>{line}</div>;
}

export default function TerminalOutput({ entries }: { entries: TerminalEntry[] }): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      {entries.map((entry) => (
        <div key={entry.id} className="flex flex-col">
          <div className="flex gap-2 text-green-400">
            <span className="text-indigo-400 shrink-0">root@hacklab:~$</span>
            <span className="break-all">{entry.command}</span>
          </div>

          {entry.isLoading ? (
            <div className="text-gray-500 animate-pulse pl-1">...</div>
          ) : (
            <>
              {entry.output?.split('\n').filter(Boolean).map((line, i) => (
                <OutputLine key={i} line={line} />
              ))}
              {entry.explanation && (
                <div className="text-indigo-400 pl-1 mt-1">💡 {entry.explanation}</div>
              )}
              {entry.nextHint && (
                <div className="text-yellow-400 pl-1">→ {entry.nextHint}</div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
