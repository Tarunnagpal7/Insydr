from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from app.api import deps
from app.services.analytics_service import AnalyticsService
from app.db.models.user import User
from pydantic import BaseModel
from typing import List, Dict, Any


router = APIRouter()


# Response schemas
class DateRange(BaseModel):
    start: str
    end: str


class DashboardStatsResponse(BaseModel):
    total_conversations: int
    total_messages: int
    avg_response_time_ms: float
    avg_confidence_score: float
    active_agents: int
    total_tokens: int
    conversation_growth: float
    date_range: DateRange


class TimeSeriesPoint(BaseModel):
    date: str
    conversations: int


class MessageTimeSeriesPoint(BaseModel):
    date: str
    total: int
    user_messages: int
    bot_messages: int


class AgentPerformance(BaseModel):
    agent_id: str
    agent_name: str
    status: str
    conversations: int
    avg_response_time_ms: float
    avg_confidence: float


class HourlyPoint(BaseModel):
    hour: int
    conversations: int


class TopPage(BaseModel):
    url: str
    title: str
    conversations: int


class ResponseTimeBucket(BaseModel):
    label: str
    count: int


class ResponseTimeDistribution(BaseModel):
    distribution: List[ResponseTimeBucket]


# Helper to get analytics service
async def get_analytics_service(db=Depends(deps.get_db)) -> AnalyticsService:
    return AnalyticsService(db)


@router.get("/dashboard", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    workspace_id: UUID,
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    agent_id: Optional[UUID] = Query(None, description="Filter by agent"),
    current_user: User = Depends(deps.get_current_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    """
    Get aggregated dashboard statistics for a workspace.
    Returns total conversations, messages, response times, and growth metrics.
    """
    return await service.get_dashboard_stats(
        workspace_id=workspace_id,
        start_date=start_date,
        end_date=end_date,
        agent_id=agent_id
    )


@router.get("/conversations-over-time", response_model=List[TimeSeriesPoint])
async def get_conversations_over_time(
    workspace_id: UUID,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    agent_id: Optional[UUID] = Query(None),
    granularity: str = Query("day", pattern="^(day|week|month)$"),
    current_user: User = Depends(deps.get_current_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    """
    Get conversation counts over time.
    Supports day, week, or month granularity.
    """
    return await service.get_conversations_over_time(
        workspace_id=workspace_id,
        start_date=start_date,
        end_date=end_date,
        agent_id=agent_id,
        granularity=granularity
    )


@router.get("/messages-over-time", response_model=List[MessageTimeSeriesPoint])
async def get_messages_over_time(
    workspace_id: UUID,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    agent_id: Optional[UUID] = Query(None),
    current_user: User = Depends(deps.get_current_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    """
    Get message counts over time, split by user and bot messages.
    """
    return await service.get_messages_over_time(
        workspace_id=workspace_id,
        start_date=start_date,
        end_date=end_date,
        agent_id=agent_id
    )


@router.get("/agent-performance", response_model=List[AgentPerformance])
async def get_agent_performance(
    workspace_id: UUID,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(deps.get_current_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    """
    Get performance metrics for each agent in the workspace.
    """
    return await service.get_agent_performance(
        workspace_id=workspace_id,
        start_date=start_date,
        end_date=end_date
    )


@router.get("/hourly-distribution", response_model=List[HourlyPoint])
async def get_hourly_distribution(
    workspace_id: UUID,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(deps.get_current_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    """
    Get conversation distribution by hour of day (0-23).
    Useful for understanding peak usage times.
    """
    return await service.get_hourly_distribution(
        workspace_id=workspace_id,
        start_date=start_date,
        end_date=end_date
    )


@router.get("/top-pages", response_model=List[TopPage])
async def get_top_pages(
    workspace_id: UUID,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(deps.get_current_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    """
    Get top pages where conversations are initiated.
    """
    return await service.get_top_pages(
        workspace_id=workspace_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit
    )


@router.get("/response-time-distribution", response_model=ResponseTimeDistribution)
async def get_response_time_distribution(
    workspace_id: UUID,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(deps.get_current_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    """
    Get response time distribution in buckets.
    """
    return await service.get_response_time_distribution(
        workspace_id=workspace_id,
        start_date=start_date,
        end_date=end_date
    )
