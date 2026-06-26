// Ch1 M14 — top-N từ log (cut, sort, uniq -c, sort -rn, head). Có access.log thật để pipe.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/access.log': {
    type: 'file',
    content: [
      '203.0.113.7 GET /login 401',
      '203.0.113.7 GET /login 401',
      '10.0.0.5 GET /home 200',
      '203.0.113.7 GET /login 401',
      '198.51.100.9 GET /admin 403',
      '10.0.0.5 GET /home 200',
      '203.0.113.7 POST /login 200',
    ].join('\n'),
  },
};
