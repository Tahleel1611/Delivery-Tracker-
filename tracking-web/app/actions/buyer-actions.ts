'use server';

import { Role, UserStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { getAuthorizedUser, tenantIdFor, type ActionResult } from '../../lib/authorization';

export async function createBuyer(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const admin = await getAuthorizedUser(Role.ADMIN);
  if (!admin) return { success: false, error: 'You are not authorized to create buyers.' };

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  if (!email || !name) return { success: false, error: 'Name and email are required.' };

  try {
    const buyer = await prisma.user.create({
      data: {
        email,
        name,
        phone: phone || undefined,
        role: Role.BUYER,
        status: UserStatus.INVITED,
        sellerId: tenantIdFor(admin)
      },
      select: { id: true }
    });
    return { success: true, data: buyer };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, error: 'A user with this email already exists.' };
    }
    return { success: false, error: 'Unable to create buyer.' };
  }
}