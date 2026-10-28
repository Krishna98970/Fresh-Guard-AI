# FreshGuard AI Backend

FastAPI backend for authenticated, warehouse-scoped image inspections. It loads the produce CNN and YOLO cardboard detector at startup and does not fall back to mock predictions.

## Local setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Start MongoDB locally (or run `docker compose up -d mongo`).
# Set MONGODB_URI if MongoDB is not running on localhost:27017.
python -m scripts.seed
uvicorn app:app --reload --port 8000
```

The backend loads `.env` from its own directory when settings are initialized. Values already set in the shell take precedence. `MONGODB_URI` defaults to `mongodb://localhost:27017/freshguard`; set `MONGODB_DATABASE` to override the database name.
The frontend runs on `http://localhost:3000` by default, which is the configured CORS origin. Set `FRONTEND_URL` if it runs elsewhere. Set `PRODUCE_MODEL_PATH` and `CARDBOARD_MODEL_PATH` to the actual checkpoint files before starting the API; the example values assume a `krishna/` model directory at the repository root.

Open `http://localhost:8000/docs` for the API documentation.

## Docker

```bash
docker compose up --build
```

The compose stack starts FastAPI and MongoDB, and mounts the repository's `krishna/` model directory read-only into the API container. Seed the database inside the API container before using login:

```bash
docker compose exec api python -m scripts.seed
```

## Inspection models

- `../../krishna/cnn_model.pt` is a six-class fruit freshness classifier: fresh/rotten apples, bananas, and oranges. This checkpoint does not classify vegetables.
- `../../krishna/yolov8n.pt` is loaded using Ultralytics YOLO for cardboard detection. The supplied checkpoint is the general COCO `yolov8n.pt` model and does not have a cardboard class, so it cannot produce valid cardboard detections as-is. The API reports that limitation instead of relabeling unrelated COCO objects as cardboard. Fine-tune the checkpoint with a labeled cardboard dataset and use a class named `cardboard`, `cardboard box`, `cardboard carton`, `carton`, or `corrugated box` to enable that path.
- The fruit classifier and cardboard detector run on CPU. Startup fails explicitly if either checkpoint is missing or invalid; predictions are never replaced with mock output. YOLO model files are trusted Python checkpoints; only load model files from a trusted source.
- Set `PRODUCE_MODEL_PATH` and `CARDBOARD_MODEL_PATH` in `.env` to override the paths. `docker-compose.yml` supplies the container paths and mounts the model directory.
- Fruit decisions use the classifier's predicted class and confidence; `ACCEPT_THRESHOLD` and `REVIEW_THRESHOLD` control when low-confidence predictions are sent for manual review. Cardboard detections always require manual quality review.

The fruit checkpoint contains weight arrays but not its training script or preprocessing metadata. The backend uses the architecture implied by those array shapes and resizes RGB input to 224 × 224 with values scaled to [0, 1]. Confirm these preprocessing choices against the original training pipeline before relying on model accuracy.

The API requires a valid MongoDB connection and seeded user before login or saving results. Successful inspections and their detections are saved together as MongoDB documents; original images are saved under `uploads/`. `/api/health` checks MongoDB connectivity as well as reporting model status.

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
