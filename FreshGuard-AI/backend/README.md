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

The API requires a valid MongoDB connection and seeded users before login or saving results. `python -m scripts.seed` creates development-only warehouse accounts for dispatch manager (`EMP-1001`), quality manager (`EMP-1002`), dispatch manager (`EMP-1003`), rider (`EMP-1004`), and administrator (`EMP-1005`); each uses `demo123`. `EMP-1001` can access order status and dispatch/delivery operations only; API role checks prevent that account from inspecting, packing, or managing inventory. Do not use these credentials outside local development. Successful inspections and their detections are saved together as MongoDB documents; original images are saved under `uploads/`. `/api/health` checks MongoDB connectivity as well as reporting model status.

## Main endpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/inspections` (optional `order_id` links a model result to an order)
- `GET /api/inspections`
- `PATCH /api/inspections/{inspection_id}/decision` (quality-manager override with a reason)
- `GET /api/inventory`
- `GET /api/analytics/dashboard`
- `GET /api/reports/export`
- `GET /api/notifications`
- `GET /api/health`

## Order lifecycle API

The backend now persists the first connected warehouse workflow in MongoDB:

1. Create an order with `POST /api/orders`; the response includes a private `tracking_id` for sharing with the customer.
2. Inspect it with `POST /api/inspections` and include its `order_id`. ACCEPT creates a rule-based packing recommendation; REVIEW/REJECT creates an alert. REVIEW requires a quality-manager decision before packing or dispatch.
3. Complete packing through `PATCH /api/packing/{order_id}/status`. Completion requires at least one checklist item.
4. Manage riders with `GET/POST /api/riders` and `PATCH /api/riders/{rider_id}`. Create a dispatch with `POST /api/dispatch`; the backend checks inspection, packing, order state, and atomic rider availability.
5. Advance delivery state with `PATCH /api/dispatch/{dispatch_id}/status`. Store GPS/device or explicitly labeled demo location updates at `POST /api/delivery/{dispatch_id}/location`.
6. Submit temperature readings to `POST /api/temperature/readings?dispatch_id=...`. The default source is `DEMO`; real `DEVICE` readings require a configured `TELEMETRY_DEVICE_TOKEN` in `X-Device-Token`. Out-of-range data generates a persisted alert. Read or update category thresholds at `GET/PATCH /api/settings/temperature-thresholds`; updates require ADMIN.
7. Record transit events with `POST /api/transit/{dispatch_id}/events`. Severity is rule-derived from event magnitude, source is `DEMO` by default, and trusted device submissions require `X-Device-Token`. Warning/critical events create persisted alerts and lower the documented integrity score. Read/acknowledge/resolve alerts at `/api/alerts`.
8. Customers can use `GET /api/customer/orders/{tracking_id}` and submit one post-delivery feedback record with `POST /api/customer/feedback`.

All warehouse APIs require a bearer token. Role checks restrict quality overrides, packing, rider administration, dispatch, and delivery updates. Public customer routes expose only the tracking projection and require the unguessable tracking token; they do not return employee, inspection, or rider contact details. All timestamps are UTC. New collections are indexed by their lifecycle identifiers and common warehouse/time filters.

The location endpoint accepts GPS-provider updates. The Next.js telemetry page also provides an operator-controlled simulation that saves explicitly labeled `DEMO` locations, temperatures, and transit events through these endpoints. Its coordinates are fictional demonstration points, not GPS fixes or a street map. Real live tracking still requires configured hardware/location providers, a trusted `TELEMETRY_DEVICE_TOKEN`, and `source=GPS`/`source=DEVICE` submissions. Customer order tracking is available in the frontend at `/track` using the private token returned when an order is created.

Temperature ranges default to 2–8°C and can be overridden by produce category through the settings API. Critical alerts are raised when a reading exceeds the configured range by `TEMPERATURE_CRITICAL_MARGIN_C`. Transit severity thresholds use `SHOCK_WARNING_G` and `SHOCK_CRITICAL_G`; tilt and delay thresholds are rule defaults. Rider performance is computed from stored delivery and transit records, with no seeded performance metrics. Update the example environment file when changing global defaults.

`GET /api/analytics/dashboard` uses persisted records and accepts optional `date_from` / `date_to` ISO datetimes. The response includes inspection, order, packing, dispatch, delivery, temperature-alert, and transit-alert counts. Inspection and delivery analytics support the same date filters; temperature analytics can be filtered by dispatch and date. The connected frontend provides persisted analytics and report summaries, CSV export, order/packing/rider/dispatch workflows, alert management, and admin-only category temperature limits.
