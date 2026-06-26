// Chương 9 — GPO abuse: mày có quyền edit một GPO link tới OU chứa máy nhân viên IT
// -> dùng GPO để thêm local admin / scheduled task chạy dưới SYSTEM trên toàn bộ máy trong OU.
// Flag ở /root/.flag (đọc trên một máy bị GPO áp).
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/notes.txt': {
    type: 'file',
    content: [
      'BloodHound báo: hacker(tôi) có WriteGPLink/GenericWrite trên GPO "IT-Workstations-Policy".',
      'GPO này link tới OU=IT,DC=corp,DC=local — chứa toàn bộ máy của phòng IT.',
      'Kế hoạch: dùng pyGPOAbuse/SharpGPOAbuse chỉnh GPO thêm immediate scheduled task chạy SYSTEM, đợi GPO áp xuống máy trong OU, gpupdate, rồi đọc flag.',
    ].join('\n'),
  },
  '/root': { type: 'dir' },
  '/root/.flag': { type: 'file', content: 'FLAG{gpo_abuse_scheduled_task_system}' },
};
