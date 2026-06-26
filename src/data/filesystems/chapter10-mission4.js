// Chương 10 — Thoát Kubernetes/Cloud (elite, no-hint). Flag RANDOM ở /root/flag.txt (FLAG{{{flag}}}).
// Người chơi cat THẬT token service account trong pod; curl metadata + kubectl là output canned ở mission.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: 'ELITE — Mày có shell trong 1 pod (black-box, no-hint). Thoát ra để chạm cờ. Tự lực.',
  },
  // Dấu hiệu THẬT của môi trường Kubernetes pod — cat ra để nhận biết + lấy token.
  '/var': { type: 'dir' },
  '/var/run': { type: 'dir' },
  '/var/run/secrets': { type: 'dir' },
  '/var/run/secrets/kubernetes.io': { type: 'dir' },
  '/var/run/secrets/kubernetes.io/serviceaccount': { type: 'dir' },
  '/var/run/secrets/kubernetes.io/serviceaccount/namespace': { type: 'file', content: 'default' },
  '/var/run/secrets/kubernetes.io/serviceaccount/token': {
    type: 'file',
    content: 'eyJhbGciOiJSUzI1NiInR5cCI6IkpXVCJ9.eyJzdWIiOiJzeXN0ZW06c2VydmljZWFjY291bnQ6ZGVmYXVsdDpidWlsZGVyIn0.SIGNATURE_TRUNCATED',
  },
  '/run': { type: 'dir' },
  '/run/secrets': { type: 'dir' },
  // /.dockerenv hay /proc/1/cgroup là tip kinh điển; để 1 file env mô phỏng.
  '/proc': { type: 'dir' },
  '/proc/1': { type: 'dir' },
  '/proc/1/cgroup': { type: 'file', content: '12:pids:/kubepods/besteffort/podb1d2.../containerd-9af...' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{{{flag}}}' },
};
