# StockX - Restaurant Inventory Management System

A comprehensive inventory management system for restaurants that automatically tracks purchases, sales, and manages stock based on recipes using AI-powered document processing.

## 🎯 Features

- **📄 Invoice Processing**: Upload supplier invoices (PDF/Images) and automatically extract ingredient details using AI
- **🧾 Receipt Processing**: Upload sales receipts and extract food items sold with automatic inventory deduction
- **📦 Inventory Tracking**: Real-time stock levels for all ingredients with low stock alerts
- **👨‍🍳 Recipe Management**: Define recipes that map food items to ingredients
- **🔄 Automatic Deduction**: When a receipt is processed, inventory is automatically deducted based on recipes
- **📊 Dashboard**: Visual analytics with charts showing inventory levels and trends

## 🏗️ System Architecture

### How It Works

1. **Invoice Upload**: Restaurant uploads supplier invoices

   - Documents are processed using AWS Textract and OpenAI
   - Ingredients are extracted and added to inventory automatically

2. **Recipe Creation**: Restaurant defines recipes

   - Maps food items (e.g., "Soup") to ingredients and quantities
   - Specifies how much of each ingredient is needed per serving

3. **Receipt Upload**: Restaurant uploads sales receipts

   - AI extracts food items sold from receipts
   - System finds matching recipes
   - Inventory is automatically deducted based on recipes

4. **Inventory Management**: Real-time tracking
   - View current stock levels
   - Set minimum thresholds for alerts
   - Track all additions and deductions

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 18.3.1 + TypeScript 5.6.2
- **Build Tool**: Vite 6.0.5
- **UI**: Radix UI components + Tailwind CSS 4.0.4
- **State**: Redux Toolkit 2.5.0 + React Redux 9.2.0
- **Routing**: React Router 6.29.0
- **Forms**: React Hook Form 7.54.2 + Zod 3.24.2
- **Charts**: Recharts 2.15.1
- **Icons**: Lucide React

### Backend

- **Framework**: NestJS 10.4.15 + TypeScript 5.1.3
- **Database**: PostgreSQL 15 + Prisma 6.4.1
- **Auth**: Passport.js + JWT + Argon2
- **File Upload**: Multer + AWS S3
- **AI/ML**:
  - OpenAI 6.9.1 (GPT-4 for document processing)
  - Google Generative AI 0.22.0
  - AWS Textract (document text extraction)
- **Document Processing**: pdf-parse, xlsx, csv-parse

### AI Agents (Python)

- **Framework**: CrewAI 0.76.0
- **LLMs**: OpenAI, Anthropic
- **PDF Processing**: PyPDF2, pdf2image, Pillow
- **AWS**: boto3 (Textract integration)

### DevOps

- **Containerization**: Docker + Docker Compose
- **Deployment**:
  - Frontend: Netlify
  - Backend: Render
  - Database: PostgreSQL (Render)

## 📁 Project Structure

```
StockX/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── store/        # Redux store
│   │   └── hooks/        # Custom hooks
│   └── netlify.toml      # Netlify deployment config
│
├── backend/               # NestJS backend application
│   ├── src/
│   │   ├── auth/         # Authentication module
│   │   ├── invoices/     # Invoice processing
│   │   ├── receipts/     # Receipt processing
│   │   ├── inventory/    # Inventory management
│   │   ├── recipes/      # Recipe management
│   │   ├── upload/       # File upload & processing
│   │   └── prisma/       # Prisma service
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── render.yaml       # Render deployment config
│
├── ai-agents/            # Python AI agents
│   ├── invoice_agent.py  # Invoice processing agent
│   └── receipt_agent.py  # Receipt processing agent
│
├── docker-compose.yml    # Docker services
└── README.md
```

## 🚀 Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Quick Setup

1. **Start Database**:

   ```bash
   docker-compose up -d
   ```

2. **Backend**:

   ```bash
   cd backend
   npm install
   cp .env.example .env  # Edit with your config
   npm run prisma:generate
   npm run prisma:migrate
   npm run start:dev
   ```

3. **Frontend**:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Docs: http://localhost:3000/api

## 📊 Database Schema

The system uses PostgreSQL with the following main entities:

- **Users**: Restaurant staff accounts
- **Invoices**: Supplier invoices with extracted items
- **Receipts**: Sales receipts with food items
- **Ingredients**: Master list of ingredients
- **Inventory**: Current stock levels
- **Recipes**: Food items mapped to ingredients
- **Inventory Updates**: History of stock additions
- **Inventory Deductions**: History of stock usage

## 🔐 Authentication

- JWT-based authentication
- Password hashing with Argon2
- Protected API routes
- Role-based access (User/Admin)

## 📝 API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user

### Invoices

- `GET /invoices` - List all invoices
- `POST /invoices` - Upload invoice
- `GET /invoices/:id` - Get invoice details
- `DELETE /invoices/:id` - Delete invoice

### Receipts

- `GET /receipts` - List all receipts
- `POST /receipts` - Upload receipt
- `GET /receipts/:id` - Get receipt details
- `DELETE /receipts/:id` - Delete receipt

### Inventory

- `GET /inventory` - List all inventory items
- `GET /inventory/low-stock` - Get low stock items
- `GET /inventory/:id` - Get inventory item details
- `PATCH /inventory/:id/threshold` - Update threshold

### Recipes

- `GET /recipes` - List all recipes
- `POST /recipes` - Create recipe
- `GET /recipes/:id` - Get recipe details
- `PATCH /recipes/:id` - Update recipe
- `DELETE /recipes/:id` - Delete recipe

## 🔄 Workflow Example

1. **Upload Invoice**: Restaurant receives invoice from supplier

   - Upload PDF/image of invoice
   - System extracts: supplier name, date, items (tomatoes 10kg, onions 5kg, etc.)
   - Inventory automatically updated: +10kg tomatoes, +5kg onions

2. **Create Recipe**: Define "Soup" recipe

   - Ingredients: 0.5kg tomatoes, 0.2kg onions, 0.1kg garlic per serving
   - Save recipe

3. **Upload Receipt**: Customer buys 2 servings of soup

   - Upload receipt showing "Soup x2"
   - System extracts food items from receipt
   - Finds "Soup" recipe
   - Automatically deducts: 1kg tomatoes, 0.4kg onions, 0.2kg garlic

4. **View Inventory**: Check current stock levels
   - See real-time quantities
   - Get alerts for low stock items

## 🚢 Deployment

### Frontend (Netlify)

- Automatic deployments from Git
- Environment variables: `VITE_API_URL`

### Backend (Render)

- Web service with PostgreSQL database
- Environment variables from `.env`
- Automatic builds and migrations

See deployment configs in:

- `frontend/netlify.toml`
- `backend/render.yaml`
- `backend/render-build.sh`

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Detailed setup instructions
- API Documentation available at `/api` when backend is running
- Swagger UI for interactive API testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License

## 🆘 Support

For issues and questions, please open an issue on GitHub.
