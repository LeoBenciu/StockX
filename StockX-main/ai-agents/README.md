# AI Agents for StockX

This directory contains Python-based AI agents using CrewAI for advanced document processing and inventory management.

## Setup

1. Install Python 3.10+
2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Agents

### Invoice Processing Agent
Extracts detailed information from supplier invoices using AI vision and text extraction.

### Receipt Processing Agent
Identifies food items from sales receipts and maps them to recipes.

### Inventory Analysis Agent
Analyzes inventory patterns and provides recommendations.

## Usage

The agents are called by the backend NestJS service when processing documents. They can also be run independently for testing.

