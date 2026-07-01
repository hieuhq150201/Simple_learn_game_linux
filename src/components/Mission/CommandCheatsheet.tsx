'use client'
import { useState } from 'react';

interface CommandItem {
  cmd: string;
  desc: string;
}

const COMMANDS: CommandItem[] = [
  { cmd: 'pwd', desc: 'In ra thư mục hiện tại đang đứng.' },
  { cmd: 'ls', desc: 'Liệt kê file & thư mục (thêm -la để xem chi tiết + file ẩn).' },
  { cmd: 'cd', desc: 'Đổi thư mục (cd .. lên 1 cấp, cd ~ về home).' },
  { cmd: 'cat', desc: 'In toàn bộ nội dung 1 file ra màn hình.' },
  { cmd: 'head', desc: 'Xem các dòng ĐẦU của file (mặc định 10 dòng).' },
  { cmd: 'tail', desc: 'Xem các dòng CUỐI của file (tail -n 50 cho 50 dòng).' },
  { cmd: 'grep', desc: 'Tìm các dòng chứa từ khóa trong file.' },
  { cmd: 'find', desc: 'Tìm file theo tên/đặc điểm trong cây thư mục.' },
  { cmd: 'mkdir', desc: 'Tạo thư mục mới.' },
  { cmd: 'touch', desc: 'Tạo file rỗng mới (hoặc cập nhật thời gian file).' },
  { cmd: 'rm', desc: 'Xóa file (rm -r để xóa cả thư mục — cẩn thận!).' },
  { cmd: 'clear', desc: 'Xóa sạch màn hình terminal.' },
  { cmd: 'help', desc: 'Hiện danh sách các bước cần làm trong mission.' },
  { cmd: 'hint', desc: 'Xin gợi ý (3 cấp độ tăng dần).' },
  { cmd: 'exit', desc: 'Thoát mission, về bản đồ chương.' },
];

export default function CommandCheatsheet({ embedded = false }: { embedded?: boolean }): JSX.Element {
  const [open, setOpen] = useState(embedded);

  if (embedded) {
    // Trong slide panel: hiển thị thẳng, không có accordion
    return (
      <ul className="space-y-2">
        {COMMANDS.map(({ cmd, desc }) => (
          <li key={cmd} className="flex gap-2 text-xs leading-relaxed">
            <code className="shrink-0 font-mono text-green-600 dark:text-green-400">{cmd}</code>
            <span className="text-hp-muted">{desc}</span>
          </li>
        ))}
      </ul>
    );
  }

  // Standalone (không dùng nữa nhưng giữ để backward compat)
  return (
    <div className="border border-hp-border rounded-lg bg-hp-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm text-hp-fg transition-colors hover:text-indigo-400"
      >
        <span>⌨ Lệnh cơ bản</span>
        <span className="text-xs text-hp-subtle">{open ? 'Đóng ▲' : 'Mở ▼'}</span>
      </button>
      {open && (
        <ul className="max-h-64 overflow-y-auto border-t border-hp-border px-3 py-2 space-y-1.5">
          {COMMANDS.map(({ cmd, desc }) => (
            <li key={cmd} className="flex gap-2 text-xs leading-relaxed">
              <code className="shrink-0 font-mono text-green-600 dark:text-green-400">{cmd}</code>
              <span className="text-hp-muted">{desc}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
