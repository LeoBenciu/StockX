"""
Receipt Processing Agent using CrewAI
Extracts food items from sales receipts
"""

from crewai import Agent, Task, Crew
from pydantic import BaseModel
from typing import List, Optional
import json


class ReceiptItem(BaseModel):
    itemName: str  # Food item name like "Soup", "Pasta", etc.
    quantity: float
    unitPrice: Optional[float] = None
    totalPrice: Optional[float] = None


class ReceiptData(BaseModel):
    receiptDate: Optional[str] = None
    totalAmount: Optional[float] = None
    items: List[ReceiptItem] = []


def process_receipt_with_ai(text_content: str) -> ReceiptData:
    """
    Process receipt text using AI agent to extract food items
    """
    # Create agent for receipt processing
    receipt_agent = Agent(
        role='Receipt Data Extractor',
        goal='Extract food items sold from restaurant receipt text',
        backstory='You are an expert at reading restaurant receipts and identifying food items that were sold.',
        verbose=True
    )

    # Create task
    task = Task(
        description=f"""
        Analyze the following receipt text and extract:
        1. Receipt date
        2. Total amount
        3. All FOOD ITEMS that were sold (ignore drinks, taxes, tips unless specifically food items)
        
        For each food item, extract:
        - Item name (e.g., "Soup", "Pasta", "Salad", "Burger")
        - Quantity (number of servings/items)
        - Unit price (if available)
        - Total price (if available)
        
        Return the data as a JSON object matching this structure:
        {{
            "receiptDate": "ISO date string or null",
            "totalAmount": number or null,
            "items": [
                {{
                    "itemName": "string (food item name)",
                    "quantity": number,
                    "unitPrice": number or null,
                    "totalPrice": number or null
                }}
            ]
        }}
        
        Receipt Text:
        {text_content}
        """,
        agent=receipt_agent,
        expected_output='Valid JSON object with receipt data containing food items'
    )

    # Create crew and execute
    crew = Crew(
        agents=[receipt_agent],
        tasks=[task],
        verbose=True
    )

    result = crew.kickoff()
    
    # Parse the result
    try:
        result_text = str(result)
        json_start = result_text.find('{')
        json_end = result_text.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            json_str = result_text[json_start:json_end]
            data = json.loads(json_str)
            return ReceiptData(**data)
    except Exception as e:
        print(f"Error parsing AI result: {e}")
    
    # Return empty result if parsing fails
    return ReceiptData(items=[])


if __name__ == '__main__':
    # Example usage
    sample_text = """
    RESTAURANT RECEIPT
    Date: 2024-01-15 18:30
    Table: 5
    
    Items:
    1. Soup x2 - $8.00 each = $16.00
    2. Pasta Carbonara x1 - $15.00
    3. Caesar Salad x1 - $12.00
    4. Soft Drink x2 - $3.00 each = $6.00
    
    Subtotal: $49.00
    Tax: $3.92
    Total: $52.92
    """
    
    result = process_receipt_with_ai(sample_text)
    print(json.dumps(result.dict(), indent=2))

