import { describe, it, expect } from 'vitest';
import {
  generatePreviewToken,
  isPublished,
  canViewContent,
  buildPreviewUrl,
  appendPreviewToLink,
  isExhibitionLinkedToWriter,
} from './previewAccess';

describe('previewAccess', () => {
  it('generatePreviewToken returns uuid-like string', () => {
    const token = generatePreviewToken();
    expect(token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('isPublished normalizes published and isPublished', () => {
    expect(isPublished({ published: true })).toBe(true);
    expect(isPublished({ isPublished: true })).toBe(true);
    expect(isPublished({ published: false })).toBe(false);
    expect(isPublished({})).toBe(false);
  });

  it('canViewContent allows public, admin, and matching preview token', () => {
    const doc = { published: false, previewToken: 'secret-token' };
    expect(canViewContent(doc, { previewToken: null, isAdmin: false })).toBe(false);
    expect(canViewContent(doc, { previewToken: 'wrong', isAdmin: false })).toBe(false);
    expect(canViewContent(doc, { previewToken: 'secret-token', isAdmin: false })).toBe(true);
    expect(canViewContent(doc, { previewToken: null, isAdmin: true })).toBe(true);
    expect(canViewContent({ published: true }, { previewToken: null, isAdmin: false })).toBe(true);
  });

  it('buildPreviewUrl includes preview query param', () => {
    const url = buildPreviewUrl('exhibition', 'demo-mostra', 'abc-123', 'https://tagtalesgallery.com');
    expect(url).toBe('https://tagtalesgallery.com/exhibitions/demo-mostra?preview=abc-123');
  });

  it('buildPreviewUrl supports EN prefix', () => {
    const url = buildPreviewUrl('article', 'my-post', 'tok', 'https://tagtalesgallery.com', 'EN');
    expect(url).toBe('https://tagtalesgallery.com/en/magazine/my-post?preview=tok');
  });

  it('appendPreviewToLink adds or replaces preview param', () => {
    expect(appendPreviewToLink('/writers/foo', 't1')).toBe('/writers/foo?preview=t1');
    expect(appendPreviewToLink('/writers/foo?foo=bar', 't1')).toBe('/writers/foo?foo=bar&preview=t1');
  });

  it('isExhibitionLinkedToWriter matches artistaIds and legacy fields', () => {
    expect(
      isExhibitionLinkedToWriter({ artistaIds: ['w1', 'w2'] }, 'w2'),
    ).toBe(true);
    expect(
      isExhibitionLinkedToWriter({ artistaPrincipaleId: 'w1' }, 'w1'),
    ).toBe(true);
    expect(isExhibitionLinkedToWriter({ writerIds: ['w9'] }, 'w9')).toBe(true);
    expect(isExhibitionLinkedToWriter({ artistaIds: ['w1'] }, 'other')).toBe(false);
  });
});
