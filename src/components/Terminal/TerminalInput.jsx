'use client'
import { useEffect, useRef, useState } from 'react';

// Input dòng lệnh với history điều hướng bằng mũi tên lên/xuống
export default function TerminalInput({ onSubmit, history, disabled }) {
  const [value, setValue] = useState('');
  const [historyIndex, setHistoryIndex] = useState(null);
  const inputRef = useRef(null);
  const composingRef = useRef(false); // đang ghép chữ bằng bộ gõ tiếng Việt (Telex/VNI)?

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      // Khi đang gõ tiếng Việt, phím Enter đầu tiên chỉ để CHỐT chữ của bộ gõ — không submit lệnh.
      // Nếu không chặn, Enter vừa chốt IME vừa submit -> lệnh bị gửi/lặp 2 lần.
      if (e.nativeEvent.isComposing || e.keyCode === 229 || composingRef.current) return;
      if (!value.trim()) return;
      onSubmit(value);
      setValue('');
      setHistoryIndex(null);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setValue(history[nextIndex]);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === null) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(null);
        setValue('');
      } else {
        setHistoryIndex(nextIndex);
        setValue(history[nextIndex]);
      }
    }
  }

  return (
    <div className="flex gap-2 items-center">
      <span className="text-indigo-400 shrink-0">root@hacklab:~$</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => { composingRef.current = true; }}
        onCompositionEnd={() => { composingRef.current = false; }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="flex-1 bg-transparent text-green-400 outline-none caret-green-400 disabled:opacity-50"
      />
      <span className="w-2 h-4 bg-green-400 animate-blink" />
    </div>
  );
}
