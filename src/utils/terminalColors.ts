// Map các loại output sang class màu Tailwind tương ứng theme hacker
export const LINE_TYPES = {
  default: 'text-green-400',
  error: 'text-red-400',
  hint: 'text-yellow-400',
  info: 'text-indigo-400',
  prompt: 'text-green-400',
};

// Phân loại 1 dòng output thô từ AI để áp màu — dựa trên prefix/từ khóa thường gặp trong bash
export function classifyLine(line: string): keyof typeof LINE_TYPES {
  const lower = line.toLowerCase();
  if (
    lower.startsWith('bash:') ||
    lower.includes('permission denied') ||
    lower.includes('no such file or directory') ||
    lower.includes('command not found') ||
    lower.includes('error')
  ) {
    return 'error';
  }
  return 'default';
}
