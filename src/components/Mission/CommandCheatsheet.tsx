'use client'
import { useState } from 'react';

interface CommandItem {
  cmd: string;
  desc: string;
}

// Bảng tra lệnh cơ bản cho người chưa từng dùng terminal; tự chứa, collapse gọn
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

export default function CommandCheatsheet(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-term-border rounded-lg bg-gray-950/60">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm text-gray-300 transition-colors hover:text-indigo-400"
      >
        <span>⌨ Lệnh cơ bản</span>
        <span className="text-xs text-gray-500">{open ? 'Đóng ▲' : 'Mở ▼'}</span>
      </button>

      {open && (
        <ul className="max-h-64 overflow-y-auto border-t border-term-border px-3 py-2 space-y-1.5">
          {COMMANDS.map(({ cmd, desc }) => (
            <li key={cmd} className="flex gap-2 text-xs leading-relaxed">
              <code className="shrink-0 font-mono text-green-400">{cmd}</code>
              <span className="text-gray-400">{desc}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
