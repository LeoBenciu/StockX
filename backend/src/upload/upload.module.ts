import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { AwsService } from './aws.service';
import { DocumentProcessingService } from './document-processing.service';

@Module({
  providers: [UploadService, AwsService, DocumentProcessingService],
  exports: [UploadService, AwsService, DocumentProcessingService],
})
export class UploadModule {}

