import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsIn,
  IsBoolean,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  avatarUrl: string;

  @IsBoolean()
  isVerified: boolean;

  @IsOptional()
  @IsIn(['admin', 'moderator', 'inspector', 'customer']) // Prevent random role injection
  role?: string;

  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
