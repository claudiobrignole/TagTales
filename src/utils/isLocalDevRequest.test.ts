import { describe, it, expect } from 'vitest';
import { isLocalDevRequest } from './isLocalDevRequest';

function mockReq(host: string | undefined) {
  return { get: (name: string) => (name === 'host' ? host : undefined) };
}

describe('isLocalDevRequest', () => {
  it('accepts localhost with port', () => {
    expect(isLocalDevRequest(mockReq('localhost:3000'))).toBe(true);
    expect(isLocalDevRequest(mockReq('LOCALHOST:3000'))).toBe(true);
  });

  it('accepts 127.0.0.1 with port', () => {
    expect(isLocalDevRequest(mockReq('127.0.0.1:3000'))).toBe(true);
  });

  it('rejects production hosts', () => {
    expect(isLocalDevRequest(mockReq('tagtalesgallery.com'))).toBe(false);
    expect(isLocalDevRequest(mockReq('www.tagtalesgallery.com:443'))).toBe(false);
  });

  it('rejects missing host', () => {
    expect(isLocalDevRequest(mockReq(undefined))).toBe(false);
    expect(isLocalDevRequest(mockReq(''))).toBe(false);
  });
});
