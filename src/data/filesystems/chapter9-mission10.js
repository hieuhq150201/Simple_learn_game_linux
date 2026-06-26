// Chương 9 — Resource-Based Constrained Delegation (RBCD): mày có quyền WRITE thuộc tính
// msDS-AllowedToActOnBehalfOfOtherIdentity trên một máy -> tự cấp quyền delegate cho máy mày kiểm soát
// -> S4U mạo danh Administrator -> SYSTEM. Flag ở /root/.flag.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/notes.txt': {
    type: 'file',
    content: [
      'Đã chiếm được account svc_backup (có quyền GenericWrite trên object máy FILESRV01$).',
      'Mày cũng kiểm soát một máy đã join domain: PWNBOX$ (mày có hash của nó).',
      'Kế hoạch: ghi msDS-AllowedToActOnBehalfOfOtherIdentity của FILESRV01$ = PWNBOX$ -> S4U2Self/Proxy mạo danh Administrator tới FILESRV01.',
    ].join('\n'),
  },
  '/root': { type: 'dir' },
  '/root/.flag': { type: 'file', content: 'FLAG{rbcd_self_granted_delegation}' },
};
