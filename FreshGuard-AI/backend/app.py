from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from routes.auth import router as auth_router
from routes.analytics import router as analytics_router
from routes.inspections import router as inspections_router
from routes.inventory import router as inventory_router
from routes.notifications import router as notifications_router
from routes.reports import router as reports_router
from routes.users import router as users_router
from routes.warehouse import router as warehouse_router
from routes.health import router as health_router
from services.model_manager import model_manager

app = FastAPI(title='FreshGuard AI API', version='1.0.0')
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_url], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
app.include_router(auth_router)
app.include_router(inspections_router)
app.include_router(analytics_router)
app.include_router(inventory_router)
app.include_router(notifications_router)
app.include_router(reports_router)
app.include_router(users_router)
app.include_router(warehouse_router)
app.include_router(health_router)


@app.on_event('startup')
def load_models() -> None:
    model_manager.load()


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
