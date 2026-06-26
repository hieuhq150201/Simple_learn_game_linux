// Chương 9 — Unconstrained delegation: máy bật unconstrained giữ TGT của mọi user ghé qua.
// Chiếm máy đó -> dump cache -> lấy TGT Domain Admin -> mimikatz pass-the-ticket. Flag ở /root/.flag.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/notes.txt': {
    type: 'file',
    content: [
      'Đã có shell SYSTEM trên APP01 (10.10.10.30) qua một lỗ web riêng (không phải nhiệm vụ bài này).',
      'Enum AD cho thấy APP01$ có cờ TRUSTED_FOR_DELEGATION (unconstrained) — máy này lưu TGT bất kỳ ai ghé qua.',
      'Kế hoạch: dump ticket cache trên APP01, tìm TGT của Domain Admin (vd backup_adm) lỡ login qua, pass-the-ticket lên DC.',
    ].join('\n'),
  },
  '/root': { type: 'dir' },
  '/root/.flag': { type: 'file', content: 'FLAG{unconstrained_delegation_tgt_harvest}' },
};
