import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from './auth.types';
import { ROLES_KEY } from './roles.decorator';
import { Role } from '../users/role.enum';

// Runs after AuthGuard, so request.user is already set.
// Routes without @Roles() are open to every logged-in user.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    // Returning false makes Nest respond with 403 Forbidden.
    return requiredRoles.includes(request.user.role);
  }
}
