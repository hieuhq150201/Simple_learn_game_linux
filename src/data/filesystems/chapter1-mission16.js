// Ch1 M16 — capstone điều tra: grep -rn + cut + sort + uniq -c + redirect. /var/log nhiều file.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
  '/var/log/auth.log': {
    type: 'file',
    content: [
      'Jun 25 02:14:33 web sshd[1233]: Failed password for root from 203.0.113.7 port 40222',
      'Jun 25 02:14:35 web sshd[1233]: Failed password for root from 203.0.113.7 port 40224',
      'Jun 25 02:15:01 web sshd[1240]: Accepted password for hacker from 10.0.0.5 port 51000',
      'Jun 25 03:02:11 web sshd[1450]: Failed password for root from 198.51.100.9 port 33890',
    ].join('\n'),
  },
  '/var/log/app.log': {
    type: 'file',
    content: 'INFO boot ok\nERROR db timeout\nERROR cache miss\nERROR db timeout',
  },
};
