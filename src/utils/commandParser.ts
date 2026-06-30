// Các lệnh đặc biệt xử lý ở frontend, không gọi API — theo CLAUDE.md
const FRONTEND_COMMANDS = new Set(['clear', 'cls', 'hint', 'exit', 'help']);

export interface ParsedCommand {
  raw: string;
  cmd: string;
  args: string[];
  isFrontendCommand: boolean;
}

export function parseCommand(rawInput: string): ParsedCommand {
  const trimmed = rawInput.trim();
  const [cmd, ...args] = trimmed.split(/\s+/);
  return {
    raw: trimmed,
    cmd: cmd || '',
    args,
    isFrontendCommand: FRONTEND_COMMANDS.has(cmd),
  };
}
