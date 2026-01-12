import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AwsService } from './aws.service';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class DocumentProcessingService {
  private openai?: OpenAI;
  private googleAI?: GoogleGenerativeAI;

  constructor(
    private configService: ConfigService,
    private awsService: AwsService,
  ) {
    const openaiKey = this.configService.get('OPENAI_API_KEY');
    const googleKey = this.configService.get('GOOGLE_AI_API_KEY');
    
    // Only initialize if keys are provided and not placeholder
    if (openaiKey && openaiKey !== 'placeholder') {
      this.openai = new OpenAI({
        apiKey: openaiKey,
      });
    }
    
    if (googleKey && googleKey !== 'placeholder') {
      this.googleAI = new GoogleGenerativeAI(googleKey);
    }
  }

  async processInvoice(fileBuffer: Buffer, fileName: string): Promise<{
    supplierName?: string;
    invoiceDate?: Date;
    totalAmount?: number;
    items: Array<{
      itemName: string;
      quantity: number;
      unit: string;
      unitPrice?: number;
      totalPrice?: number;
    }>;
  }> {
    // Extract text from PDF
    let text = '';
    try {
      if (fileName.endsWith('.pdf')) {
        console.log('[Document Processing] Extracting text from PDF...');
        const pdfData = await pdfParse(fileBuffer);
        text = pdfData.text;
        console.log(`[Document Processing] Extracted ${text.length} characters from PDF`);
        console.log('[Document Processing] First 500 chars:', text.substring(0, 500));
      } else {
        // For images, try to extract text
        // If OpenAI is not configured, return empty data
        const openaiKey = this.configService.get('OPENAI_API_KEY');
        if (openaiKey && openaiKey !== 'placeholder') {
          console.log('[Document Processing] Extracting text from image using OpenAI...');
          text = await this.extractTextFromImage(fileBuffer);
          console.log(`[Document Processing] Extracted ${text.length} characters from image`);
        } else {
          console.log('[Document Processing] OpenAI not configured, skipping text extraction');
          return { items: [] };
        }
      }
      
      if (!text || text.trim().length === 0) {
        console.log('[Document Processing] No text extracted from document');
        return { items: [] };
      }
    } catch (error) {
      console.error('[Document Processing] Error extracting text:', error);
      return { items: [] };
    }

    // Use AI to extract structured data
    const openaiKey = this.configService.get('OPENAI_API_KEY');
    if (!openaiKey || openaiKey === 'placeholder') {
      console.log('OpenAI not configured, returning empty invoice data');
      return { items: [] };
    }

    const prompt = `Extract invoice details from the following text. Return a JSON object with:
- supplierName: string
- invoiceDate: ISO date string
- totalAmount: number
- items: array of objects with itemName, quantity, unit (kg/g/l/ml/pcs), unitPrice, totalPrice

Text:
${text}

Return only valid JSON, no markdown formatting.`;

    try {
      if (!this.openai) {
        console.log('[Document Processing] OpenAI not initialized');
        return { items: [] };
      }
      
      console.log('[Document Processing] Calling OpenAI API...');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      console.log('[Document Processing] OpenAI response:', content);
      
      const result = JSON.parse(content);
      console.log('[Document Processing] Parsed result:', JSON.stringify(result, null, 2));
      
      return {
        supplierName: result.supplierName,
        invoiceDate: result.invoiceDate ? new Date(result.invoiceDate) : undefined,
        totalAmount: result.totalAmount,
        items: result.items || [],
      };
    } catch (error) {
      console.error('[Document Processing] Error processing invoice with AI:', error);
      console.error('[Document Processing] Error details:', error.message);
      if (error.response) {
        console.error('[Document Processing] API Error:', error.response.data);
      }
      return { items: [] };
    }
  }

  async processReceipt(fileBuffer: Buffer, fileName: string): Promise<{
    receiptDate?: Date;
    totalAmount?: number;
    items: Array<{
      itemName: string;
      quantity: number;
      unitPrice?: number;
      totalPrice?: number;
    }>;
  }> {
    // Extract text from PDF or image
    let text = '';
    try {
      if (fileName.endsWith('.pdf')) {
        const pdfData = await pdfParse(fileBuffer);
        text = pdfData.text;
      } else {
        const openaiKey = this.configService.get('OPENAI_API_KEY');
        if (openaiKey && openaiKey !== 'placeholder') {
          text = await this.extractTextFromImage(fileBuffer);
        } else {
          console.log('OpenAI not configured, skipping text extraction');
          return { items: [] };
        }
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      return { items: [] };
    }

    // Use AI to extract food items from receipt
    const openaiKey = this.configService.get('OPENAI_API_KEY');
    if (!openaiKey || openaiKey === 'placeholder') {
      console.log('OpenAI not configured, returning empty receipt data');
      return { items: [] };
    }

    const prompt = `Extract receipt details from the following text. Focus on FOOD ITEMS that were sold.
Return a JSON object with:
- receiptDate: ISO date string
- totalAmount: number
- items: array of objects with itemName (food item name like "Soup", "Pasta", "Salad"), quantity, unitPrice, totalPrice

Text:
${text}

Return only valid JSON, no markdown formatting.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      return {
        receiptDate: result.receiptDate ? new Date(result.receiptDate) : undefined,
        totalAmount: result.totalAmount,
        items: result.items || [],
      };
    } catch (error) {
      console.error('Error processing receipt with AI:', error);
      return { items: [] };
    }
  }

  private async extractTextFromImage(buffer: Buffer): Promise<string> {
    if (!this.openai) {
      console.log('[Document Processing] OpenAI not initialized for image extraction');
      return '';
    }
    
    // Convert buffer to base64
    const base64 = buffer.toString('base64');
    
    // Use OpenAI vision API
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text from this image. Return only the raw text, no formatting.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                },
              },
            ],
          },
        ],
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error extracting text from image:', error);
      return '';
    }
  }
}

