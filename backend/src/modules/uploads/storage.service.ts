import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { randomBytes } from 'node:crypto';

export interface StoredFile {
  /** Asl fayl: /products/abc123.webp */
  path: string;
  /** Thumbnail: /products/thumbs/abc123.webp */
  thumbPath: string;
  /** Fayl hajmi (byte) */
  size: number;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private uploadDir!: string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.uploadDir = this.configService.getOrThrow<string>('upload.dir');
    // Kerakli papkalarni yaratish
    const dirs = [
      path.join(this.uploadDir, 'products'),
      path.join(this.uploadDir, 'products', 'thumbs'),
      path.join(this.uploadDir, 'avatars'),
      path.join(this.uploadDir, 'avatars', 'thumbs'),
      path.join(this.uploadDir, 'categories'),
    ];
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
    this.logger.log(`Upload papkasi: ${path.resolve(this.uploadDir)}`);
  }

  /**
   * Rasmni optimize qilib saqlash.
   * @param buffer  Yuklangan fayl buffer'i
   * @param folder  'products' | 'avatars' | 'categories'
   * @returns       Saqlangan fayl yo'llari (URL uchun)
   */
  async saveImage(
    buffer: Buffer,
    folder: 'products' | 'avatars' | 'categories',
  ): Promise<StoredFile> {
    const id = randomBytes(16).toString('hex');
    const filename = `${id}.webp`;

    const folderPath = path.join(this.uploadDir, folder);
    const filePath = path.join(folderPath, filename);

    // Asl rasm — webp, max 1200px kenglik
    const processed = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    await fs.writeFile(filePath, processed);

    // Thumbnail — 300px
    let thumbRelPath = '';
    if (folder !== 'categories') {
      const thumbPath = path.join(folderPath, 'thumbs', filename);
      const thumb = await sharp(buffer)
        .resize(300, 300, { fit: 'cover' })
        .webp({ quality: 75 })
        .toBuffer();
      await fs.writeFile(thumbPath, thumb);
      thumbRelPath = `/${folder}/thumbs/${filename}`;
    }

    return {
      path: `/${folder}/${filename}`,
      thumbPath: thumbRelPath,
      size: processed.length,
    };
  }

  /**
   * Faylni o'chirish.
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      await fs.unlink(fullPath);
    } catch (err) {
      this.logger.warn(`Faylni o'chirib bo'lmadi: ${filePath}`);
    }
  }

  /**
   * Faylni o'chirish (asl + thumbnail).
   */
  async deleteImage(filePath: string, thumbPath: string): Promise<void> {
    await this.deleteFile(filePath);
    if (thumbPath) {
      await this.deleteFile(thumbPath);
    }
  }

  getAbsoluteDir(): string {
    return path.resolve(this.uploadDir);
  }
}
