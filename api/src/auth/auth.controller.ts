import { Body, Controller, Get, HttpCode, NotFoundException, Post } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import type { AuthUser } from './auth.types';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @HttpCode(200) // POST defaults to 201 (created); a login creates nothing
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  async me(@CurrentUser() currentUser: AuthUser) {
    const user = await this.usersService.findById(currentUser.id);
    if (!user) throw new NotFoundException();
    return user;
  }
}
