import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginUsersDto {
  // email
  @IsEmail()
  @IsNotEmpty()
  email: string;

  // password
  @IsNotEmpty()
  password: string;
}
