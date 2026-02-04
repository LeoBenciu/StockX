import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AwsService } from './aws.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private useLocalStorage: boolean;

  constructor(
    private awsService: AwsService,
    private configService: ConfigService,
  ) {
    // Check if AWS is configured (not placeholder)
    const awsKey = this.configService.get('AWS_ACCESS_KEY_ID');
    this.useLocalStorage = !awsKey || awsKey === 'placeholder';
    
    // Create uploads directory if using local storage
    if (this.useLocalStorage) {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<{ url: string; key: string }> {
    if (this.useLocalStorage) {
      // Save locally
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(process.cwd(), 'uploads', folder, fileName);
      const dir = path.dirname(filePath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, file.buffer);
      const key = `${folder}/${fileName}`;
      const url = `/uploads/${key}`;
      
      return { url, key };
    } else {
      // Use AWS S3
      const key = `${folder}/${Date.now()}-${file.originalname}`;
      const url = await this.awsService.uploadToS3(file.buffer, key, file.mimetype);
      return { url, key };
    }
  }

  async deleteFile(key: string): Promise<void> {
    if (this.useLocalStorage) {
      // Delete local file
      const filePath = path.join(process.cwd(), 'uploads', key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else {
      // Delete from S3
      await this.awsService.deleteFromS3(key);
    }
  }
}

