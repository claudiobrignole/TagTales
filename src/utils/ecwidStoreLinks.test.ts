import { describe, expect, it } from 'vitest';
import {
  buildEcwidLinkUpdates,
  getEcwidLinkSlots,
  hasEcwidLinks,
  normalizeEcwidLinks,
} from './ecwidStoreLinks';

describe('ecwidStoreLinks', () => {
  it('reads legacy ecwidLink', () => {
    expect(normalizeEcwidLinks({ ecwidLink: ' https://a ' })).toEqual([
      { url: 'https://a' },
    ]);
    expect(hasEcwidLinks({ ecwidLink: 'https://a' })).toBe(true);
  });

  it('prefers ecwidLinks array and skips empty slots', () => {
    expect(
      normalizeEcwidLinks({
        ecwidLink: 'https://legacy',
        ecwidLinks: [
          { url: 'https://a1', label: 'A1', label_en: 'A1 EN' },
          { url: '', label: 'x' },
          { url: ' https://a2 ' },
        ],
      }),
    ).toEqual([
      { url: 'https://a1', label: 'A1', label_en: 'A1 EN' },
      { url: 'https://a2' },
    ]);
  });

  it('pads admin slots to 2 and syncs legacy on build', () => {
    const slots = getEcwidLinkSlots({ ecwidLink: 'https://only' });
    expect(slots).toHaveLength(2);
    expect(slots[0].url).toBe('https://only');
    expect(slots[1].url).toBe('');

    const built = buildEcwidLinkUpdates([
      { url: 'https://a1', label: 'Poster A1' },
      { url: 'https://a2', label_en: 'Poster A2' },
      { url: 'https://ignored' },
      { url: '  ' },
    ]);
    expect(built.ecwidLink).toBe('https://a1');
    expect(built.ecwidLinks).toHaveLength(2);
    expect(built.ecwidLinks[0]).toEqual({ url: 'https://a1', label: 'Poster A1' });
    expect(built.ecwidLinks[1]).toEqual({ url: 'https://a2', label_en: 'Poster A2' });
  });

  it('preserves spaces in button labels while editing', () => {
    const built = buildEcwidLinkUpdates([
      { url: 'https://a1', label: 'Poster A1', label_en: 'Buy now' },
    ]);
    expect(built.ecwidLinks[0].label).toBe('Poster A1');
    expect(built.ecwidLinks[0].label_en).toBe('Buy now');
  });
});
