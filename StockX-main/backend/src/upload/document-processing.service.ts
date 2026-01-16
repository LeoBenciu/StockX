import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AwsService } from './aws.service';
import * as pdfParse from 'pdf-parse';
import { pdfToPng } from 'pdf-to-png-converter';

/* =========================
   TIPURI
========================= */

export interface ProcessedReceiptItem {
  itemName: string;
  recipeKey: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface ProcessedReceiptData {
  receiptDate?: Date;
  totalAmount?: number;
  items: ProcessedReceiptItem[];
}

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

    if (openaiKey && openaiKey !== 'placeholder') {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }

    if (googleKey && googleKey !== 'placeholder') {
      this.googleAI = new GoogleGenerativeAI(googleKey);
    }
  }

  /* =========================
        INVOICE (OBLIGATORIU)
     ========================= */

  async processInvoice(
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<{
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
    console.log('========== processInvoice CALLED ==========');
    console.log('File name:', fileName);
    console.log('File buffer size:', fileBuffer.length);
    console.log('OpenAI available:', !!this.openai);
    console.log('Google AI available:', !!this.googleAI);

    let text = '';

    try {
      if (fileName.toLowerCase().endsWith('.xml')) {
        console.log('Processing as XML invoice...');
        return this.processXmlInvoice(fileBuffer);
      }

      if (fileName.endsWith('.pdf')) {
        console.log('Processing as PDF invoice...');
        if (!this.openai) {
          console.error('❌ OpenAI not available! Cannot process PDF.');
          return { items: [] };
        }
        
        // First try to extract text from PDF (faster and more reliable for text-based PDFs)
        try {
          const pdfData = await pdfParse(fileBuffer);
          const pdfText = pdfData.text?.trim();
          console.log('PDF text extraction result:', pdfText?.length || 0, 'chars');
          
          if (pdfText && pdfText.length > 50) {
            console.log('✅ PDF has text content, using text-based extraction...');
            console.log('========== PDF TEXT ==========');
            console.log(pdfText);
            console.log('==============================');
            return await this.extractInvoiceFromText(pdfText);
          }
        } catch (pdfError) {
          console.log('PDF text extraction failed, falling back to Vision:', pdfError?.message);
        }
        
        // Fall back to Vision OCR for scanned/image PDFs
        console.log('Calling processPdfWithVision...');
        return await this.processPdfWithVision(fileBuffer);
      } else {
        console.log('Processing as image invoice...');
        if (!this.openai) {
          console.error('❌ OpenAI not available! Cannot process image.');
          return { items: [] };
        }
        text = await this.extractTextFromImage(fileBuffer);
      }
    } catch (error) {
      console.error('❌ Error in processInvoice:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      return { items: [] };
    }



    if (!this.openai) return { items: [] };

    const prompt = `
You are extracting items from a restaurant receipt.

The receipt may be very simple.
If you see a product name and a quantity, YOU MUST extract it.

Rules:
- Every product sold is a FOOD ITEM
- quantity defaults to 1 if missing
- recipeKey MUST be a lowercase version of itemName
- DO NOT skip items because of missing price

Return STRICT JSON in this format:

{
  "receiptDate": "ISO date or null",
  "totalAmount": number or null,
  "items": [
    {
      "itemName": "string",
      "recipeKey": "string",
      "quantity": number,
      "unit": "string",
      "unitPrice": null,
      "totalPrice": null
    }
  ]
}

Receipt text:
${text}
`;


    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content);

      return {
        supplierName: result.supplierName,
        invoiceDate: result.invoiceDate
          ? new Date(result.invoiceDate)
          : undefined,
        totalAmount: result.totalAmount,
        items: (result.items || []).map((item) => ({
          ...item,
          unit: item.unit || 'buc',
        })),
      };
    } catch {
      return { items: [] };
    }
  }

  private async processXmlInvoice(buffer: Buffer): Promise<{
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
    const parser = new (await import('xml2js')).Parser({ explicitArray: false });
    const xml = buffer.toString('utf-8');

    try {
      const result = await parser.parseStringPromise(xml);

      // SAGA XML Structure usually has 'Factura' root
      // Adjust path based on typical structure: Factura -> Linii -> Linie
      const root = result.Factura || result.factura;

      if (!root) {
        console.warn('Unknown XML structure');
        return { items: [] };
      }

      const supplierName = root.Header?.Furnizor?.Nume || root.header?.furnizor?.nume || 'Unknown Supplier';
      const dateStr = root.Header?.Data || root.header?.data;
      const invoiceDate = dateStr ? new Date(dateStr) : new Date();
      const totalAmount = parseFloat(root.Summary?.TotalPlata || root.summary?.totalPlata || '0');

      let lines = [];
      const linesNode = root.Linii?.Linie || root.linii?.linie;

      if (Array.isArray(linesNode)) {
        lines = linesNode;
      } else if (linesNode) {
        lines = [linesNode];
      }

      const items = lines.map((line: any) => ({
        itemName: line.Denumire || line.denumire || 'Unknown Item',
        quantity: parseFloat(line.Cantitate || line.cantitate || '0'),
        unit: line.UM || line.um || 'buc',
        unitPrice: parseFloat(line.PretUnitar || line.pretUnitar || '0'),
        totalPrice: parseFloat(line.Valoare || line.valoare || '0'),
      }));

      return {
        supplierName,
        invoiceDate,
        totalAmount,
        items,
      };
    } catch (error) {
      console.error('XML Parsing Error:', error);
      return { items: [] };
    }
  }

  /* =========================
        RECEIPT (FIXAT)
     ========================= */

  async processReceipt(
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<ProcessedReceiptData> {
    let text = '';
    const HEADER_WORDS = [
      'cantitate',
      'produs',
      'pret',
      'total',
      'ron',
      'lei',
    ];
    /* =========================
       1️⃣ EXTRAGERE TEXT
    ========================= */
    try {
      if (fileName.endsWith('.pdf')) {
        const pdfData = await pdfParse(fileBuffer);
        text = pdfData.text;
      } else {
        if (!this.openai) {
          return { items: [] };
        }
        text = await this.extractTextFromImage(fileBuffer);
      }
    } catch {
      return { items: [] };
    }

    if (!text || !text.trim()) {
      return { items: [] };
    }

    console.log('========== RAW RECEIPT TEXT ==========');
    console.log(text);
    console.log('=====================================');

    const lines = text
      .split('\n')
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .filter(Boolean);


    /* =========================
       2️⃣ FALLBACK DETERMINIST (CRITIC)
       RULEAZĂ MEREU
    ========================= */
    const items: ProcessedReceiptItem[] = [];

    let pendingProduct: string | null = null;

    for (const line of lines) {
      const lower = line.toLowerCase();

      // ignoră headere și totaluri
      if (
        lower.startsWith('pret') ||
        lower.startsWith('total') ||
        lower.startsWith('ron') ||
        lower === 'cantitate' ||
        lower === 'produs'
      ) {
        continue;
      }

      // produs explicit
      if (lower.startsWith('produs:')) {
        pendingProduct = line.replace(/^produs:/i, '').trim();
        continue;
      }

      // cantitate explicită
      if (lower.startsWith('cantitate:') && pendingProduct) {
        const qty = Number(
          line.replace(/^cantitate:/i, '').trim(),
        );

        if (!isNaN(qty) && qty > 0) {
          items.push({
            itemName: pendingProduct,
            recipeKey: pendingProduct.toLowerCase(),
            quantity: qty,
            unitPrice: null,
            totalPrice: null,
          });
        }

        pendingProduct = null;
      }
    }

    if (items.length > 0) {
      console.log('========== FALLBACK ITEMS ==========');
      console.log(items);
      console.log('===================================');

      return {
        receiptDate: undefined,
        totalAmount: undefined,
        items,
      };
    }


    /* =========================
       3️⃣ LLM (DOAR DACĂ FALLBACK EȘUEAZĂ)
    ========================= */
    if (!this.openai) {
      return { items: [] };
    }

    const prompt = `
You are extracting items from a restaurant receipt.

The receipt may be very simple.
If you see a product name and a quantity, YOU MUST extract it.

Rules:
- Every product sold is a FOOD ITEM
- quantity defaults to 1 if missing
- recipeKey MUST be lowercase version of itemName
- DO NOT skip items because of missing price

Return STRICT JSON:

{
  "receiptDate": "ISO date or null",
  "totalAmount": number or null,
  "items": [
    {
      "itemName": "string",
      "recipeKey": "string",
      "quantity": number,
      "unitPrice": null,
      "totalPrice": null
    }
  ]
}

Receipt text:
${text}
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content);

      return {
        receiptDate: result.receiptDate
          ? new Date(result.receiptDate)
          : undefined,
        totalAmount: result.totalAmount,
        items: result.items || [],
      };
    } catch {
      return { items: [] };
    }
  }


  /* =========================
        TEXT-BASED INVOICE EXTRACTION
     ========================= */

  private async extractInvoiceFromText(text: string): Promise<{
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
    if (!this.openai) return { items: [] };

    const prompt = `
You are extracting items from RESTAURANT INVOICES (facturi).
The text below is extracted from an invoice PDF that may contain MULTIPLE INVOICES.

⚠️ CRITICAL: Extract ALL products/ingredients from ALL invoices in the document!
⚠️ DO NOT stop after the first invoice - scan the ENTIRE text!

Look for patterns like:
- Product name followed by unit, quantity, price
- Tables with columns: Produs/Denumire, UM, Cantitate, Pret, Total
- Multiple "Factura:" sections = multiple invoices = extract from ALL of them!

Common Romanian units: kg, g, l, ml, buc, bucati, cutii, pachete

Return STRICT JSON with ALL items from ALL invoices combined:
{
  "supplierName": "string or null",
  "invoiceDate": "ISO date string or null",
  "totalAmount": number or null (sum of all invoices if multiple),
  "items": [
    {
      "itemName": "string (exact product name)",
      "quantity": number,
      "unit": "string (kg, g, l, ml, buc, etc.)",
      "unitPrice": number or null,
      "totalPrice": number or null
    }
  ]
}

⚠️ The items array MUST contain products from ALL invoices in the document, not just the first one!

Invoice text:
${text}
`;

    try {
      console.log('Sending text to OpenAI for extraction...');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 4096,
      });

      const rawContent = response.choices[0].message.content;
      console.log('========== RAW OPENAI TEXT RESPONSE ==========');
      console.log(rawContent);
      console.log('===============================================');

      const result = JSON.parse(rawContent);
      console.log(`✅ Extracted ${result.items?.length || 0} items from text`);

      return {
        supplierName: result.supplierName,
        invoiceDate: result.invoiceDate ? new Date(result.invoiceDate) : undefined,
        totalAmount: result.totalAmount,
        items: (result.items || []).map((item) => ({
          ...item,
          unit: item.unit || 'buc',
        })),
      };
    } catch (error) {
      console.error('❌ Error extracting invoice from text:', error);
      return { items: [] };
    }
  }

  /* =========================
        IMAGE OCR
     ========================= */

  private async extractTextFromImage(buffer: Buffer): Promise<string> {
    if (!this.openai) return '';

    const base64 = buffer.toString('base64');

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract all text from this image.' },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64}` },
              },
            ],
          },
        ],
      });

      return response.choices[0].message.content || '';
    } catch {
      return '';
    }
  }

  /* =========================
        MULTI-PAGE PDF OCR
     ========================= */

  private async processPdfWithVision(pdfBuffer: Buffer): Promise<{
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
    if (!this.openai) return { items: [] };

    try {
      // Robust fix: Write to temp file to avoid Buffer/ArrayBuffer ambiguity
      const { join } = await import('path');
      const { writeFile, unlink } = await import('fs/promises');
      const { tmpdir } = await import('os');

      const tempPath = join(tmpdir(), `upload_${Date.now()}.pdf`);
      await writeFile(tempPath, pdfBuffer);

      try {
        // Convert all PDF pages to PNG images using file path
        console.log('Converting PDF to PNG images...');
        const pngPages = await pdfToPng(tempPath, {
          disableFontFace: true,
          useSystemFonts: true,
          viewportScale: 2.0, // Higher quality for better OCR
        });

        console.log(`✅ Converted PDF to ${pngPages.length} PNG pages`);
        console.log('Page sizes:', pngPages.map(p => p.content.length).join(', '), 'bytes');

        // Build content array with all pages
        const content: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [
          {
            type: 'text',
            text: `
You are a professional invoice data extractor. Your job is to extract ALL products/ingredients from a RESTAURANT INVOICE.

The images show pages of an invoice document. You MUST extract EVERY SINGLE PRODUCT/INGREDIENT you can see.

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. Look at EVERY page carefully - scan for product lists, line items, tables, any text that looks like a product name
2. Extract EVERY product you see, even if:
   - Price is missing
   - Quantity is missing (default to 1)
   - Unit is missing (default to "buc")
   - Some information is unclear
3. Look for patterns like:
   - Product name + quantity + unit + price
   - Product name + quantity
   - Just product names (extract them anyway!)
4. Common units: kg, g, l, ml, buc, pcs, cutii, bucăți, cutie, pachet
5. If you see ANY text that could be a product name, extract it as an item
6. DO NOT return an empty items array unless the invoice is completely blank

EXAMPLES OF WHAT TO EXTRACT:
- "Făină albă 1kg" → itemName: "Făină albă", quantity: 1, unit: "kg"
- "Zahar 2 pachete" → itemName: "Zahar", quantity: 2, unit: "pachet"
- "Lapte" → itemName: "Lapte", quantity: 1, unit: "buc"
- "Ulei floarea soarelui 0.5l" → itemName: "Ulei floarea soarelui", quantity: 0.5, unit: "l"

Return STRICT JSON in this EXACT format:
{
  "supplierName": "string or null",
  "invoiceDate": "ISO date string or null",
  "totalAmount": number or null,
  "items": [
    {
      "itemName": "string (exact product name as written on invoice)",
      "quantity": number (default to 1 if missing),
      "unit": "string (kg, g, l, ml, buc, etc. - default to 'buc' if missing)",
      "unitPrice": number or null,
      "totalPrice": number or null
    }
  ]
}

⚠️ WARNING: If you see products on the invoice but return an empty items array, you have FAILED your task.
The items array MUST contain at least one item if there are any products visible on the invoice pages.
`
          },
        ];

        // Add each page as an image
        console.log('Adding pages to OpenAI Vision request...');
        for (let i = 0; i < pngPages.length; i++) {
          const page = pngPages[i];
          const base64 = page.content.toString('base64');
          console.log(`Page ${i + 1}: ${base64.length} base64 chars`);
          content.push({
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${base64}` },
          });
        }

        console.log('Sending request to OpenAI Vision API...');
        const textContent = content.find(c => c.type === 'text');
        console.log('Prompt length:', textContent && 'text' in textContent ? textContent.text.length : 0);
        console.log('Total content items:', content.length);
        
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: content,
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 4096,
        });

        const rawContent = response.choices[0].message.content;
        console.log('========== RAW OPENAI RESPONSE ==========');
        console.log(rawContent);
        console.log('=========================================');

        let result;
        try {
          result = JSON.parse(rawContent);
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          console.error('Raw content that failed to parse:', rawContent);
          return { items: [] };
        }

        console.log('========== PARSED RESULT ==========');
        console.log(JSON.stringify(result, null, 2));
        console.log('===================================');
        console.log(`Extracted ${result.items?.length || 0} items from ${pngPages.length} pages`);

        if (!result.items || result.items.length === 0) {
          console.warn('⚠️  WARNING: No items extracted from invoice!');
          console.warn('Result structure:', Object.keys(result));
        }

        return {
          supplierName: result.supplierName,
          invoiceDate: result.invoiceDate ? new Date(result.invoiceDate) : undefined,
          totalAmount: result.totalAmount,
          items: (result.items || []).map((item) => ({
            ...item,
            unit: item.unit || 'buc',
          })),
        };

      } finally {
        // Always clean up temp file
        await unlink(tempPath).catch(() => { });
      }
    } catch (error) {
      console.error('========== ERROR PROCESSING PDF WITH VISION ==========');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      if (error?.response) {
        console.error('API Response error:', JSON.stringify(error.response, null, 2));
      }
      console.error('======================================================');
      return { items: [] };
    }
  }
}
