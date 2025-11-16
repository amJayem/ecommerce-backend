import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import {
  CurrentUser,
  JwtUserPayload,
} from './decorator/current-user.decorator';

export type TokenPair = {
  access_token: string;
  refresh_token: string;
};

@ApiTags('Auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user and return access + refresh tokens
   */
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Login user and return access + refresh tokens
   */

  @Post('login')
  @ApiOperation({ summary: 'Login user and set tokens in cookies' })
  @ApiResponse({ status: 200, description: 'Logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
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
      path: '/', // ensure consistent path
      maxAge: 7 * 24 * 60 * 60 * 1000, // valid for 7 days
    });

    // ✅ Store access_token as well (optional: HttpOnly or readable by JS)
    res.cookie('access_token', result.access_token, {
      httpOnly: true, // Must be true for secure auth
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/', // ensure consistent path
      maxAge: 15 * 60 * 1000, // example: 15 minutes
    });

    // Return only user data to frontend (tokens are in HttpOnly cookies)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, refresh_token, access_token, ...userData } =
      result;
    return {
      user: userData,
    };
  }

  /**
   * Get new access + refresh tokens using a valid refresh token
   */
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 403, description: 'Refresh token missing/invalid' })
  async refresh(
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

    // Set refresh_token cookie
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/', // ensure consistent path
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ✅ Set access_token as cookie
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/', // ensure consistent path
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return { access_token: result.access_token };
  }

  // NestJS AuthController
  @Post('logout')
  @ApiOperation({ summary: 'Logout user and clear cookies' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiBearerAuth('access-token')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      // Get user from request (if authenticated)
      const user = (req as { user?: { email: string } }).user;

      // If user is authenticated, invalidate their refresh token in DB
      if (user?.email) {
        await this.authService.logout(user.email);
      }
    } catch (error) {
      // Continue with logout even if DB operation fails
      console.error('Logout error:', error);
    }

    // Clear cookies regardless of DB operation
    res.cookie('access_token', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/', // ensure consistent path
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.cookie('refresh_token', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/', // ensure consistent path
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * Get current authenticated user profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: JwtUserPayload) {
    // Get full user data from database
    const userData = await this.authService.getUserById(user.userId);

    // Return in same format as login response
    return {
      user: userData,
    };
  }
}

// This controller handles user authentication, including registration, login, logout, token refresh, and user profile.
