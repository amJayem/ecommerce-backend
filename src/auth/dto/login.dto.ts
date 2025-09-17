import { IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'jane.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password (min 6 chars)',
    minLength: 6,
    example: 'P@ssw0rd!',
  })
  @MinLength(6)
  password: string;
}
