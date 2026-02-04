"""
Receipt Processing Agent using CrewAI
Extracts sold menu items from restaurant receipts
STRICTLY aligned with backend Recipe / Inventory consumption flow
"""

from crewai import Agent, Task, Crew
from pydantic import BaseModel, Field, validator
from typing import List, Optional
import json
import re


# =========================
# MODELS
# =========================

class ReceiptItem(BaseModel):
    # Exact name as printed on receipt
    itemName: str = Field(..., description="Exact item name from receipt")

    # Internal recipe identifier
    recipeKey: str = Field(
        ...,
        description="Must EXACTLY match Recipe.name in backend (case-insensitive)",
    )

    quantity: float = Field(..., gt=0)
    unitPrice: Optional[float] = None
    totalPrice: Optional[float] = None

    @validator("recipeKey")
    def normalize_recipe_key(cls, v: str) -> str:
        # hard normalization safeguard
        v = v.strip().lower()
        v = re.sub(r"\s+", " ", v)
        return v


class ReceiptData(BaseModel):
    receiptDate: Optional[str] = None
    totalAmount: Optional[float] = None
    items: List[ReceiptItem] = []


# =========================
# AGENT FUNCTION
# =========================

def process_receipt_with_ai(text_content: str) -> ReceiptData:
    """
    Process receipt text using AI agent.

    CRITICAL CONTRACT:
    - recipeKey MUST correspond to an existing Recipe.name
    - backend WILL reject unknown recipeKey
    """

    receipt_agent = Agent(
        role="Receipt Data Extractor",
        goal=(
            "Extract sold food items from restaurant receipts and map them "
            "to internal recipe identifiers used by the inventory system"
        ),
        backstory=(
            "You are extremely strict. You NEVER invent recipe identifiers. "
            "You normalize menu items into existing internal recipe names."
        ),
        verbose=True,
    )

    task = Task(
        description=f"""
Analyze the following restaurant receipt text.

Extract ONLY SOLD FOOD ITEMS.
Ignore:
- drinks
- tips
- taxes
- service charges

For EACH food item, extract:

1. itemName
   - exact name as printed on receipt

2. recipeKey
   - INTERNAL recipe identifier
   - MUST EXIST in backend Recipe table
   - lowercase
   - singular
   - Romanian / menu-internal naming
   - remove marketing words (classic, special, house, etc.)
   - remove cooking style words (grilled, fried, etc.)
   - remove size words (large, small)

❌ DO NOT invent recipeKey  
❌ DO NOT keep receipt marketing names  

Examples:
- "Chicken Soup" → "supa pui"
- "Pasta Carbonara" → "carbonara"
- "Caesar Salad" → "salata caesar"
- "Burger Classic" → "burger"
- "Beef Burger XXL" → "burger"

Return STRICT JSON ONLY in this format:

{{
  "receiptDate": "ISO date string or null",
  "totalAmount": number or null,
  "items": [
    {{
      "itemName": "string",
      "recipeKey": "string",
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
        expected_output="Valid JSON object matching the schema exactly",
    )

    crew = Crew(
        agents=[receipt_agent],
        tasks=[task],
        verbose=True,
    )

    result = crew.kickoff()

    # =========================
    # PARSING
    # =========================

    try:
        result_text = str(result)
        json_start = result_text.find("{")
        json_end = result_text.rfind("}") + 1

        if json_start >= 0 and json_end > json_start:
            json_str = result_text[json_start:json_end]
            data = json.loads(json_str)
            return ReceiptData(**data)

    except Exception as e:
        print(f"[ReceiptAgent] JSON parse error: {e}")

    return ReceiptData(items=[])


# =========================
# LOCAL TEST
# =========================

if __name__ == "__main__":
    sample_text = """
    RESTAURANT RECEIPT
    Date: 2024-01-15 18:30

    Items:
    1. Chicken Soup x2 - 8.00 each = 16.00
    2. Pasta Carbonara x1 - 15.00
    3. Caesar Salad x1 - 12.00
    4. Cola x2 - 3.00 each

    Subtotal: 49.00
    Tax: 3.92
    Total: 52.92
    """

    result = process_receipt_with_ai(sample_text)
    print(json.dumps(result.dict(), indent=2, ensure_ascii=False))
