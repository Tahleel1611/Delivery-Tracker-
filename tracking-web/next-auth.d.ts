import type { DefaultSession } from 'next-auth';
import type { Role, UserStatus } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      sellerId: string | null;
      status: UserStatus;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role;
    sellerId?: string | null;
    status?: UserStatus;
  }
}