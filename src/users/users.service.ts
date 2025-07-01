import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUser } from './user';
import { CreateUsersDto } from './create-users-dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginUsersDto } from './login-users-dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export default class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}
  async registerUser(user: CreateUsersDto): Promise<RegisterUser> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        id: user.id,
        email: user.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists with this email', {
        cause: new Error('User exists'),
        description: 'user already registered',
      });
    }

    const hash = await this.encryptPassword(user.password, 10);
    user.password = hash;
    return await this.prisma.user.create({
      data: user,
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
      },
    });
    // return user;
  }

  async loginUser(loginDTO: LoginUsersDto): Promise<{ access_token: string }> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: loginDTO.email,
      },
    });
    if (!existingUser) {
      throw new UnauthorizedException('User does not exits!');
    }
    const isMatched = await this.decryptPassword(
      loginDTO.password,
      existingUser.password,
    );
    if (!isMatched) {
      throw new UnauthorizedException('Invalid user or password');
    }

    const token = await this.jwtService.signAsync(
      {
        id: existingUser.id,
        email: existingUser.email,
      },
      {
        expiresIn: '1d',
      },
    );

    return {
      access_token: token,
    };
  }

  async encryptPassword(plainText, saltRounds) {
    return await bcrypt.hash(plainText, saltRounds);
  }
  async decryptPassword(plainText, hash) {
    return await bcrypt.compare(plainText, hash);
  }
}
