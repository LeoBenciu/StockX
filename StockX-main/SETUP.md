# StockX Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Docker and Docker Compose
- PostgreSQL 15 (or use Docker)
- AWS Account (for S3 and Textract)
- OpenAI API Key
- Google AI API Key (optional)

## Initial Setup

### 1. Database Setup

Start PostgreSQL using Docker:

```bash
docker-compose up -d
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start development server
npm run start:dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3000" > .env

# Start development server
npm run dev
```

### 4. AI Agents Setup (Optional)

```bash
cd ai-agents
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://stockx_user:stockx_password@localhost:5432/stockx_db?schema=public"
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=stockx-uploads
OPENAI_API_KEY=your-openai-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

## AWS Setup

1. Create an S3 bucket for file uploads
2. Create IAM user with S3 and Textract permissions
3. Configure AWS credentials in backend .env

## Usage

1. Register a new account at http://localhost:5173/register
2. Upload invoices to add ingredients to inventory
3. Create recipes that map food items to ingredients
4. Upload receipts to automatically deduct inventory based on recipes

## Features

- **Invoice Processing**: Upload supplier invoices (PDF/Image) and automatically extract ingredient details
- **Receipt Processing**: Upload sales receipts and extract food items sold
- **Inventory Management**: Real-time stock tracking with low stock alerts
- **Recipe System**: Define recipes that map food items to ingredients
- **Automatic Deduction**: When a receipt is processed, inventory is automatically deducted based on recipes

## API Documentation

Once the backend is running, visit http://localhost:3000/api for Swagger API documentation.

## Deployment

### Frontend (Netlify)

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable: `VITE_API_URL` (your backend URL)

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your repository
3. Set build command: `chmod +x render-build.sh && ./render-build.sh`
4. Set start command: `npm run start:prod`
5. Add all environment variables from .env
6. Create a PostgreSQL database on Render and update DATABASE_URL

