import { describe, it, expect } from 'vitest';
import { cleanHtml } from './cleanHtml';

describe('cleanHtml', () => {
  it('returns empty string for null/undefined', () => {
    expect(cleanHtml(null)).toBe('');
    expect(cleanHtml(undefined)).toBe('');
  });

  it('converts nbsp to regular spaces', () => {
    expect(cleanHtml('hello&nbsp;world')).toBe('hello world');
    expect(cleanHtml('hello\u00A0world')).toBe('hello world');
  });

  it('removes soft hyphens', () => {
    expect(cleanHtml('test&shy;word')).toBe('testword');
  });

  it('strips inline color styles', () => {
    expect(cleanHtml('<p style="color: red;">x</p>')).toBe('<p >x</p>');
  });

  it('removes newlines from html source', () => {
    expect(cleanHtml('a\nb')).toBe('ab');
  });
});
