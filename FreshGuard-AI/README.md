# FreshGuard AI

FreshGuard AI is a two-part produce inspection prototype. The Next.js frontend accepts an image and presents an inspection result; the FastAPI backend exposes authenticated inspection endpoints and uses MongoDB for inspection records.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

In a second terminal:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open `http://localhost:3000`. The backend uses a fruit-classifier checkpoint and a YOLO checkpoint configured through its environment variables. The supplied `yolov8n.pt` is a general COCO model, not a cardboard-trained model; fine-tune it on labeled cardboard images before expecting cardboard detections.
