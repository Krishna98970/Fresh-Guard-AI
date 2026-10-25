# FreshGuard AI Backend

FastAPI backend for authenticated, warehouse-scoped image inspections. It loads the provided produce CNN and cardboard Faster R-CNN checkpoints at startup and does not fall back to mock predictions.

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
- `../../krishna/cardboard_best_model.pt` is a serialized torchvision Faster R-CNN detector. Its checkpoint contains no category-name mapping, so detections are returned with numeric class IDs and bounding boxes. The detector does not grade cardboard quality. Because this file serializes a complete Python model, load only a checkpoint from a trusted source.
- Both models run on CPU. Startup fails explicitly if either checkpoint is missing or invalid; predictions are never replaced with mock output.
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


