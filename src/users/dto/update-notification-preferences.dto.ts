import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotificationPreferencesDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  orderUpdates: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  newsletters: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  stockAlerts: boolean;
}
