import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './auth.types';

// A real bcrypt hash of a random password nobody knows. When the email does not
// exist we still compare against it, so "unknown email" takes as long as
// "wrong password" and response time does not reveal which emails are registered.
const DUMMY_PASSWORD_HASH = '$2b$10$Lb3IQIW5T1aHpgbKSS7xhekRkM0KGHNU5Ju4YLhjkAjcH7yAPEYES';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmailWithPassword(email);
    const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

    // Same message for "no such email" and "wrong password", so the API does
    // not reveal which emails are registered.
    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = { sub: user.id, role: user.role };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      // Built by hand so the password hash can never end up in the response.
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
