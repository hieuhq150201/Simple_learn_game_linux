'use client'
import { useCallback, useRef, useState } from 'react';
import { parseCommand } from '../../utils/commandParser.js';
import { evaluateCommand } from '../../utils/missionEngine.js';
import { HOME } from '../../utils/localShell.js';

let entryIdCounter = 0;

// Hook xử lý toàn bộ logic command cho 1 mission — HOÀN TOÀN OFFLINE (không gọi API).
// Lệnh frontend (clear/exit/help/hint) xử lý tại đây; lệnh thật đưa qua missionEngine (localShell + step match).
export function useTerminal({ chapter, mission, filesystem, applyFilesystemUpdate, onMissionComplete, onCommandRun, onHintUsed, onExit }) {
  const [entries, setEntries] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [missionCompleted, setMissionCompleted] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [cwd, setCwd] = useState(HOME);
  const hintLevelRef = useRef(0);

  const pushEntry = useCallback((entry) => {
    const id = ++entryIdCounter;
    setEntries((prev) => [...prev, { id, ...entry }]);
    return id;
  }, []);

  const handleSubmit = useCallback(
    (rawInput) => {
      const { cmd, raw } = parseCommand(rawInput);
      setCommandHistory((prev) => [...prev, raw]);

      if (cmd === 'clear' || cmd === 'cls') {
        setEntries([]);
        return;
      }

      if (cmd === 'exit') {
        onExit?.();
        return;
      }

      if (cmd === 'help') {
        const stepsList = mission.steps.map((s, i) => `${i + 1}. ${s.description}`).join('\n');
        pushEntry({ command: raw, output: `Các bước cần làm trong mission này:\n${stepsList}` });
        return;
      }

      if (cmd === 'hint') {
        if (mission.noHints) {
          pushEntry({ command: raw, output: 'Bài elite không có hint — tự lực.' });
          return;
        }
        hintLevelRef.current = Math.min(hintLevelRef.current + 1, mission.hints.length);
        const hintText = mission.hints[hintLevelRef.current - 1];
        pushEntry({ command: raw, output: `[Hint cấp ${hintLevelRef.current}] ${hintText}` });
        onHintUsed?.();
        return;
      }

      // Lệnh terminal thật — xử lý cục bộ qua engine offline
      onCommandRun?.();
      const result = evaluateCommand(raw, { mission, fs: filesystem, cwd, completedSteps });

      pushEntry({ command: raw, output: result.output });

      if (result.fsUpdate) applyFilesystemUpdate(result.fsUpdate);
      if (result.newCwd) setCwd(result.newCwd);

      if (result.completedStepIds.length > 0) {
        setCompletedSteps((prev) => {
          const next = new Set(prev);
          result.completedStepIds.forEach((id) => next.add(id));
          return next;
        });
      }

      if (result.missionCompleted && !missionCompleted) {
        setMissionCompleted(true);
        onMissionComplete?.({ usedHint: hintLevelRef.current > 0 });
      }
    },
    [mission, filesystem, cwd, completedSteps, missionCompleted, applyFilesystemUpdate, onMissionComplete, onCommandRun, onHintUsed, onExit, pushEntry]
  );

  // isLoading luôn false (engine đồng bộ) — giữ trong return để Terminal/TerminalInput không phải đổi API
  return { entries, commandHistory, handleSubmit, isLoading: false, missionCompleted, completedSteps };
}
