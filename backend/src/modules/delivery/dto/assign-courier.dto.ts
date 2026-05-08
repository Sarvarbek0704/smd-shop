import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class AssignCourierDto {
  @ApiProperty({ description: 'Kuryer foydalanuvchi ID' })
  @IsUUID()
  courierId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
