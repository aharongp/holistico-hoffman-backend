import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

type RequestWithUser = Request & { user: any };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@Req() req: RequestWithUser) {
    return this.authService.buildProfileResponse(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('validate')
  validateToken(@Req() req: RequestWithUser) {
    return {
      valid: true,
      user: this.authService.buildProfileResponse(req.user),
    };
  }
}
