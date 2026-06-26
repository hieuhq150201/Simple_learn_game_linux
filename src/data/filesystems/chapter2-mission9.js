export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
  '/var/log/syslog': { type: 'file', content: 'Jun 25 10:00:00 server kernel: [12345.123456] CPU usage high\nJun 25 10:05:00 server systemd[1]: mysql.service started\nJun 25 10:10:00 server kernel: [12350.654321] Memory pressure increasing' },
};
