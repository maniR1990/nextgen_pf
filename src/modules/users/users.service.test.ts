import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserService } from './users.service';
import { UserRepository } from './users.repository';

vi.mock('./users.repository');

const mockUser = {
  id: '1',
  email: 'a@b.com',
  name: 'Alice',
  passwordHash: 'hashed',
  role: 'USER' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UserService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('createUser — hashes password before saving', async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(UserRepository.toCreateInput).mockImplementation((dto) => ({
      email: dto.email,
      name: dto.name,
      passwordHash: dto.passwordHash,
      role: dto.role,
    }));
    vi.mocked(UserRepository.create).mockResolvedValue(mockUser);
    vi.mocked(UserRepository.sanitize).mockReturnValue({
      id: '1',
      email: 'a@b.com',
      name: 'Alice',
      role: 'USER',
      createdAt: mockUser.createdAt,
      updatedAt: mockUser.updatedAt,
    });

    const result = await UserService.createUser({ email: 'a@b.com', name: 'Alice', password: 'plain' });
    const saved = vi.mocked(UserRepository.create).mock.calls[0][0];
    expect(saved.passwordHash).not.toBe('plain');
    expect(result.id).toBeDefined();
  });

  it('createUser — throws ConflictError on duplicate email', async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue(mockUser);
    await expect(
      UserService.createUser({ email: 'dup@b.com', name: 'Bob', password: 'x' }),
    ).rejects.toThrow('Email already exists');
  });

  it('getUsers — returns paginated list', async () => {
    vi.mocked(UserRepository.findAll).mockResolvedValue([mockUser]);
    vi.mocked(UserRepository.count).mockResolvedValue(1);
    vi.mocked(UserRepository.sanitize).mockImplementation((u) => {
      const { passwordHash: _, ...safe } = u;
      return safe;
    });

    const { data, meta } = await UserService.getUsers({ page: 1, limit: 10, skip: 0 });
    expect(data).toHaveLength(1);
    expect(UserRepository.findAll).toHaveBeenCalledWith(0, 10);
    expect(meta.page).toBe(1);
  });
});
