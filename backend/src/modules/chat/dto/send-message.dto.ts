import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { MessageType } from '../../../database/entities/chat-message.entity';

export class SendMessageDto {
  @ApiProperty()
  @IsUUID()
  roomId!: string;

  @ApiProperty({ example: 'Salom, mahsulot bormi?' })
  @IsString()
  @Length(1, 5000)
  content!: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}
