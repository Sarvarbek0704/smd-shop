import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly configService: ConfigService) {}

  transform(file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('Fayl yuklanmadi');
    }

    const maxSize = this.configService.getOrThrow<number>('upload.maxFileSize');
    const allowedMimes = this.configService.getOrThrow<string[]>(
      'upload.allowedMimes',
    );

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Faqat quyidagi formatlar ruxsat etilgan: ${allowedMimes.join(', ')}`,
      );
    }

    if (file.size > maxSize) {
      const maxMb = (maxSize / 1024 / 1024).toFixed(1);
      throw new BadRequestException(
        `Fayl hajmi ${maxMb} MB dan oshmasligi kerak`,
      );
    }

    return file;
  }
}
