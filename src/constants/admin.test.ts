import { describe, it, expect } from 'vitest';
import { isSuperAdminEmail, SUPER_ADMIN_EMAIL, SUPER_ADMIN_UID } from '../constants/admin';

describe('admin constants', () => {
  it('super admin email is claudio@brignole.ch', () => {
    expect(SUPER_ADMIN_EMAIL).toBe('claudio@brignole.ch');
  });

  it('super admin uid is set', () => {
    expect(SUPER_ADMIN_UID).toBe('ZVQqmqZ99yPV6vVThQ56v9YjZsK2');
  });

  it('isSuperAdminEmail is case-insensitive', () => {
    expect(isSuperAdminEmail('claudio@brignole.ch')).toBe(true);
    expect(isSuperAdminEmail('Claudio@Brignole.CH')).toBe(true);
    expect(isSuperAdminEmail('other@example.com')).toBe(false);
    expect(isSuperAdminEmail(null)).toBe(false);
  });
});
