import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../users/role.enum';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

class DemoController {
  @Roles(Role.Admin)
  adminOnly() {}

  anyUser() {}
}

function contextFor(handler: () => void, role: Role) {
  return {
    getHandler: () => handler,
    getClass: () => DemoController,
    switchToHttp: () => ({ getRequest: () => ({ user: { id: 1, role } }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('allows an admin on an admin-only route', () => {
    expect(guard.canActivate(contextFor(DemoController.prototype.adminOnly, Role.Admin))).toBe(true);
  });

  it('blocks a manager on an admin-only route', () => {
    expect(guard.canActivate(contextFor(DemoController.prototype.adminOnly, Role.Manager))).toBe(false);
  });

  it('allows any role on a route without @Roles()', () => {
    expect(guard.canActivate(contextFor(DemoController.prototype.anyUser, Role.Manager))).toBe(true);
  });
});
