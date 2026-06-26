export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/.bashrc': { type: 'file', content: '# .bashrc\nexport PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin"\nexport LANG=en_US.UTF-8\n# Add custom vars here' },
  '/bin': { type: 'dir' },
  '/bin/bash': { type: 'file', content: '' },
};
