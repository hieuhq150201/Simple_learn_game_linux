// Interpreter offline cho terminal giả — chạy THẬT trên filesystem object, không cần AI/API.
// filesystem: map path -> { type:'dir' } | { type:'file', content:string }
// Trả về { handled, output, fsUpdate, newCwd }:
//   - handled: có nhận diện được đây là lệnh shell hợp lệ không
//   - output: text hiển thị (đã có thể là lỗi kiểu bash)
//   - fsUpdate: map path -> node|null (null = xoá) để mutate filesystem, hoặc null nếu không đổi
//   - newCwd: cwd mới nếu lệnh đổi thư mục (cd), hoặc null

export const HOME = '/home/hacker';

// Chuẩn hoá path: xử lý ~, tương đối/tuyệt đối, '.' và '..'
export function resolvePath(input, cwd) {
  if (!input || input === '~') return HOME;
  let path = input;
  if (path.startsWith('~/')) path = HOME + path.slice(1);
  const base = path.startsWith('/') ? '' : cwd;
  const segments = `${base}/${path}`.split('/');
  const stack = [];
  for (const seg of segments) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') stack.pop();
    else stack.push(seg);
  }
  return '/' + stack.join('/');
}

function nodeAt(fs, path) {
  const normalized = path === '/' ? '/' : path.replace(/\/$/, '');
  return fs[normalized] ?? null;
}

// Các entry là con TRỰC TIẾP của dirPath
function childrenOf(fs, dirPath) {
  const prefix = dirPath === '/' ? '/' : dirPath + '/';
  const result = [];
  for (const path of Object.keys(fs)) {
    if (path === dirPath || !path.startsWith(prefix)) continue;
    const rest = path.slice(prefix.length);
    if (rest.includes('/')) continue; // không phải con trực tiếp
    result.push({ name: rest, path, node: fs[path] });
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

// Mọi path nằm dưới startPath (đệ quy), gồm cả file và dir
function descendantsOf(fs, startPath) {
  const prefix = startPath === '/' ? '/' : startPath + '/';
  return Object.keys(fs).filter((p) => p === startPath || p.startsWith(prefix));
}

// Tách phần redirect (> hoặc >>) khỏi lệnh. Trả { body, redirect:{path,append} | null }
function splitRedirect(raw) {
  const m = raw.match(/^(.*?)\s*(>>|>)\s*(\S+)\s*$/);
  if (!m) return { body: raw.trim(), redirect: null };
  return { body: m[1].trim(), redirect: { append: m[2] === '>>', target: m[3] } };
}

// Bỏ cặp nháy bao quanh (nếu có)
function unquote(s) {
  if (!s) return s;
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// Tách argv tôn trọng nháy đơn/kép
function tokenize(input) {
  const tokens = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(input)) !== null) {
    tokens.push(m[1] ?? m[2] ?? m[3]);
  }
  return tokens;
}

function err(output) {
  return { handled: true, output, fsUpdate: null, newCwd: null };
}
function ok(output, extra = {}) {
  return { handled: true, output, fsUpdate: null, newCwd: null, ...extra };
}

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

// Chạy 1 lệnh; trả về { handled, output, fsUpdate, newCwd }
export function runShell(rawInput, fs, cwd) {
  const trimmed = (rawInput ?? '').trim();
  if (!trimmed) return { handled: true, output: '', fsUpdate: null, newCwd: null };

  const { body, redirect } = splitRedirect(trimmed);
  const argv = tokenize(body);
  const cmd = argv[0];
  const args = argv.slice(1);

  // Tính output thô của lệnh (chưa tính redirect)
  const result = execCommand(cmd, args, fs, cwd);
  if (!result.handled) return result;

  // Nếu có redirect, ghi output ra file thay vì in ra terminal
  if (redirect && result.output != null) {
    const targetPath = resolvePath(redirect.target, cwd);
    const prev = redirect.append && nodeAt(fs, targetPath)?.type === 'file' ? nodeAt(fs, targetPath).content : '';
    const sep = redirect.append && prev ? '\n' : '';
    const content = redirect.append ? prev + sep + result.output : result.output;
    return { handled: true, output: '', fsUpdate: { [targetPath]: { type: 'file', content } }, newCwd: result.newCwd };
  }

  return result;
}

function execCommand(cmd, args, fs, cwd) {
  switch (cmd) {
    case 'pwd':
      return ok(cwd);

    case 'echo':
      return ok(args.map(unquote).join(' '));

    case 'cd': {
      const target = args[0] ? resolvePath(args[0], cwd) : HOME;
      const node = nodeAt(fs, target);
      if (!node) return err(`cd: ${args[0] ?? ''}: No such file or directory`);
      if (node.type !== 'dir') return err(`cd: ${args[0]}: Not a directory`);
      return ok('', { newCwd: target });
    }

    case 'ls': {
      const pathArg = args.find((a) => !a.startsWith('-'));
      const target = pathArg ? resolvePath(pathArg, cwd) : cwd;
      const node = nodeAt(fs, target);
      if (!node) return err(`ls: cannot access '${pathArg}': No such file or directory`);
      if (node.type === 'file') return ok(pathArg);
      const long = args.some((a) => a.startsWith('-') && a.includes('l'));
      const entries = childrenOf(fs, target);
      if (long) {
        const lines = entries.map((e) => {
          const isDir = e.node.type === 'dir';
          const perm = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
          const size = isDir ? 4096 : (e.node.content?.length ?? 0);
          return `${perm} 1 root root ${String(size).padStart(5)} ${e.name}`;
        });
        return ok(lines.join('\n'));
      }
      return ok(entries.map((e) => e.name).join('  '));
    }

    case 'cat': {
      if (args.length === 0) return err('cat: missing operand');
      const out = [];
      for (const a of args) {
        const target = resolvePath(a, cwd);
        const node = nodeAt(fs, target);
        if (!node) return err(`cat: ${a}: No such file or directory`);
        if (node.type === 'dir') return err(`cat: ${a}: Is a directory`);
        out.push(node.content ?? '');
      }
      return ok(out.join('\n'));
    }

    case 'head':
    case 'tail': {
      let n = 10;
      const nIdx = args.findIndex((a) => a === '-n');
      if (nIdx !== -1 && args[nIdx + 1]) n = parseInt(args[nIdx + 1], 10) || 10;
      const inlineN = args.find((a) => /^-n\d+$/.test(a) || /^-\d+$/.test(a));
      if (inlineN) n = parseInt(inlineN.replace(/^-n?/, ''), 10) || n;
      const pathArg = args.find((a) => !a.startsWith('-') && a !== String(n));
      if (!pathArg) return err(`${cmd}: missing operand`);
      const target = resolvePath(pathArg, cwd);
      const node = nodeAt(fs, target);
      if (!node) return err(`${cmd}: cannot open '${pathArg}' for reading: No such file or directory`);
      if (node.type === 'dir') return err(`${cmd}: error reading '${pathArg}': Is a directory`);
      const lines = (node.content ?? '').split('\n');
      const slice = cmd === 'head' ? lines.slice(0, n) : lines.slice(-n);
      return ok(slice.join('\n'));
    }

    case 'grep': {
      const flags = args.filter((a) => a.startsWith('-'));
      const recursive = flags.some((f) => f.includes('r'));
      const positional = args.filter((a) => !a.startsWith('-'));
      const pattern = unquote(positional[0] ?? '');
      const pathArg = positional[1];
      if (!pattern || !pathArg) return err('usage: grep [-r] PATTERN FILE');
      const target = resolvePath(pathArg, cwd);
      const node = nodeAt(fs, target);
      if (!node) return err(`grep: ${pathArg}: No such file or directory`);
      const matchLines = (content, prefix = '') =>
        content
          .split('\n')
          .filter((l) => l.includes(pattern))
          .map((l) => prefix + l);
      if (node.type === 'file') return ok(matchLines(node.content ?? '').join('\n'));
      if (!recursive) return err(`grep: ${pathArg}: Is a directory`);
      const out = [];
      for (const p of descendantsOf(fs, target)) {
        if (fs[p].type === 'file') out.push(...matchLines(fs[p].content ?? '', `${p}:`));
      }
      return ok(out.join('\n'));
    }

    case 'find': {
      const startArg = args[0] && !args[0].startsWith('-') ? args[0] : '.';
      const start = resolvePath(startArg, cwd);
      const nameIdx = args.findIndex((a) => a === '-name');
      const namePattern = nameIdx !== -1 ? unquote(args[nameIdx + 1] ?? '') : null;
      if (!nodeAt(fs, start)) return err(`find: '${startArg}': No such file or directory`);
      const all = descendantsOf(fs, start);
      const matched = namePattern
        ? all.filter((p) => globToRegExp(namePattern).test(p.split('/').pop()))
        : all;
      return ok(matched.join('\n'));
    }

    case 'mkdir': {
      const pathArg = args.find((a) => !a.startsWith('-'));
      if (!pathArg) return err('mkdir: missing operand');
      const target = resolvePath(pathArg, cwd);
      if (nodeAt(fs, target)) return err(`mkdir: cannot create directory '${pathArg}': File exists`);
      return ok('', { fsUpdate: { [target]: { type: 'dir' } } });
    }

    case 'touch': {
      const pathArg = args.find((a) => !a.startsWith('-'));
      if (!pathArg) return err('touch: missing file operand');
      const target = resolvePath(pathArg, cwd);
      if (nodeAt(fs, target)) return ok(''); // touch file đã tồn tại: không đổi nội dung
      return ok('', { fsUpdate: { [target]: { type: 'file', content: '' } } });
    }

    case 'rm': {
      const recursive = args.some((a) => a.startsWith('-') && (a.includes('r') || a.includes('R')));
      const pathArg = args.find((a) => !a.startsWith('-'));
      if (!pathArg) return err('rm: missing operand');
      const target = resolvePath(pathArg, cwd);
      const node = nodeAt(fs, target);
      if (!node) return err(`rm: cannot remove '${pathArg}': No such file or directory`);
      if (node.type === 'dir' && !recursive) return err(`rm: cannot remove '${pathArg}': Is a directory`);
      const update = {};
      const toDelete = node.type === 'dir' ? descendantsOf(fs, target) : [target];
      for (const p of toDelete) update[p] = null;
      return ok('', { fsUpdate: update });
    }

    default:
      return { handled: false, output: `bash: ${cmd}: command not found`, fsUpdate: null, newCwd: null };
  }
}
