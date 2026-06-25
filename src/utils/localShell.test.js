import { describe, expect, test } from 'vitest';
import { runShell, resolvePath, HOME } from './localShell.js';

const fs = {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
  '/var/log/syslog': { type: 'file', content: 'line1\nline2\nERROR boom\nline4' },
  '/var/log/app': { type: 'dir' },
  '/var/log/app/prod.log': { type: 'file', content: 'a\nb' },
  '/etc': { type: 'dir' },
  '/etc/nginx.conf': { type: 'file', content: 'server {}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};

describe('resolvePath', () => {
  test('handles ~, absolute, relative, ..', () => {
    expect(resolvePath('~', '/anywhere')).toBe(HOME);
    expect(resolvePath('/var/log', '/home')).toBe('/var/log');
    expect(resolvePath('log', '/var')).toBe('/var/log');
    expect(resolvePath('..', '/var/log')).toBe('/var');
    expect(resolvePath('../app', '/var/log')).toBe('/var/app');
  });
});

describe('runShell - navigation', () => {
  test('pwd prints cwd', () => {
    expect(runShell('pwd', fs, '/var/log').output).toBe('/var/log');
  });

  test('cd into existing dir returns newCwd', () => {
    const r = runShell('cd /var/log', fs, '/home/hacker');
    expect(r.newCwd).toBe('/var/log');
  });

  test('cd into missing dir errors, no newCwd', () => {
    const r = runShell('cd /nope', fs, '/home/hacker');
    expect(r.output).toContain('No such file or directory');
    expect(r.newCwd).toBeNull();
  });

  test('ls lists direct children only', () => {
    expect(runShell('ls /var/log', fs, '/').output).toBe('app  syslog');
  });
});

describe('runShell - reading', () => {
  test('cat prints file content', () => {
    expect(runShell('cat /var/log/app/prod.log', fs, '/').output).toBe('a\nb');
  });

  test('cat on directory errors', () => {
    expect(runShell('cat /var/log', fs, '/').output).toContain('Is a directory');
  });

  test('tail -n 2 returns last 2 lines', () => {
    expect(runShell('tail -n 2 syslog', fs, '/var/log').output).toBe('ERROR boom\nline4');
  });

  test('head -n 1 returns first line', () => {
    expect(runShell('head -n 1 /var/log/syslog', fs, '/').output).toBe('line1');
  });
});

describe('runShell - search', () => {
  test('grep filters matching lines', () => {
    expect(runShell('grep ERROR /var/log/syslog', fs, '/').output).toBe('ERROR boom');
  });

  test('grep on dir without -r errors', () => {
    expect(runShell('grep ERROR /var/log', fs, '/').output).toContain('Is a directory');
  });

  test('find -name with glob matches by basename', () => {
    const out = runShell('find / -name "*.conf"', fs, '/').output;
    expect(out).toBe('/etc/nginx.conf');
  });
});

describe('runShell - mutation', () => {
  test('mkdir produces a dir fsUpdate', () => {
    const r = runShell('mkdir /home/hacker/newdir', fs, '/');
    expect(r.fsUpdate['/home/hacker/newdir']).toEqual({ type: 'dir' });
  });

  test('redirect writes grep output to a file instead of terminal', () => {
    const r = runShell('grep ERROR /var/log/syslog > errors.log', fs, '/home/hacker');
    expect(r.output).toBe('');
    expect(r.fsUpdate['/home/hacker/errors.log']).toEqual({ type: 'file', content: 'ERROR boom' });
  });

  test('rm deletes a file', () => {
    const r = runShell('rm /etc/nginx.conf', fs, '/');
    expect(r.fsUpdate['/etc/nginx.conf']).toBeNull();
  });
});

describe('runShell - unknown', () => {
  test('unknown command is not handled and reports bash error', () => {
    const r = runShell('nmap 10.0.0.1', fs, '/');
    expect(r.handled).toBe(false);
    expect(r.output).toContain('command not found');
  });
});
