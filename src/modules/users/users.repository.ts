import type { Prisma, User } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import type { CreateUserDto, UpdateUserDto } from './users.types';

export const UserRepository = {
  findById: (id: string) =>
    prisma.user.findUniqueOrThrow({ where: { id } }),

  findByEmail: (email: string) =>
    prisma.user.findUnique({ where: { email } }),

  findAll: (skip = 0, take = 20) =>
    prisma.user.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),

  count: () => prisma.user.count(),

  findAllActive: () =>
    prisma.user.findMany({ where: { role: { not: undefined } } }),

  create: (data: Prisma.UserCreateInput) => prisma.user.create({ data }),

  update: (id: string, data: Prisma.UserUpdateInput) =>
    prisma.user.update({ where: { id }, data }),

  deleteById: (id: string) => prisma.user.delete({ where: { id } }),

  toCreateInput: (dto: CreateUserDto & { passwordHash: string }): Prisma.UserCreateInput => ({
    email: dto.email,
    name: dto.name,
    passwordHash: dto.passwordHash,
    role: dto.role,
  }),

  toUpdateInput: (dto: UpdateUserDto & { passwordHash?: string }): Prisma.UserUpdateInput => ({
    ...(dto.email && { email: dto.email }),
    ...(dto.name && { name: dto.name }),
    ...(dto.passwordHash && { passwordHash: dto.passwordHash }),
    ...(dto.role && { role: dto.role }),
  }),

  sanitize: (user: User) => {
    const { passwordHash: _, ...safe } = user;
    return safe;
  },
};
