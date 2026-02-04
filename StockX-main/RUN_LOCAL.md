# Run StockX on localhost

## 1. Start Docker

**Start Docker Desktop** (required for PostgreSQL). Then:

```bash
cd /Users/test/Desktop/StockX/StockX-main
docker-compose up -d
```

Wait a few seconds for Postgres to be ready.

## 2. Backend (database + API)

```bash
cd backend
npm run prisma:migrate   # first time only (or after schema changes)
npm run start:dev
```

Leave this terminal running. Backend will be at **http://localhost:3000** (API docs at http://localhost:3000/api).

## 3. Frontend (new terminal)

```bash
cd frontend
npm run dev
```

Frontend will be at **http://localhost:5134**.

## One-command start (after Docker is running)

From project root:

```bash
./start.sh
```

This starts the database (if Docker is up), runs migrations, and starts both backend and frontend. Use Ctrl+C to stop.

## Ports

| Service   | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5134      |
| Backend  | http://localhost:3000     |
| API Docs | http://localhost:3000/api |
| Postgres | localhost:5433             |

## Troubleshooting

- **"Cannot connect to Docker daemon"** → Start Docker Desktop and run `docker-compose up -d` again.
- **Backend: "Can't reach database"** → Ensure Docker is running and `docker-compose up -d` has been run; then run `cd backend && npm run prisma:migrate`.
- **Port in use** → Change `server.port` in `frontend/vite.config.ts` or `PORT` in `backend/.env`.
