// Chương 4 — Mission 3: Sync thư mục code lên server production dùng rsync
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/.ssh': { type: 'dir' },
  '/home/hacker/.ssh/config': {
    type: 'file',
    content: ['Host prod', '    HostName 203.0.113.42', '    User deploy', '    Port 22'].join('\n'),
  },
  '/home/hacker/project': { type: 'dir' },
  '/home/hacker/project/index.js': {
    type: 'file',
    content: "const http = require('http');\nhttp.createServer((r, s) => s.end('ok')).listen(3000);\n",
  },
  '/home/hacker/project/package.json': {
    type: 'file',
    content: '{\n  "name": "app",\n  "version": "1.0.0",\n  "main": "index.js"\n}\n',
  },
  '/home/hacker/project/.env': {
    type: 'file',
    content: 'SECRET=do-not-sync\n',
  },
};
