import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Role } from '../users/role.enum';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

// Real bcrypt, but wrapped so the test can see whether compare() was called.
jest.mock('bcrypt', () => {
  const actual = jest.requireActual<typeof import('bcrypt')>('bcrypt');
  return { ...actual, compare: jest.fn(actual.compare) };
});

describe('AuthService', () => {
  let service: AuthService;
  const usersService = { findByEmailWithPassword: jest.fn() };
  const jwtService = { signAsync: jest.fn() };

  // Few rounds only to keep the test fast.
  const user = {
    id: 3,
    email: 'olena@example.com',
    name: 'Olena',
    role: Role.Manager,
    passwordHash: bcrypt.hashSync('correct-password', 4),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('returns a token and the user without the password hash', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(user);
    jwtService.signAsync.mockResolvedValue('signed-token');

    const result = await service.login(user.email, 'correct-password');

    expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 3, role: Role.Manager });
    expect(result.accessToken).toBe('signed-token');
    expect(result.user).toEqual({ id: 3, email: user.email, name: 'Olena', role: Role.Manager });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a wrong password', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(user);

    await expect(service.login(user.email, 'wrong-password')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rejects an unknown email with the same error', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(null);

    await expect(service.login('nobody@example.com', 'whatever')).rejects.toThrow(
      'Invalid email or password',
    );
  });

  it('still runs a bcrypt comparison for an unknown email, so the timing does not give it away', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(null);

    await expect(service.login('nobody@example.com', 'whatever')).rejects.toThrow();

    expect(bcrypt.compare).toHaveBeenCalledTimes(1);
  });
});
