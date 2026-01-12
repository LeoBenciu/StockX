import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';

@Injectable()
export class AwsService {
  private s3Client: S3Client;
  private textractClient: TextractClient;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.textractClient = new TextractClient({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.bucket = this.configService.get('AWS_S3_BUCKET');
  }

  async uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return `https://${this.bucket}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;
  }

  async deleteFromS3(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async extractTextFromDocument(s3Key: string): Promise<string> {
    const command = new AnalyzeDocumentCommand({
      Document: {
        S3Object: {
          Bucket: this.bucket,
          Name: s3Key,
        },
      },
      FeatureTypes: ['TABLES', 'FORMS'],
    });

    const response = await this.textractClient.send(command);
    
    // Extract text from blocks
    let text = '';
    if (response.Blocks) {
      for (const block of response.Blocks) {
        if (block.BlockType === 'LINE' && block.Text) {
          text += block.Text + '\n';
        }
      }
    }

    return text;
  }
}

