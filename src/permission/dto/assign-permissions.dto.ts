import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Array of permission names to assign',
    example: ['order.read', 'order.update', 'product.read'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissions: string[];
}
