// Ch1 M11 — dựng cây thư mục (mkdir -p, touch, cp). Bắt đầu từ home gần trống + 1 file mẫu.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/config.example': {
    type: 'file',
    content: 'PORT=8080\nDEBUG=false\nDB_HOST=localhost',
  },
};
