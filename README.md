# FreshGuard AI

FreshGuard AI combines a Next.js warehouse interface with a FastAPI inspection and order-lifecycle API backed by MongoDB.

## Run locally

1. Start MongoDB, then configure the backend from [the backend README](./FreshGuard-AI/backend/README.md). Seed a warehouse and user, then start FastAPI on port `8000`.
2. Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in the frontend environment (see [.env.example](./.env.example)).
3. From the repository root, run:

   ```bash
   npm run dev
   ```

4. Sign in using a seeded warehouse user. In the development seed, `WH-MTH-001` has a dispatch manager (`EMP-1001`), quality manager (`EMP-1002`), dispatch manager (`EMP-1003`), rider (`EMP-1004`), and administrator (`EMP-1005`); the demo password is `demo123`. `EMP-1001` is limited to order visibility and delivery/dispatch operations, and cannot inspect produce, pack orders, or manage inventory.

Inspection, inspection history, dashboard metrics, inventory, and the order-to-delivery workspace use the authenticated backend and surface request errors. Orders, packing, riders, dispatches, transit readings, alerts, analytics, report summaries, and temperature limits are loaded from or saved to MongoDB through FastAPI. The `/track` customer portal uses the private order tracking token and only exposes the backend's limited customer projection.

## Implemented backend workflow

The API persists orders, linked inspections, quality overrides, rule-based packing recommendations and checks, riders, dispatches, delivery updates, temperature readings, rule-derived transit risk, alerts, and customer tracking/feedback. Customer feedback is accepted only once after delivery. See the backend guide for endpoints, authorization, thresholds, required provider tokens, and current integration boundaries.

The telemetry page includes an operator-controlled, visibly labeled `DEMO` simulation. It persists generated samples and rule-triggered events through the API, but its plotted coordinates are fictional and are not live GPS or a street map. Physical device and GPS-provider integration still require hardware/provider configuration and a trusted `TELEMETRY_DEVICE_TOKEN`. The produce decision thresholds remain governed by the trained classifier and backend configuration; temperature settings do not alter model classifications.

## Validation

```bash
npm run build
cd FreshGuard-AI/backend
python -m pytest -q
```
