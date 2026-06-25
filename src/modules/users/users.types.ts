import type { Role } from '@prisma/client';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  name: string;
  password: string;
  role?: Role;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  password?: string;
  role?: Role;
}

export interface GetUsersQuery {
  page: number;
  limit: number;
  skip: number;
}
