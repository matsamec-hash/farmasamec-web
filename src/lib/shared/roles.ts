export type Role = 'owner' | 'worker';

export const ROLES = {
  OWNER: 'owner' as const,
  WORKER: 'worker' as const,
};

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Vlastnik',
  worker: 'Pracovnik',
};
