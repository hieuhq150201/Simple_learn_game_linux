// Chương 9 — Final boss: LAPS read (đọc mật khẩu local admin random hoá) rồi pivot, kết thúc bằng
// dump toàn bộ NTDS.dit từ DC (mọi hash trong domain) qua secretsdump. Flag ở /root/.flag.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/notes.txt': {
    type: 'file',
    content: [
      'Đã là member nhóm "Helpdesk-LAPS-Readers" (qua chuỗi ACL các bài trước) — nhóm này có quyền đọc thuộc tính LAPS.',
      'SRV-FILE01 nằm trong scope, dùng LAPS để random hoá mật khẩu local Administrator.',
      'Kế hoạch cuối: đọc ms-Mcs-AdmPwd trên SRV-FILE01 -> login local admin -> pivot tới DC bằng creds cấp cao hơn đã gom được toàn chương -> secretsdump toàn bộ NTDS.dit -> đọc flag.',
    ].join('\n'),
  },
  '/root': { type: 'dir' },
  '/root/.flag': { type: 'file', content: 'FLAG{laps_read_then_ntds_dit_full_dump}' },
};
