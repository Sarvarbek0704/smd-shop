import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { FileValidationPipe } from './pipes/file-validation.pipe';

@ApiBearerAuth()
@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  @Post(':folder')
  @ApiOperation({
    summary: 'Bitta rasm yuklash (products | avatars | categories)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadOne(
    @Param('folder') folder: string,
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
  ) {
    this.validateFolder(folder);
    const result = await this.storageService.saveImage(
      file.buffer,
      folder as 'products' | 'avatars' | 'categories',
    );
    return result;
  }

  @Post(':folder/multiple')
  @ApiOperation({ summary: 'Bir nechta rasm yuklash (max 10)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10, { storage: memoryStorage() }))
  async uploadMultiple(
    @Param('folder') folder: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    this.validateFolder(folder);
    if (!files || files.length === 0) {
      throw new BadRequestException('Kamida bitta fayl yuklang');
    }

    const maxSize = this.configService.getOrThrow<number>('upload.maxFileSize');
    const allowedMimes = this.configService.getOrThrow<string[]>(
      'upload.allowedMimes',
    );

    for (const file of files) {
      if (!allowedMimes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Fayl "${file.originalname}": faqat ${allowedMimes.join(', ')} formatlar ruxsat etilgan`,
        );
      }
      if (file.size > maxSize) {
        throw new BadRequestException(
          `Fayl "${file.originalname}": hajmi ${(maxSize / 1024 / 1024).toFixed(1)} MB dan oshmasin`,
        );
      }
    }

    const results = [];
    for (const file of files) {
      const result = await this.storageService.saveImage(
        file.buffer,
        folder as 'products' | 'avatars' | 'categories',
      );
      results.push(result);
    }
    return results;
  }

  private validateFolder(folder: string): void {
    const allowed = ['products', 'avatars', 'categories'];
    if (!allowed.includes(folder)) {
      throw new BadRequestException(
        `Papka nomi "${folder}" noto'g'ri. Ruxsat etilgan: ${allowed.join(', ')}`,
      );
    }
  }
}
