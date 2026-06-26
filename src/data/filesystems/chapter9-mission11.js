// Chương 9 — ACL abuse: BloodHound chỉ ra account của mày có GenericAll trên một user nhóm IT,
// và user đó có WriteDACL trên group Domain Admins -> tự cấp GenericAll cho mình trên group -> AddMember.
// Flag ở /root/.flag.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/notes.txt': {
    type: 'file',
    content: [
      'BloodHound vừa ingest xong dữ liệu cả domain (sharphound đã chạy trước, JSON đã có sẵn).',
      'Đường ACL nghi vấn: hacker(tôi) -GenericAll-> it_helpdesk -WriteDACL-> "Domain Admins".',
      'Kế hoạch: đổi mật khẩu it_helpdesk (GenericAll cho phép), dùng nó tự cấp GenericAll trên group Domain Admins (WriteDACL), rồi AddMember chính mình vào group.',
    ].join('\n'),
  },
  '/root': { type: 'dir' },
  '/root/.flag': { type: 'file', content: 'FLAG{acl_chain_genericall_writedacl_addmember}' },
};
