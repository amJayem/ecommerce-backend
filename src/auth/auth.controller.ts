import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { CurrentUser } from './decorator/current-user.decorator';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Request, Response } from 'express';

export type TokenPair = {
  access_token: string;
  refresh_token: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user and return access + refresh tokens
   */
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Login user and return access + refresh tokens
   */
  // @Post('login')
  // login(@Body() dto: LoginDto) {
  //   return this.authService.login(dto);
  // }
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response, // ✅ explicitly typed Express.Response
  ) {
    const result = await this.authService.login(dto);

    // ✅ Set refresh_token in an HTTP-only cookie
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    // ✅ Return only the access_token to frontend
    return { access_token: result.access_token };
  }

  /**
   * Get new access + refresh tokens using a valid refresh token
   */
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ access_token: string }> {
    // ✅ Safely cast and access cookies
    const cookies = req.cookies as Record<string, string | undefined>;
    const token = cookies.refresh_token;

    // ✅ Check for missing token
    if (!token) {
      throw new ForbiddenException('Refresh token missing');
    }

    // ✅ AuthService expects string (not string | undefined)
    const result: TokenPair = await this.authService.refreshTokens(token);

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token: result.access_token };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.authService.logout(user.email);
  }
}

// This controller handles user authentication, including registration, login, logout and token refresh.
