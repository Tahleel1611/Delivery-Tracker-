import { auth } from './auth';
import type { Role } from '@prisma/client';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getAuthorizedUser(role: Role) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== role || session.user.status === 'DISABLED') {
    return null;
  }

  return session.user;
}

export function tenantIdFor(user: { id: string; sellerId: string | null }) {
  return user.sellerId ?? user.id;
}