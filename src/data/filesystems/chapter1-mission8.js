// Ch1 M8 — Phù thủy ký tự đại diện: glob trong ls/find/rm chạy thật.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/logs': { type: 'dir' },
  '/home/hacker/logs/app.log': { type: 'file', content: 'app log' },
  '/home/hacker/logs/error.log': { type: 'file', content: 'error log' },
  '/home/hacker/logs/access.log': { type: 'file', content: 'access log' },
  '/home/hacker/logs/debug.txt': { type: 'file', content: 'debug notes' },
  '/home/hacker/logs/report-01.csv': { type: 'file', content: 'id,val\n1,a' },
  '/home/hacker/logs/report-02.csv': { type: 'file', content: 'id,val\n2,b' },
  '/home/hacker/logs/report-final.csv': { type: 'file', content: 'id,val\n9,z' },
  '/home/hacker/logs/old.log.bak': { type: 'file', content: 'backup' },
};
