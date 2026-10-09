# FreshGuard AI Backend

FastAPI backend for warehouse-scoped produce inspection. The API supports mock inference while the training notebooks and exported model artifacts are completed.

## Local setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python scripts/seed.py
uvicorn app:app --reload --port 8000
```

Open `http://localhost:8000/docs` for the API documentation.

## Docker

```bash
docker compose up --build
```

The compose stack starts FastAPI and PostgreSQL. Run migrations and seed inside the API container before using login.

## Model status

Both training notebooks currently contain TODO placeholders and both `.keras` files are empty. `MOCK_AI=true` is therefore the supported development mode. Once trained artifacts exist, inspect their actual input preprocessing and output classes, then implement the mappings in `services/model1_service.py` and `services/model2_service.py` before setting `MOCK_AI=false`.

## Main endpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/inspections`
- `GET /api/inspections`
- `GET /api/inventory`
- `GET /api/analytics/dashboard`
- `GET /api/reports/export`
- `GET /api/notifications`
- `GET /api/health`
