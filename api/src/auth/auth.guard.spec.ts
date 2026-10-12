import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../users/role.enum';
import { AuthGuard } from './auth.guard';
import { Public } from './public.decorator';

class DemoController {
  @Public()
  open() {}

  closed() {}
}

function contextFor(handler: () => void, headers: Record<string, string> = {}) {
  const request: Record<string, unknown> = { headers };
  const context = {
    getHandler: () => handler,
    getClass: () => DemoController,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('AuthGuard', () => {
  const jwtService = { verifyAsync: jest.fn() };
  let guard: AuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new AuthGuard(jwtService as unknown as JwtService, new Reflector());
  });

  it('lets @Public() routes through without a token', async () => {
    const { context } = contextFor(DemoController.prototype.open);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects a request without a token', async () => {
    const { context } = contextFor(DemoController.prototype.closed);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an invalid or expired token', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
    const { context } = contextFor(DemoController.prototype.closed, {
      authorization: 'Bearer bad-token',
    });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('puts the user from a valid token on the request', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 5, role: Role.Manager });
    const { context, request } = contextFor(DemoController.prototype.closed, {
      authorization: 'Bearer good-token',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: 5, role: Role.Manager });
  });
});
