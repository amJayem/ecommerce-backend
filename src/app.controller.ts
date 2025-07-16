import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt/jwt-auth.guard';
import { CurrentUser } from './auth/decorator/current-user.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user; // { userId, email, role }
  }

  @Get()
  getHello() {
    return this.appService.getHello();
  }
}
