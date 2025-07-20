import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { CurrentUser } from './decorator/current-user.decorator';

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

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response, // allow Nest to manage response object
  ) {
    // Call service to get access and refresh tokens
    const result = await this.authService.login(dto);

    // Store refresh_token in httpOnly cookie
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true, // prevent JS access
      secure: process.env.NODE_ENV === 'production', // secure on prod
      sameSite: 'strict', // prevent CSRF
      // path: '/auth/refresh', // restrict cookie to refresh path
      maxAge: 7 * 24 * 60 * 60 * 1000, // valid for 7 days
    });

    // ✅ Store access_token as well (optional: HttpOnly or readable by JS)
    res.cookie('access_token', result.access_token, {
      httpOnly: true, // Must be true for secure auth
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // example: 15 minutes
    });

    // Return only access_token to frontend
    return {
      access_token: result.access_token,
    };
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
