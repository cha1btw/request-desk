import { SetMetadata } from '@nestjs/common';
import { Role } from '../users/role.enum';

export const ROLES_KEY = 'roles';

// Restricts a route (or a whole controller) to the listed roles.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
