import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CreateUsersDto } from './create-users-dto';
import UsersService from './users.service';
import { LoginUsersDto } from './login-users-dto';
import { AuthGuard } from './auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}
  @Post('/register')
  async create(@Body() CreateUsersDto: CreateUsersDto) {
    return await this.userService.registerUser(CreateUsersDto);
  }
  @Post('/login')
  async login(@Body() LoginUsersDto: LoginUsersDto) {
    return await this.userService.loginUser(LoginUsersDto);
  }
  @UseGuards(AuthGuard)
  @Get('/profile')
  async getProfile(@Request() req) {
    return req.user;
  }
}
