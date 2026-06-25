// Chương 5 — Mission 16: UDP scan (-sU) + SNMP enum (khác hẳn TCP đã quét hết ở mission 5).
// nmap/snmpwalk là tool -> output canned. FS giữ note ngữ cảnh.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: 'TCP đã quét hết (mission trước). 10.10.14.55 còn UDP chưa đụng tới — SNMP hay bị quên mất, default community string "public" vẫn còn sống ở nhiều nơi.',
  },
};
