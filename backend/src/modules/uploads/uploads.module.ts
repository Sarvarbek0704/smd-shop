import { Global, Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { StorageService } from './storage.service';
import { FileValidationPipe } from './pipes/file-validation.pipe';

@Global()
@Module({
  controllers: [UploadsController],
  providers: [StorageService, FileValidationPipe],
  exports: [StorageService],
})
export class UploadsModule {}
