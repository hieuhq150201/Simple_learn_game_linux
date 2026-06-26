export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
  '/var/log/app': { type: 'dir' },
  '/var/log/app/error.log': { type: 'file', content: '2024-06-25 10:00:00 ERROR: Connection failed\n2024-06-25 10:00:05 WARN: Retry attempt 1\n2024-06-25 10:00:10 ERROR: Still cannot connect' },
};
