import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from './role.enum';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const repo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    findOneByOrFail: jest.fn(),
    create: jest.fn((data: Partial<User>) => data),
    save: jest.fn((data: Partial<User>) => Promise.resolve({ ...data, id: 7 })),
  };

  const dto = {
    email: 'new@example.com',
    name: 'New User',
    password: 'plain-password',
    role: Role.Manager,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: getRepositoryToken(User), useValue: repo }],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  it('stores a bcrypt hash, never the plain password', async () => {
    repo.findOneBy.mockResolvedValue(null);
    repo.findOneByOrFail.mockResolvedValue({ id: 7, email: dto.email });

    await service.create(dto);

    const savedData = repo.create.mock.calls[0][0];
    expect(savedData.passwordHash).not.toBe(dto.password);
    expect(await bcrypt.compare(dto.password, savedData.passwordHash as string)).toBe(true);
  });

  it('returns the user as loaded from the database (without the hash)', async () => {
    repo.findOneBy.mockResolvedValue(null);
    repo.findOneByOrFail.mockResolvedValue({ id: 7, email: dto.email, name: dto.name });

    const user = await service.create(dto);

    expect(repo.findOneByOrFail).toHaveBeenCalledWith({ id: 7 });
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('rejects an email that is already taken', async () => {
    repo.findOneBy.mockResolvedValue({ id: 1, email: dto.email });

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
