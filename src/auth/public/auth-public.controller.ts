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
import { AuthService } from '../auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { ApprovalGuard } from '../guard/approval.guard';
import {
  CurrentUser,
  JwtUserPayload,
} from '../decorator/current-user.decorator';

export type TokenPair = {
  access_token: string;
  refresh_token: string;
};

const getSameSite = (): 'strict' | 'lax' | 'none' => {
  if (process.env.ALLOW_CROSS_DOMAIN_COOKIES === 'true') {
    return 'none';
  }
  return process.env.NODE_ENV === 'production' ? 'strict' : 'lax';
};

const getSecureFlag = (): boolean => {
  const sameSite = getSameSite();
  if (sameSite === 'none') {
    return true;
  }
  return process.env.NODE_ENV === 'production';
};

@ApiTags('Auth Public')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthPublicController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user and set tokens in cookies' })
  @ApiResponse({ status: 200, description: 'Logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    const sameSite = getSameSite();
    const secure = getSecureFlag();

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { access_token, refresh_token, ...userData } = result;
    return {
      user: userData,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 403, description: 'Refresh token missing/invalid' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ access_token: string }> {
    const cookies = req.cookies as Record<string, string | undefined>;
    const token = cookies.refresh_token;

    if (!token) {
      throw new ForbiddenException('Refresh token missing');
    }

    const result: TokenPair = await this.authService.refreshTokens(token);

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: getSecureFlag(),
      sameSite: getSameSite(),
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: getSecureFlag(),
      sameSite: getSameSite(),
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    return { access_token: result.access_token };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user and clear cookies' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiBearerAuth('access-token')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const user = (req as { user?: { email: string } }).user;
      if (user?.email) {
        await this.authService.logout(user.email);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    res.cookie('access_token', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
      secure: getSecureFlag(),
      sameSite: getSameSite(),
    });
    res.cookie('refresh_token', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
      secure: getSecureFlag(),
      sameSite: getSameSite(),
    });

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, ApprovalGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: JwtUserPayload) {
    const userData = await this.authService.getUserById(user.userId);
    return {
      user: userData,
    };
  }
}
