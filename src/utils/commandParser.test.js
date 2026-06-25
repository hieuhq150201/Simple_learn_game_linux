import { describe, expect, test } from 'vitest';
import { parseCommand } from './commandParser.js';

describe('parseCommand', () => {
  test('trims whitespace and splits cmd/args', () => {
    const result = parseCommand('  ls -la /var/log  ');
    expect(result.raw).toBe('ls -la /var/log');
    expect(result.cmd).toBe('ls');
    expect(result.args).toEqual(['-la', '/var/log']);
  });

  test('flags frontend-only commands', () => {
    expect(parseCommand('hint').isFrontendCommand).toBe(true);
    expect(parseCommand('clear').isFrontendCommand).toBe(true);
    expect(parseCommand('exit').isFrontendCommand).toBe(true);
  });

  test('does not flag real shell commands as frontend-only', () => {
    expect(parseCommand('ls -la').isFrontendCommand).toBe(false);
    expect(parseCommand('cat /etc/passwd').isFrontendCommand).toBe(false);
  });

  test('handles empty input without throwing', () => {
    const result = parseCommand('   ');
    expect(result.cmd).toBe('');
    expect(result.isFrontendCommand).toBe(false);
  });
});
