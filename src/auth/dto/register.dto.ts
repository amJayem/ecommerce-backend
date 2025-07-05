import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsIn,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsIn(['admin', 'moderator', 'customer']) // Prevent random role injection
  role?: string;
}
