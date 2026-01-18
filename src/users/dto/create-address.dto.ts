import { IsString, IsOptional, IsBoolean, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '123 Main Street, Apt 4B' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Dhaka Division' })
  @IsString()
  state: string;

  @ApiProperty({ example: '1200' })
  @IsString()
  zipCode: string;

  @ApiProperty({ example: 'Bangladesh' })
  @IsString()
  country: string;

  @ApiProperty({ example: '+8801234567890' })
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone must be a valid international phone number',
  })
  phone: string;

  @ApiProperty({ example: 'Home', required: false })
  @IsOptional()
  @IsString()
  addressName?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
