# Deploy Frontend to Vercel

## Fix 404 on routes

The project has a `vercel.json` that rewrites all routes to `index.html` so the React app (client-side routing) works. Without it, visiting or refreshing `/login`, `/dashboard`, etc. returns 404.

## Project settings in Vercel

1. **Root Directory**: Set to `frontend` (this repo is a monorepo; the app is in the `frontend` folder).
2. **Build Command**: `npm run build` (default)
3. **Output Directory**: `dist` (Vite default)
4. **Install Command**: `npm install` (default)

## Backend (API)

Vercel is hosting only the **frontend**. The NestJS backend must run somewhere else (e.g. Render, Railway, Fly.io) with a PostgreSQL database.

After the backend is deployed:

1. In Vercel → your project → **Settings** → **Environment Variables**
2. Add: `VITE_API_URL` = `https://your-backend-url.com`
3. Redeploy so the frontend uses the production API.

If `VITE_API_URL` is not set, the app uses `http://localhost:3000`, which only works locally.
