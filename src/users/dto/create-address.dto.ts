import { IsString, IsOptional, IsBoolean, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'John', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

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

  @ApiProperty({ example: 'Bangladesh', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: '+8801234567890', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone must be a valid international phone number',
  })
  phone?: string;

  @ApiProperty({ example: 'Home', required: false })
  @IsOptional()
  @IsString()
  addressName?: string;

  @ApiProperty({ example: 'Home', required: false })
  @IsOptional()
  @IsString()
  addressType?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
