import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'jane.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'Jane Doe',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'First name',
    example: 'Jane',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({
    description: 'Street address',
    example: '221B Baker Street, London',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Avatar image URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsString()
  @IsOptional()
  avatarUrl: string;

  @ApiPropertyOptional({ description: 'Email verified flag', example: false })
  @IsBoolean()
  @IsOptional()
  isVerified: boolean;

  @ApiPropertyOptional({
    description: 'User role (admin reserved for internal ops)',
    enum: ['admin', 'moderator', 'inspector', 'customer'],
    example: 'customer',
  })
  @IsOptional()
  @IsIn(['admin', 'moderator', 'inspector', 'customer'])
  role?: string;

  @ApiProperty({
    description: 'Password (min 6 chars)',
    minLength: 6,
    example: 'P@ssw0rd!',
  })
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'Confirm password (for validation)',
    example: 'P@ssw0rd!',
  })
  @IsString()
  @IsOptional()
  confirmPassword?: string;

  @ApiPropertyOptional({
    description: 'E.164 phone number',
    example: '+12025550173',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
