"""
Invoice Processing Agent using CrewAI
Extracts structured data from invoice documents
Aligned with backend Ingredient / Inventory model
"""

from crewai import Agent, Task, Crew
from pydantic import BaseModel
from typing import List, Optional
import json


class InvoiceItem(BaseModel):
    # Raw name as written on invoice
    itemName: str

    # Internal ingredient key (must match Ingredient.name from DB seed)
    ingredientKey: str

    quantity: float
    unit: str
    unitPrice: Optional[float] = None
    totalPrice: Optional[float] = None


class InvoiceData(BaseModel):
    supplierName: Optional[str] = None
    invoiceDate: Optional[str] = None
    totalAmount: Optional[float] = None
    items: List[InvoiceItem] = []


def process_invoice_with_ai(text_content: str) -> InvoiceData:
    """
    Process invoice text using AI agent to extract structured data.
    IMPORTANT: ingredientKey must be deterministic and match backend Ingredient.name
    """

    invoice_agent = Agent(
        role='Invoice Data Extractor',
        goal=(
            'Extract structured invoice data and normalize line items '
            'to internal ingredient keys used by the inventory system'
        ),
        backstory=(
            'You are an expert in reading invoices and mapping commercial product names '
            'to normalized internal ingredient identifiers.'
        ),
        verbose=True
    )

    task = Task(
        description=f"""
Analyze the following invoice text and extract:

1. Supplier/Vendor name
2. Invoice date
3. Total amount
4. All line items

For EACH line item, extract:
- itemName: the exact product name as written on the invoice
- ingredientKey: the INTERNAL ingredient identifier

Rules for ingredientKey (CRITICAL):
- lowercase
- singular
- Romanian
- MUST correspond to an ingredient used in stock management
- remove brand names, percentages, packaging info

Examples:
- "Faina alba 000" -> "faina"
- "Zahar tos" -> "zahar"
- "Lapte 3.5%" -> "lapte"
- "Ulei floarea soarelui" -> "ulei"
- "Cartofi albi" -> "cartofi"
- "Ceapa galbena" -> "ceapa"
- "Rosii cherry" -> "rosii"

Units must be normalized to: kg, g, l, ml, pcs

Return STRICT JSON in the following format:

{{
  "supplierName": "string or null",
  "invoiceDate": "ISO date string or null",
  "totalAmount": number or null,
  "items": [
    {{
      "itemName": "string",
      "ingredientKey": "string",
      "quantity": number,
      "unit": "string",
      "unitPrice": number or null,
      "totalPrice": number or null
    }}
  ]
}}

Invoice Text:
{text_content}
""",
        agent=invoice_agent,
        expected_output='Valid JSON object with normalized invoice data'
    )

    crew = Crew(
        agents=[invoice_agent],
        tasks=[task],
        verbose=True
    )

    result = crew.kickoff()

    try:
        result_text = str(result)
        json_start = result_text.find('{')
        json_end = result_text.rfind('}') + 1

        if json_start >= 0 and json_end > json_start:
            json_str = result_text[json_start:json_end]
            data = json.loads(json_str)
            return InvoiceData(**data)

    except Exception as e:
        print(f"[InvoiceAgent] Error parsing AI result: {e}")

    return InvoiceData(items=[])


if __name__ == '__main__':
    sample_text = """
    INVOICE
    Supplier: Fresh Foods Co.
    Date: 2024-01-15
    Invoice #: INV-001

    Items:
    1. Faina alba 000 - 10 kg @ 2.50/kg = 25.00
    2. Zahar tos - 5 kg @ 1.50/kg = 7.50
    3. Lapte 3.5% - 10 l @ 1.20/l = 12.00

    Total: 44.50
    """

    result = process_invoice_with_ai(sample_text)
    print(json.dumps(result.dict(), indent=2, ensure_ascii=False))
