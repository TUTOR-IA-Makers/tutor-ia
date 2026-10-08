"""Liveness and configuration inspection."""

import httpx
from fastapi import APIRouter, Query

from codeexpert import __version__
from codeexpert.api.deps import SettingsDep
from codeexpert.api.schemas import ConfigResponse, HealthResponse
from codeexpert.settings import reset_settings_cache

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health(settings: SettingsDep) -> HealthResponse:
    """Cheap liveness probe. Touches nothing external — safe for a load balancer."""
    return HealthResponse(version=__version__, commit=settings.commit_sha)


@router.get("/config", response_model=ConfigResponse)
async def read_config(
    settings: SettingsDep,
    verify: bool = Query(
        default=False,
        description="Also call the provider to confirm the key works. Costs a round trip.",
    ),
) -> ConfigResponse:
    """Report the effective configuration, never the key itself."""
    reset_settings_cache()

    reachable: bool | None = None
    status = "Configuration loaded."
    if not settings.llm_api_key:
        status = "CODEEXPERT_LLM_API_KEY is not set — generation endpoints will fail."
    elif verify:
        try:
            response = httpx.get(
                f"{settings.llm_base_url.rstrip('/')}/models",
                headers={"Authorization": f"Bearer {settings.require_api_key()}"},
                timeout=settings.llm_timeout_seconds,
            )
            reachable = response.status_code == httpx.codes.OK
            status = (
                "Configuration loaded and provider reachable."
                if reachable
                else f"Provider answered HTTP {response.status_code}."
            )
        except httpx.RequestError as exc:
            reachable = False
            status = f"Provider unreachable: {exc}"

    return ConfigResponse(
        model=settings.llm_model,
        api_base_url=settings.llm_base_url,
        api_key_configured=settings.llm_api_key is not None,
        workspace_root=str(settings.workspace_root),
        provider_reachable=reachable,
        status=status,
    )
