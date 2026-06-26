// Chương 8 — Box Tomcat Kernel (Hard, ít hint): nmap -p- ra Tomcat 8080 -> brute-force /manager
// creds yếu -> đóng gói WAR webshell, deploy qua Manager API -> RCE thành tomcat user -> đọc user.txt
// -> uname -r lộ kernel cũ dính CVE -> kernel exploit -> root -> root.txt. HAI cờ như box hard đầu (id 6),
// nhưng vector hoàn toàn khác (Tomcat/WAR + kernel exploit, không phải JWT/cmd injection/SUID).
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: [
      'BOX TOMCAT KERNEL — Target: 10.10.10.90 (black-box, ít hint).',
      'Full port scan trước, đừng tin cổng 80/443 là tất cả. Sau khi có shell, luôn check version kernel.',
    ].join('\n'),
  },
  '/opt': { type: 'dir' },
  '/opt/tomcat': { type: 'dir' },
  '/opt/tomcat/conf': { type: 'dir' },
  // VULN: creds mặc định/yếu cho Tomcat Manager — admin web UI cho phép deploy WAR -> RCE.
  '/opt/tomcat/conf/tomcat-users.xml': {
    type: 'file',
    content: [
      '<tomcat-users>',
      '  <role rolename="manager-gui"/>',
      '  <user username="admin" password="tomcat123" roles="manager-gui"/>',
      '</tomcat-users>',
    ].join('\n'),
  },
  '/opt/tomcat/webapps': { type: 'dir' },
  '/home/tomcat': { type: 'dir' },
  '/home/tomcat/user.txt': { type: 'file', content: 'FLAG{tomcat_manager_war_deploy_rce}' },
  '/proc': { type: 'dir' },
  // uname -r đọc ra version kernel cũ, dính CVE cụ thể -> hướng privesc bằng exploit binary.
  '/proc/version': {
    type: 'file',
    content: 'Linux version 4.4.0-116-generic (#140-Ubuntu SMP) — CVE-2017-16995 (eBPF) chưa vá',
  },
  '/tmp': { type: 'dir' },
  '/tmp/exploit-notes.txt': {
    type: 'file',
    content: 'searchsploit báo 4.4.0-116 dính CVE-2017-16995 — compile exploit C, chạy local sẽ leo root.',
  },
  '/root': { type: 'dir' },
  '/root/root.txt': { type: 'file', content: 'FLAG{kernel_cve_2017_16995_ebpf_privesc_root}' },
};
