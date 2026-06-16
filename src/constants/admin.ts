export const SUPER_ADMIN_EMAIL = 'claudio@brignole.ch';
export const SUPER_ADMIN_UID = 'ZVQqmqZ99yPV6vVThQ56v9YjZsK2';

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase() === SUPER_ADMIN_EMAIL;
}
