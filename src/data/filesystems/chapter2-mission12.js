export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
  '/var/log/syslog': { type: 'file', content: 'Jun 25 02:00:01 server CRON[1234]: (root) CMD (/opt/backup.sh)\nJun 25 03:00:01 server CRON[1235]: (root) CMD (/opt/backup.sh)\nJun 25 04:00:01 server CRON[1236]: (root) CMD (/opt/backup.sh)' },
  '/opt': { type: 'dir' },
  '/opt/backup.sh': { type: 'file', content: '#!/bin/bash\necho "Backup running..."\necho "Backup done"' },
};
