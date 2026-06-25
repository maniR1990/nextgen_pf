import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { ConflictError, NotFoundError } from '@/lib/api/errors';
import { buildMeta } from '@/lib/api/pagination';
import { getLogger } from '@/lib/logger';
import { UserRepository } from './users.repository';
import type { CreateUserDto, GetUsersQuery, UpdateUserDto } from './users.types';

const log = getLogger('UserService');

export const UserService = {
  async getUsers(query: GetUsersQuery) {
    const [data, total] = await Promise.all([
      UserRepository.findAll(query.skip, query.limit),
      UserRepository.count(),
    ]);
    return {
      data: data.map(UserRepository.sanitize),
      meta: buildMeta(query.page, query.limit, total),
    };
  },

  async getUserById(id: string) {
    try {
      const user = await UserRepository.findById(id);
      return UserRepository.sanitize(user);
    } catch {
      throw new NotFoundError('User not found');
    }
  },

  async createUser(dto: CreateUserDto) {
    const existing = await UserRepository.findByEmail(dto.email);
    if (existing) throw new ConflictError('Email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    try {
      const user = await UserRepository.create(
        UserRepository.toCreateInput({ ...dto, passwordHash }),
      );
      log.info('user.created', { userId: user.id, action: 'createUser' });
      return UserRepository.sanitize(user);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError('Email already exists');
      }
      throw err;
    }
  },

  async updateUser(id: string, dto: UpdateUserDto) {
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 12) : undefined;

    try {
      const user = await UserRepository.update(
        id,
        UserRepository.toUpdateInput({ ...dto, passwordHash }),
      );
      return UserRepository.sanitize(user);
    } catch {
      throw new NotFoundError('User not found');
    }
  },

  async deleteUser(id: string) {
    try {
      await UserRepository.deleteById(id);
    } catch {
      throw new NotFoundError('User not found');
    }
  },
};
