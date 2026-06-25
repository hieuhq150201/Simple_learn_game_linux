// Chương 5 — Mission 3: gobuster tìm hidden directory trên web server
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/index.html': { type: 'file', content: '<h1>Acme Corp</h1>' },
  '/var/www/html/.git': { type: 'dir' },
  '/var/www/html/.git/config': {
    type: 'file',
    content: '[remote "origin"]\n    url = git@github.com:acme/internal.git',
  },
  '/var/www/html/backup': { type: 'dir' },
  '/var/www/html/backup/db.sql.bak': { type: 'file', content: '-- mysqldump backup, contains the users table' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/wordlist.txt': {
    type: 'file',
    content: ['admin', 'backup', 'login', '.git', 'uploads', 'config'].join('\n'),
  },
};
