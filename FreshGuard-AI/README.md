# FreshGuard AI

FreshGuard AI is a two-part produce inspection prototype. The Next.js frontend accepts an image and presents an inspection result; the Flask backend exposes the `/api/inspect` endpoint where the trained models can be connected.

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

Open `http://localhost:3000`. The checked-in `.keras` files are placeholders for trained artifacts generated from the notebooks.
