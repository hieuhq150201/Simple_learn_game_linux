// Chương 8 — Box Jenkins (Medium): Jenkins script console không auth -> Groovy RCE thành jenkins user
// -> đọc credentials.xml lộ mật khẩu root tái sử dụng -> su root -> flag. Flag CỐ ĐỊNH.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: [
      'BOX JENKINS — Target: 10.10.10.70 (black-box).',
      'Gợi ý chain: cổng 8080 chạy Jenkins, /script không yêu cầu login -> Groovy RCE thành jenkins',
      '-> credentials.xml lộ mật khẩu admin -> mật khẩu này TÁI SỬ DỤNG cho root -> su root.',
    ].join('\n'),
  },
  '/var': { type: 'dir' },
  '/var/lib': { type: 'dir' },
  '/var/lib/jenkins': { type: 'dir' },
  '/var/lib/jenkins/secrets': { type: 'dir' },
  // VULN: credential store lưu mật khẩu admin Jenkins, và admin DÙNG LẠI mật khẩu này cho root Linux.
  '/var/lib/jenkins/secrets/credentials.xml': {
    type: 'file',
    content: [
      '<com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>',
      '  <username>admin</username>',
      '  <password>J3nkins_R00t_2024!</password>',
      '</com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>',
      '<!-- admin reused this exact password for the root Linux account -->',
    ].join('\n'),
  },
  '/etc': { type: 'dir' },
  '/etc/passwd': {
    type: 'file',
    content: ['root:x:0:0:root:/root:/bin/bash', 'jenkins:x:1000:1000::/var/lib/jenkins:/bin/bash'].join('\n'),
  },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{jenkins_script_console_credential_reuse_root}' },
};
