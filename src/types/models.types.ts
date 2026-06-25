import type { Role } from '@prisma/client';

export interface UserEntity {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionEntity {
  id: string;
  amount: number;
  category: string;
  userId: string;
  createdAt: Date;
}
