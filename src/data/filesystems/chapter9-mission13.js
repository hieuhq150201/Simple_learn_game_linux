// Chương 9 — Trust abuse (child -> parent domain qua SID history / krbtgt trust key).
// Đã là Domain Admin của child.corp.local, leo lên parent corp.local bằng cách forge inter-realm TGT.
// Flag ở /root/.flag trên DC của domain PARENT.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/notes.txt': {
    type: 'file',
    content: [
      'Đã DCSync xong child.corp.local, có đầy đủ hash + trust key (krbtgt) của domain con.',
      'child.corp.local có 2-way transitive trust với forest root corp.local (parent).',
      'Kế hoạch: lấy trust key liên-domain, forge inter-realm TGT mang SID history = Enterprise Admins của corp.local, request TGS sang DC của parent, DCSync ngược lại.',
    ].join('\n'),
  },
  '/root': { type: 'dir' },
  '/root/.flag': { type: 'file', content: 'FLAG{child_to_parent_sid_history_trust_abuse}' },
};
