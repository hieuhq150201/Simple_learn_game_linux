// Mission 3: Filter log để tìm tất cả dòng có chữ "ERROR" và lưu ra file riêng
const content = [
  '[2026-06-24 04:00:01] INFO: request handled in 12ms',
  '[2026-06-24 04:00:02] ERROR: timeout connecting to upstream payment-service',
  '[2026-06-24 04:00:03] INFO: cache hit ratio 92%',
  '[2026-06-24 04:00:04] ERROR: invalid JWT signature for request id 88291',
  '[2026-06-24 04:00:05] WARN: retrying request id 88291',
  '[2026-06-24 04:00:06] ERROR: max retries exceeded for request id 88291',
  '[2026-06-24 04:00:07] INFO: request handled in 8ms',
].join('\n');

export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
  '/var/log/api.log': { type: 'file', content },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};
