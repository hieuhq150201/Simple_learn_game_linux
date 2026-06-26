// Ch1 M5 — Quyền hạn quyết định: 1 script cần đổi quyền. ls -l/cat chạy thật, chmod canned.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/deploy.sh': {
    type: 'file',
    content: '#!/bin/bash\n# Script deploy production\nrsync -avz ./build/ deploy@prod:/var/www/app/\nsystemctl restart nginx',
  },
  '/home/hacker/secrets.env': { type: 'file', content: 'DB_PASSWORD=s3cr3t\nAPI_KEY=ak_live_9f8a7b6c' },
  '/home/hacker/notes.txt': { type: 'file', content: 'deploy.sh đang -rw-r--r-- nên không chạy được. secrets.env thì cả thế giới đọc được — nguy hiểm.' },
};
