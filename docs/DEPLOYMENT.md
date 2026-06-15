# Deployment Guide - Vercel Frontend + Render Backend

This guide details how to host the **SecureCode Reasoning Agent** web application in production.

---

## 1. Hosting the Backend on Render
The repository now includes a ready-to-use `render.yaml` at the project root. For this MVP, the recommended setup is:

- **Render Web Service** for the FastAPI backend
- **Render Free plan**
- **SQLite stored in the service filesystem**

### Recommended path
1. Push the repository to GitHub.
2. In Render, create a **Blueprint** from the repo so it reads `render.yaml`.
3. After service creation, set `FRONTEND_ORIGIN` to the final Vercel domain.
4. Redeploy once the frontend URL is known.

### What `render.yaml` already configures
- Build command: `pip install -r backend/requirements.txt`
- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health`
- SQLite database path: `sqlite:///./sqlite.db`
- App-local directories for:
  - reports
  - temporary uploaded scans
  - temporary repository extraction
  - vector cache store
- No persistent disk required

### Manual setup alternative
If you do not want to use Blueprint, you can still create the service manually:

1. Connect the repository.
2. Choose Environment: `Python`.
3. Configure:
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Configure these environment variables:
   - `PYTHONPATH=.`
   - `ENVIRONMENT=production`
   - `FRONTEND_ORIGIN=https://your-frontend-vercel.vercel.app`
   - `DATABASE_URL=sqlite:///./sqlite.db`
   - `APP_STORAGE_PATH=.`
   - `REPORTS_DIR=./reports`
   - `TEMP_REPOS_DIR=./temp_repos`
   - `TEMP_SCANS_DIR=./tmp_scans`
   - `VECTOR_STORE_PATH=./data/vector_store.json`
   - `AI_PROVIDER=local`
5. Optional AI variables if you want cloud enrichment:
   - `AZURE_OPENAI_ENDPOINT`
   - `AZURE_OPENAI_API_KEY`
   - `AZURE_OPENAI_DEPLOYMENT`
   - `AZURE_EMBEDDING_DEPLOYMENT`
   - `OPENAI_COMPATIBLE_BASE_URL`
   - `OPENAI_COMPATIBLE_API_KEY`
   - `OPENAI_COMPATIBLE_MODEL`

### Notes
- Render Free does **not** support persistent disks for web services.
- This setup works for a demo, but SQLite and generated files are **ephemeral** and can be lost after restart/redeploy.
- The app now reconstructs reports from database data when generated files are missing.
- The repository includes `backend/Dockerfile`, but for this MVP the **Python runtime is simpler and recommended**.

---

## 2. Hosting the Frontend on Vercel
You can host the React + Vite frontend on Vercel:

1.  **Create Vercel Project**:
    *   Connect the GitHub repository.
    *   Set **Root Directory** to `frontend`.
2.  **Configure Build Command**:
    *   Framework Preset: `Vite`
    *   Build Command: `npm run build`
    *   Output Directory: `dist`
3.  **Environment Variables**:
    *   Add `VITE_API_BASE_URL` = `https://your-backend-render.onrender.com`
4.  **SPA routing**:
    *   The repo includes `frontend/vercel.json` so client-side routes resolve to `index.html`.
5.  **Deploy**: Click Deploy. Vercel compiles the assets and hosts the React application statically.

---

## 3. Deployment order
Use this order to avoid broken CORS or API URLs:

1. Deploy backend on Render
2. Copy the Render backend URL
3. Deploy frontend on Vercel with `VITE_API_BASE_URL`
4. Copy the Vercel frontend URL
5. Update `FRONTEND_ORIGIN` in Render
6. Redeploy backend
