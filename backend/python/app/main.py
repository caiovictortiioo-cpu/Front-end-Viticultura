from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
import logging
from typing import AsyncIterator

import httpx
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.staticfiles import StaticFiles
from swagger_ui_bundle import swagger_ui_path

from app.api.routes import router
from app.config import Settings
from app.errors import (
    ServiceError,
    http_error_handler,
    service_error_handler,
    unhandled_error_handler,
    validation_error_handler,
)
from app.services.dashboard import DashboardService

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("agroclima.api")


def create_app(settings: Settings | None = None, *, start_poller: bool = True) -> FastAPI:
    app_settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.settings = app_settings
        app.state.http_client = httpx.AsyncClient(timeout=app_settings.request_timeout_seconds)
        app.state.last_sync = None
        app.state.last_sync_error = None
        poller: asyncio.Task | None = None
        if start_poller and app_settings.enable_background_sync and app_settings.thingspeak_configured:
            poller = asyncio.create_task(_poll_thingspeak(app), name="thingspeak-sync")
        try:
            yield
        finally:
            if poller:
                poller.cancel()
                try:
                    await poller
                except asyncio.CancelledError:
                    pass
            await app.state.http_client.aclose()

    application = FastAPI(
        title=app_settings.service_name,
        description=(
            "API analítica para leituras ThingSpeak, métricas climáticas e dashboards. "
            "A autenticação e o escopo de dados são validados pela API Java."
        ),
        version="1.0.0",
        root_path=app_settings.root_path,
        docs_url=None,
        redoc_url=None,
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )
    application.state.settings = app_settings
    application.mount(
        "/static/swagger-ui",
        StaticFiles(directory=str(swagger_ui_path)),
        name="swagger-ui-assets",
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.configured_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept"],
    )
    application.include_router(router)
    application.add_exception_handler(ServiceError, service_error_handler)
    application.add_exception_handler(RequestValidationError, validation_error_handler)
    application.add_exception_handler(400, http_error_handler)
    application.add_exception_handler(401, http_error_handler)
    application.add_exception_handler(403, http_error_handler)
    application.add_exception_handler(404, http_error_handler)
    application.add_exception_handler(405, http_error_handler)
    application.add_exception_handler(422, http_error_handler)
    application.add_exception_handler(500, http_error_handler)
    application.add_exception_handler(Exception, unhandled_error_handler)

    @application.get("/docs", include_in_schema=False, tags=["Operação"])
    async def local_swagger_ui(request: Request):
        root_path = request.scope.get("root_path", "").rstrip("/")
        local_asset = lambda path: f"{root_path}{path}"
        return get_swagger_ui_html(
            openapi_url=local_asset(application.openapi_url),
            title=f"{application.title} - Swagger UI",
            swagger_js_url=local_asset("/static/swagger-ui/swagger-ui-bundle.js"),
            swagger_css_url=local_asset("/static/swagger-ui/swagger-ui.css"),
            swagger_favicon_url=local_asset("/static/swagger-ui/favicon-32x32.png"),
        )

    @application.get("/health", tags=["Operação"])
    async def health(request: Request):
        settings: Settings = request.app.state.settings
        return {
            "status": "UP",
            "service": settings.service_name,
            "thingspeakConfigured": settings.thingspeak_configured,
            "javaApiConfigured": bool(settings.java_api_url),
            "lastSync": request.app.state.last_sync,
            "lastSyncError": request.app.state.last_sync_error,
        }

    return application


async def _poll_thingspeak(app: FastAPI) -> None:
    settings: Settings = app.state.settings
    while True:
        try:
            result = await DashboardService(settings, app.state.http_client).sync_latest()
            app.state.last_sync = result.synchronized_at
            app.state.last_sync_error = None
            logger.info(
                "ThingSpeak sync received=%d normalized=%d inserted=%d rejected=%d",
                result.received, result.normalized, result.inserted, result.rejected,
            )
        except ServiceError as exception:
            app.state.last_sync_error = exception.status_code
            logger.warning("ThingSpeak sync unavailable status=%d", exception.status_code)
        except Exception as exception:
            app.state.last_sync_error = 500
            logger.error("ThingSpeak sync failed type=%s", type(exception).__name__)
        await asyncio.sleep(settings.thingspeak_poll_interval_seconds)


app = create_app()
