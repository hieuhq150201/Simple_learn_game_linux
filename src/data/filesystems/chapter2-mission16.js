export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
  '/var/log/syslog': { type: 'file', content: 'Jun 25 03:00:00 server systemd[1]: Started Backup Service\nJun 25 03:00:05 server backup.sh[1234]: Backup started\nJun 25 03:00:30 server backup.sh[1234]: Backup completed' },
  '/tmp': { type: 'dir' },
  '/tmp/incident.log': { type: 'file', content: '' },
};
