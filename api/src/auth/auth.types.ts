import type { Request } from 'express';
import { Role } from '../users/role.enum';

// What we put inside the JWT. `sub` ("subject") is the standard claim for the user id.
export interface JwtPayload {
  sub: number;
  role: Role;
}

// What controllers get from @CurrentUser().
export interface AuthUser {
  id: number;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
