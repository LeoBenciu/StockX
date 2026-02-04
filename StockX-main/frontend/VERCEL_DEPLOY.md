# Deploy Frontend to Vercel

## If you see "404: NOT_FOUND" (Vercel error page)

This usually means Vercel is not building or serving the frontend. Do this:

### 1. Set Root Directory to `frontend`

The repo has **backend**, **frontend**, and **ai-agents** in one repo. Vercel must build only the frontend.

- Vercel Dashboard → your project → **Settings** → **General**
- Find **Root Directory** → click **Edit**
- Enter: **`frontend`** (no leading slash)
- Save

### 2. Confirm build settings

Under **Settings** → **General** → **Build & Development Settings**:

| Setting            | Value           |
|--------------------|-----------------|
| Framework Preset   | Vite            |
| Build Command      | `npm run build` |
| Output Directory   | `dist`          |
| Install Command    | `npm install`   |

(These are also in `vercel.json`; the dashboard overrides if set.)

### 3. Redeploy

- **Deployments** → open the **⋯** on the latest deployment → **Redeploy**
- Or push a new commit after changing Root Directory

### 4. Check the build

If 404 persists, open the latest deployment → **Building** tab and confirm:

- Build runs from the `frontend` folder (paths in logs should be under `frontend/`).
- Build finishes with "Build Completed" and no red errors.
- If the build fails, fix the error (e.g. missing env, Node version) then redeploy.

---

## Fix 404 on app routes (/login, /dashboard, etc.)

The project has a `vercel.json` that rewrites all routes to `index.html` so the React app (client-side routing) works. After the correct build is deployed, those routes will load the app instead of 404.

## Backend (API)

Vercel is hosting only the **frontend**. The NestJS backend must run somewhere else (e.g. Render, Railway, Fly.io) with a PostgreSQL database.

After the backend is deployed:

1. In Vercel → your project → **Settings** → **Environment Variables**
2. Add: `VITE_API_URL` = `https://your-backend-url.com`
3. Redeploy so the frontend uses the production API.

If `VITE_API_URL` is not set, the app uses `http://localhost:3000`, which only works locally.
