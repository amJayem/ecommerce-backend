import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUsersDto {
  // username
  @IsNotEmpty()
  username: string;

  // id
  @IsNotEmpty()
  id: number;

  // password
  @IsNotEmpty()
  password: string;

  // email
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()

  // first name
  firstName: string;
  @IsNotEmpty()

  // last name
  lastName: string;

  // address
  @IsNotEmpty()
  address: string;

  // phone number
  @IsNotEmpty()
  phoneNumber: string;

  // role
  @IsNotEmpty()
  role: string; // e.g., 'customer', 'admin'

  // createdAt: Date;
  // name?: string | null;
  // updatedAt: Date;
}
