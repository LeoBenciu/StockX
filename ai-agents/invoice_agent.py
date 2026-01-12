"""
Invoice Processing Agent using CrewAI
Extracts structured data from invoice documents
"""

from crewai import Agent, Task, Crew
from pydantic import BaseModel
from typing import List, Optional
import json


class InvoiceItem(BaseModel):
    itemName: str
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
    Process invoice text using AI agent to extract structured data
    """
    # Create agent for invoice processing
    invoice_agent = Agent(
        role='Invoice Data Extractor',
        goal='Extract structured data from invoice text including supplier name, date, total amount, and line items',
        backstory='You are an expert at reading invoices and extracting key information accurately.',
        verbose=True
    )

    # Create task
    task = Task(
        description=f"""
        Analyze the following invoice text and extract:
        1. Supplier/Vendor name
        2. Invoice date
        3. Total amount
        4. All line items with:
           - Item name
           - Quantity
           - Unit (kg, g, l, ml, pcs, etc.)
           - Unit price (if available)
           - Total price (if available)
        
        Return the data as a JSON object matching this structure:
        {{
            "supplierName": "string or null",
            "invoiceDate": "ISO date string or null",
            "totalAmount": number or null,
            "items": [
                {{
                    "itemName": "string",
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
        expected_output='Valid JSON object with invoice data'
    )

    # Create crew and execute
    crew = Crew(
        agents=[invoice_agent],
        tasks=[task],
        verbose=True
    )

    result = crew.kickoff()
    
    # Parse the result (assuming it returns JSON)
    try:
        # Extract JSON from the result
        result_text = str(result)
        # Try to find JSON in the result
        json_start = result_text.find('{')
        json_end = result_text.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            json_str = result_text[json_start:json_end]
            data = json.loads(json_str)
            return InvoiceData(**data)
    except Exception as e:
        print(f"Error parsing AI result: {e}")
    
    # Return empty result if parsing fails
    return InvoiceData(items=[])


if __name__ == '__main__':
    # Example usage
    sample_text = """
    INVOICE
    Supplier: Fresh Foods Co.
    Date: 2024-01-15
    Invoice #: INV-001
    
    Items:
    1. Tomatoes - 10 kg @ $2.50/kg = $25.00
    2. Onions - 5 kg @ $1.50/kg = $7.50
    3. Garlic - 1 kg @ $5.00/kg = $5.00
    
    Total: $37.50
    """
    
    result = process_invoice_with_ai(sample_text)
    print(json.dumps(result.dict(), indent=2))

