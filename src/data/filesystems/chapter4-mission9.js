// Chương 4 — Mission 9: Rsync với exclude và dry-run
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/.ssh': { type: 'dir' },
  '/home/hacker/project': { type: 'dir' },
  '/home/hacker/project/index.js': {
    type: 'file',
    content: 'console.log("Hello World");',
  },
  '/home/hacker/project/package.json': {
    type: 'file',
    content: '{"name": "myapp", "version": "1.0.0"}',
  },
  '/home/hacker/project/.env': {
    type: 'file',
    content: 'DB_PASSWORD=secret123\nAPI_KEY=hidden',
  },
  '/home/hacker/project/node_modules': { type: 'dir' },
};
