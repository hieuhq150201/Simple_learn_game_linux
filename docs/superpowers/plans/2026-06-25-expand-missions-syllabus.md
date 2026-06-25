# Mở Rộng Mission Bám Syllabus — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mở rộng mỗi chương của Hacker Path lên ~15-20 mission bám syllabus chứng chỉ, backfill thuật ngữ cho mọi bài, có validate test tự động chống lệch chuẩn.

**Architecture:** Một validate test (`missions.validate.test.js`) làm "hợp đồng" cho mọi mission. Opus dựng baseline (validator + fix test cũ + chapters.js + backfill terms + Ch1 mẫu), rồi fan-out sub-agent mỗi chương 1 task (haiku chương Linux, sonnet chương bảo mật), mỗi agent chỉ đụng file chương mình tới khi validate xanh. Opus gom cuối.

**Tech Stack:** React 18, Vite, Vitest, ES modules. Data thuần JS object/RegExp, không backend.

## Global Constraints

- Mỗi mission: `id, chapterId, title, story, steps[{id, description, match:RegExp, output?}], hints[ĐÚNG 3], debrief[], terms[3-5×{term,def}], initialFilesystem`.
- `hints.length === 3` luôn luôn.
- `initialFilesystem` luôn có key `'/'` và `'/home/hacker'`.
- `output` ở step CHỈ cho lệnh ảo (nmap/ssh/ping/systemctl/dig/ps); lệnh file-based bỏ trống.
- Giọng "mày/tao", tiếng Việt, bám tông `src/data/extra/chapter1.js`.
- Cô lập: sub-agent CHỈ ghi `extra/chapterN.js` + `filesystems/chapterN-missionX.js` của chương mình. KHÔNG đụng `missions.js`, `chapters.js`, `*.test.js`.
- Target/chương (id 1..10): **16, 16, 18, 15, 18, 20, 18, 12, 14, 10**.
- Chạy test: `npx vitest run` (toàn bộ) hoặc `npx vitest run -t "chapter N"` (1 chương).

---

## File Structure

- `src/data/missions.validate.test.js` — **Tạo.** Validator schema cho cả 10 chương.
- `src/data/missions.test.js` — **Sửa.** Bỏ test "exactly 3", nới test flag→cờ + Ch10.
- `src/data/chapters.js` — **Sửa.** `missionCount` = target mỗi chương.
- `src/data/missions.js` — **Sửa.** Backfill `terms` cho 30 bài gốc (m1-3 mỗi chương).
- `src/data/extra/chapterN.js` — **Sửa (N=1..10).** Thêm bài tới target. Ch1 do opus (mẫu); còn lại sub-agent.
- `src/data/filesystems/chapterN-missionX.js` — **Tạo/Sửa.** Filesystem cho bài mới.

---

## Task 1: Validator test + fix test cũ + chapters.js (opus)

**Files:**
- Create: `src/data/missions.validate.test.js`
- Modify: `src/data/missions.test.js`
- Modify: `src/data/chapters.js`

**Interfaces:**
- Consumes: `missions` từ `missions.js`, `chapters` từ `chapters.js`.
- Produces: lệnh `npx vitest run -t "chapter N"` để mỗi task sau verify chương mình.

- [ ] **Step 1: Viết validator test**

Create `src/data/missions.validate.test.js`:

```js
import { describe, expect, test } from 'vitest';
import { missions } from './missions.js';
import { chapters } from './chapters.js';

const CHAPTER_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

describe('missions schema validation', () => {
  for (const ch of CHAPTER_IDS) {
    describe(`chapter ${ch}`, () => {
      const list = missions[ch] ?? [];
      const meta = chapters.find((c) => c.id === ch);

      test('reaches target missionCount', () => {
        expect(list.length).toBe(meta.missionCount);
      });

      test('ids are unique', () => {
        const ids = list.map((m) => m.id);
        expect(new Set(ids).size).toBe(ids.length);
      });

      for (const m of list) {
        test(`mission ${m.id} has valid shape`, () => {
          expect(m.chapterId).toBe(ch);
          expect(typeof m.title).toBe('string');
          expect(m.title.length).toBeGreaterThan(0);
          expect(typeof m.story).toBe('string');
          expect(m.story.length).toBeGreaterThan(0);
          expect(m.steps.length).toBeGreaterThan(0);
          for (const s of m.steps) {
            expect(typeof s.description).toBe('string');
            expect(s.match).toBeInstanceOf(RegExp);
          }
          expect(m.hints).toHaveLength(3);
          expect(Array.isArray(m.terms)).toBe(true);
          expect(m.terms.length).toBeGreaterThanOrEqual(3);
          for (const t of m.terms) {
            expect(typeof t.term).toBe('string');
            expect(typeof t.def).toBe('string');
          }
          expect(m.initialFilesystem['/']).toBeTruthy();
          expect(m.initialFilesystem['/home/hacker']).toBeTruthy();
        });
      }
    });
  }
});
```

- [ ] **Step 2: Sửa `chapters.js` missionCount**

Đổi `missionCount` của 10 chương (theo `id`) thành: 1→16, 2→16, 3→18, 4→15, 5→18, 6→20, 7→18, 8→12, 9→14, 10→10.

- [ ] **Step 3: Sửa `missions.test.js`**

Xoá hẳn test `'every chapter 1-8 has exactly 3 missions'` (đã được validator thay bằng check `missionCount`). Thay test flag bằng:

```js
test('CTF chapters 8 & 10 — last step references capturing the flag', () => {
  for (const ch of [8, 10]) {
    for (const mission of missions[ch]) {
      const last = mission.steps[mission.steps.length - 1];
      const d = last.description.toLowerCase();
      expect(d.includes('flag') || d.includes('cờ')).toBe(true);
    }
  }
});
```

Trong test `'every mission has required fields and 3 hint levels'`, đổi vòng lặp `chapterId <= 8` thành `<= 10`.

- [ ] **Step 4: Chạy test — kỳ vọng ĐỎ có kiểm soát**

Run: `npx vitest run`
Expected: FAIL — các chương chưa đạt target `missionCount`, 30 bài gốc thiếu `terms`. Đây là baseline mục tiêu, sẽ chuyển xanh dần qua các task sau.

- [ ] **Step 5: Commit**

```bash
git add src/data/missions.validate.test.js src/data/missions.test.js src/data/chapters.js
git commit -m "test: validator schema mission + chapters.js target + fix test cũ"
```

---

## Task 2: Backfill terms cho 30 bài gốc (opus)

**Files:**
- Modify: `src/data/missions.js` (mỗi chương, mission id 1-3)

**Interfaces:**
- Consumes: validator từ Task 1.
- Produces: 30 bài gốc đạt check `terms.length >= 3`.

- [ ] **Step 1: Thêm `terms` vào từng bài gốc**

Với mỗi mission id 1-3 của cả 10 chương trong `missions.js`, thêm field `terms: [3-5 × {term, def}]` ngay trước `initialFilesystem`. Thuật ngữ khớp lệnh/khái niệm chính của bài. Ví dụ cho Ch1 M1:

```js
terms: [
  { term: 'tail -n 50', def: 'In 50 dòng cuối của file — soi log mới nhất khi điều tra sự cố.' },
  { term: '/var/log', def: 'Thư mục chuẩn chứa log hệ thống và ứng dụng trên Linux.' },
  { term: 'cd', def: 'Đổi thư mục làm việc hiện tại (change directory).' },
  { term: 'ls', def: 'Liệt kê nội dung thư mục.' },
],
```

- [ ] **Step 2: Chạy validator phần shape**

Run: `npx vitest run -t "has valid shape"`
Expected: các lỗi "terms" của bài gốc biến mất (vẫn còn lỗi `missionCount` ở chương chưa mở rộng — chấp nhận).

- [ ] **Step 3: Commit**

```bash
git add src/data/missions.js
git commit -m "feat: backfill thuật ngữ cho 30 bài gốc"
```

---

## Task 3: Mở rộng Ch1 lên 16 bài — CHƯƠNG MẪU (opus)

**Files:**
- Modify: `src/data/extra/chapter1.js` (đang có id 4-9 → thêm 10-16)
- Create: `src/data/filesystems/chapter1-mission10.js` … `chapter1-mission16.js`

**Interfaces:**
- Consumes: schema §2 của spec, tông giọng các bài 4-9 sẵn có.
- Produces: file `extra/chapter1.js` hoàn chỉnh làm exemplar cho mọi sub-agent.

- [ ] **Step 1: Viết 7 bài mới (id 10-16)**

Drill các nhóm chưa phủ kỹ ở Ch1: `find` theo quyền/thời gian, `chmod` symbolic, `tail -f`, `less`/`head`, pipe nhiều tầng, redirect `2>&1`, wildcard `[abc]`/`{}`. Mỗi bài đủ field theo Global Constraints, import filesystem tương ứng.

- [ ] **Step 2: Tạo filesystem cho từng bài mới**

Mỗi `chapter1-missionX.js` export default object có `'/'` và `'/home/hacker'` + file/thư mục phục vụ steps của bài.

- [ ] **Step 3: Chạy validator Ch1**

Run: `npx vitest run -t "chapter 1"`
Expected: PASS toàn bộ chapter 1.

- [ ] **Step 4: Commit**

```bash
git add src/data/extra/chapter1.js src/data/filesystems/chapter1-mission1*.js
git commit -m "feat(ch1): mở rộng lên 16 bài (chương mẫu)"
```

---

## Tasks 4-12: Fan-out mỗi chương (sub-agent)

**Mẫu chung mỗi task (thay tham số theo bảng bên dưới):**

**Files:**
- Modify: `src/data/extra/chapter{N}.js`
- Create/Modify: `src/data/filesystems/chapter{N}-mission*.js`

**Interfaces:**
- Consumes: spec `docs/superpowers/specs/2026-06-25-expand-missions-syllabus-design.md`, chương mẫu `src/data/extra/chapter1.js`.
- Produces: `missions[{N}].length === {target}`, validator chương {N} xanh.

- [ ] **Step 1: Dispatch sub-agent** (model theo bảng) với brief: đọc spec + chương mẫu + file extra/filesystem hiện có của chương; thêm bài tới `{target}`; id nối tiếp; chỉ đụng file chương mình; các chủ đề cần drill (dưới); tránh trùng ý bài đã có.
- [ ] **Step 2: Agent chạy `npx vitest run -t "chapter {N}"` tới khi PASS.**
- [ ] **Step 3: Opus review nhanh** (tông, regex, độ khó tăng dần, không đụng file ngoài phạm vi).
- [ ] **Step 4: Commit** `git add src/data/extra/chapter{N}.js src/data/filesystems/chapter{N}-mission*.js && git commit -m "feat(ch{N}): mở rộng lên {target} bài"`

| Task | Ch | Model | Hiện→Đích | Chủ đề cần drill |
|------|----|----|-----------|------------------|
| 4 | 2 | haiku | 8→16 | ps/top biến thể, kill/-9/pkill/killall, systemctl enable/restart, df/du/free, lsof, jobs/&/fg/bg/nohup, cron syntax `* * * * *`, env/export/$PATH/.bashrc |
| 5 | 3 | haiku | 3→18 | ping, traceroute/mtr, dig (+short/@server/MX/CNAME), nslookup/host, curl -v/-I/-L, wget, ss/netstat -tulpn, lsof -i, ip addr/route, iptables -L/ufw, tcpdump |
| 6 | 4 | haiku | 3→15 | ssh-keygen -t ed25519, ssh-copy-id, authorized_keys, ~/.ssh/config alias, -i/-p, -L/-R/-D, scp -r, rsync -avz/--delete, sshd_config hardening, fail2ban |
| 7 | 5 | sonnet | 9→18 | whois, dig recon, nmap -sS/-sV/-O/-A/-p-/--script, banner grab, gobuster/ffuf/dirb, nikto, subfinder/amass/dnsrecon, crt.sh |
| 8 | 6 | sonnet | 10→20 | SQLi (bypass auth/UNION/sqlmap), XSS (reflected/stored/DOM), IDOR, LFI/RFI (/etc/passwd), directory traversal, broken auth/session, Burp repeater/intruder |
| 9 | 7 | sonnet | 3→18 | id/sudo -l/uname, find -perm -4000 (SUID), sudo NOPASSWD/wildcard, cron world-writable, PATH hijack, kernel CVE, crack /etc/shadow, GTFOBins. **Tái dùng filesystem m4-9 đã có nội dung thật.** |
| 10 | 8 | sonnet | 6→12 | chuỗi CTF tăng dần: SQLi+sudo, FTP anon+upload RCE+SUID, OSINT→subdomain→LFI→log poisoning→cron. Flag `HTB{}`/`FLAG{}`. **Bước cuối nói "flag"/"cờ".** |
| 11 | 9 | sonnet | 6→14 | enum AD, Kerberoasting, AS-REP roast, Pass-the-Hash, PtT, DCSync, Golden/Silver Ticket, BloodHound, impacket/mimikatz |
| 12 | 10 | sonnet | 6→10 | container escape, binary exploitation (ret2win), full red-team OSINT→DA. Không hint dễ. **Bước cuối CTF nói "flag"/"cờ".** |

Thả theo đợt: Tasks 4-6 (haiku) + 7-8 trước, rồi 9-12.

---

## Task 13: Gom & chốt (opus)

**Files:**
- Modify (nếu cần): `src/data/chapters.js` (chỉnh missionCount nếu chương lệch ±1 so target)

- [ ] **Step 1: Chạy full test**

Run: `npx vitest run`
Expected: PASS toàn bộ (gồm validator 10 chương).

- [ ] **Step 2: Spot-check trùng ý + độ khó**

Đọc lướt 2-3 chương bất kỳ: không có 2 bài trùng ý, id tăng = khó tăng. Sửa tại chỗ nếu lệch.

- [ ] **Step 3: Đồng bộ missionCount cuối**

Nếu chương nào chốt ở số khác target (±1), cập nhật `chapters.js` cho khớp `missions[ch].length`. Chạy lại `npx vitest run` → PASS.

- [ ] **Step 4: Commit**

```bash
git add -A src/data
git commit -m "chore: gom mở rộng mission, đồng bộ missionCount, full test xanh"
```

---

## Self-Review

- **Spec coverage:** Schema §2→Task1 validator; map/target §3→Task3-12; backfill terms §4→Task2; validate+fix test §5→Task1; điều phối §6→Task1-13; cô lập §7→ràng buộc Tasks 4-12; DoD §9→Task13. ✅ Không gap.
- **Placeholder scan:** Validator + fix test có code thật; chương content là deliverable do agent sinh theo brief (không inline 157 bài — đúng bản chất). Không có "TBD".
- **Type consistency:** `missionCount` (chapters.js) ↔ `missions[ch].length` khớp ở Task1 & validator & Task13. Lệnh test `-t "chapter N"` ↔ `describe(\`chapter ${ch}\`)` khớp.
