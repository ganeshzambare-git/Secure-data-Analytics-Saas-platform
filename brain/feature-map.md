# Feature Map - ReadyNest Analytics Engine

- **Authentication Gateway**
  - Tenant Resolve: `/api/v1/auth/tenant-resolve`
  - Login / JWT Issue: `/api/v1/auth/token`
  - Frontend: `frontend/src/app/page.tsx`
  
- **System Admin Deck**
  - Tenant creation, API key management: `/api/v1/admin/...`
  - Frontend: `frontend/src/app/dashboard/admin/page.tsx`
  
- **Data Scraper Terminal & ETL Hub**
  - Scrap target URL, trigger ETL cleaning: `/api/v1/pipeline/scrape`
  - Asynchronous scraping & ETL: Celery worker tasks in `backend/app/tasks/worker.py`
  - Frontend: `frontend/src/app/dashboard/analyst/page.tsx`
  
- **Machine Learning Workshop**
  - Model fitting, evaluation: `/api/v1/pipeline/train`
  - ML calculations (XGBoost/Scikit-learn): Celery worker tasks in `backend/app/tasks/worker.py`
  
- **Visual Insights Dashboard**
  - Serve pre-compiled SVGs: `/api/v1/dashboard/charts`
  - Rendering module: Plotly engine inside `backend/app/routes/dashboard.py`
