# 🚀 StockX is Now Running!

## ✅ Services Status

- ✅ **Database**: PostgreSQL running on port 5433
- ✅ **Backend API**: http://localhost:3000
- ✅ **Frontend**: http://localhost:5173
- ✅ **API Documentation**: http://localhost:3000/api

## 🎯 Quick Start Guide

### 1. Register an Account

- Go to http://localhost:5173
- Click "Register" to create a new account
- Fill in your name, email, and password

### 2. Explore the Dashboard

- After logging in, you'll see the main dashboard
- View inventory statistics and charts

### 3. Upload an Invoice

- Navigate to "Invoices" in the menu
- Drag and drop or click to upload a supplier invoice (PDF or image)
- The system will extract ingredients and add them to inventory

### 4. Create a Recipe

- Go to "Recipes" page
- Click "New Recipe"
- Enter recipe name (e.g., "Soup")
- Add ingredients with quantities
- Save the recipe

### 5. Upload a Receipt

- Navigate to "Receipts" page
- Upload a sales receipt (PDF or image)
- The system will:
  - Extract food items sold
  - Find matching recipes
  - Automatically deduct inventory

### 6. View Inventory

- Go to "Inventory" page
- See real-time stock levels
- Items below threshold will be highlighted

## 📝 Notes

- **AI Processing**: Invoice and receipt processing uses AI. For demo purposes, placeholder API keys are set. For production, add real OpenAI and AWS credentials.
- **File Uploads**: Files are processed asynchronously. Check the status in the list view.
- **Database**: All data is stored in PostgreSQL. The database persists in Docker volume.

## 🛑 Stopping the Services

To stop all services:

```bash
# Stop backend and frontend (Ctrl+C in their terminals)
# Stop database
cd /Users/test/Desktop/StockX
docker-compose down
```

## 🔄 Restarting

To restart everything:

```bash
cd /Users/test/Desktop/StockX
./start.sh
```

Or manually:

```bash
# Start database
docker-compose up -d

# Start backend (in one terminal)
cd backend && npm run start:dev

# Start frontend (in another terminal)
cd frontend && npm run dev
```

## 🐛 Troubleshooting

- **Backend not starting**: Check if port 3000 is available
- **Frontend not starting**: Check if port 5173 is available
- **Database connection error**: Make sure Docker is running and database container is up (`docker ps`)
- **Migration errors**: Run `cd backend && npm run prisma:migrate`

Enjoy exploring StockX! 🎉
