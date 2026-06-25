import { describe, expect, test } from 'vitest';
import { classifyLine } from './terminalColors.js';

describe('classifyLine', () => {
  test('classifies bash error prefixes as error', () => {
    expect(classifyLine('bash: xyz: command not found')).toBe('error');
  });

  test('classifies permission denied as error', () => {
    expect(classifyLine('Permission denied')).toBe('error');
  });

  test('classifies missing file as error', () => {
    expect(classifyLine('cat: foo.txt: No such file or directory')).toBe('error');
  });

  test('classifies normal output as default', () => {
    expect(classifyLine('syslog')).toBe('default');
    expect(classifyLine('total 12')).toBe('default');
  });

  test('is case-insensitive', () => {
    expect(classifyLine('PERMISSION DENIED')).toBe('error');
  });
});
