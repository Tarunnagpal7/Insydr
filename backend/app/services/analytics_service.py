from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy import select, func, and_, extract, case
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.conversation import Conversation
from app.db.models.message import Message
from app.db.models.agent import Agent
from app.db.models.usage_metric import UsageMetric


class AnalyticsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_dashboard_stats(
        self, 
        workspace_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        agent_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Get aggregated dashboard statistics."""
        
        # Default date range: last 30 days
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
            
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Build base filters
        conv_filters = [
            Conversation.workspace_id == workspace_id,
            Conversation.created_at >= start_datetime,
            Conversation.created_at <= end_datetime
        ]
        msg_filters = [
            Message.workspace_id == workspace_id,
            Message.created_at >= start_datetime,
            Message.created_at <= end_datetime
        ]
        
        if agent_id:
            conv_filters.append(Conversation.agent_id == agent_id)
        
        # Total Conversations
        total_convs_query = select(func.count(Conversation.id)).where(and_(*conv_filters))
        total_convs_result = await self.session.execute(total_convs_query)
        total_conversations = total_convs_result.scalar() or 0
        
        # Total Messages
        total_msgs_query = select(func.count(Message.id)).where(and_(*msg_filters))
        total_msgs_result = await self.session.execute(total_msgs_query)
        total_messages = total_msgs_result.scalar() or 0
        
        # Average Response Time
        avg_response_query = select(func.avg(Message.response_time_ms)).where(
            and_(
                *msg_filters,
                Message.role == 'assistant',
                Message.response_time_ms.isnot(None)
            )
        )
        avg_response_result = await self.session.execute(avg_response_query)
        avg_response_time = avg_response_result.scalar() or 0
        
        # Average Confidence Score
        avg_conf_query = select(func.avg(Message.confidence_score)).where(
            and_(
                *msg_filters,
                Message.role == 'assistant',
                Message.confidence_score.isnot(None)
            )
        )
        avg_conf_result = await self.session.execute(avg_conf_query)
        avg_confidence = avg_conf_result.scalar() or 0
        
        # Active Agents Count
        agents_query = select(func.count(Agent.id)).where(
            and_(
                Agent.workspace_id == workspace_id,
                Agent.status == 'active'
            )
        )
        agents_result = await self.session.execute(agents_query)
        active_agents = agents_result.scalar() or 0
        
        # Total Token Usage
        total_tokens_query = select(func.sum(Message.token_count)).where(
            and_(*msg_filters, Message.token_count.isnot(None))
        )
        total_tokens_result = await self.session.execute(total_tokens_query)
        total_tokens = total_tokens_result.scalar() or 0
        
        # Previous period comparison (for growth calculation)
        prev_start = start_date - (end_date - start_date)
        prev_end = start_date - timedelta(days=1)
        prev_start_dt = datetime.combine(prev_start, datetime.min.time())
        prev_end_dt = datetime.combine(prev_end, datetime.max.time())
        
        prev_conv_query = select(func.count(Conversation.id)).where(
            and_(
                Conversation.workspace_id == workspace_id,
                Conversation.created_at >= prev_start_dt,
                Conversation.created_at <= prev_end_dt
            )
        )
        prev_conv_result = await self.session.execute(prev_conv_query)
        prev_conversations = prev_conv_result.scalar() or 0
        
        # Calculate growth percentage
        if prev_conversations > 0:
            growth = ((total_conversations - prev_conversations) / prev_conversations) * 100
        else:
            growth = 100 if total_conversations > 0 else 0
        
        return {
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "avg_response_time_ms": round(avg_response_time, 2) if avg_response_time else 0,
            "avg_confidence_score": round(avg_confidence * 100, 1) if avg_confidence else 0,
            "active_agents": active_agents,
            "total_tokens": total_tokens,
            "conversation_growth": round(growth, 1),
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            }
        }

    async def get_conversations_over_time(
        self,
        workspace_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        agent_id: Optional[UUID] = None,
        granularity: str = "day"  # day, week, month
    ) -> List[Dict[str, Any]]:
        """Get conversation counts grouped by time period."""
        
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
            
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        filters = [
            Conversation.workspace_id == workspace_id,
            Conversation.created_at >= start_datetime,
            Conversation.created_at <= end_datetime
        ]
        
        if agent_id:
            filters.append(Conversation.agent_id == agent_id)
        
        # Group by date
        if granularity == "day":
            date_trunc = func.date(Conversation.created_at)
        elif granularity == "week":
            date_trunc = func.date_trunc('week', Conversation.created_at)
        else:  # month
            date_trunc = func.date_trunc('month', Conversation.created_at)
        
        query = (
            select(
                date_trunc.label('period'),
                func.count(Conversation.id).label('count')
            )
            .where(and_(*filters))
            .group_by(date_trunc)
            .order_by(date_trunc)
        )
        
        result = await self.session.execute(query)
        rows = result.fetchall()
        
        return [
            {
                "date": row.period.isoformat() if hasattr(row.period, 'isoformat') else str(row.period),
                "conversations": row.count
            }
            for row in rows
        ]

    async def get_messages_over_time(
        self,
        workspace_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        agent_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        """Get message counts grouped by day."""
        
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
            
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        filters = [
            Message.workspace_id == workspace_id,
            Message.created_at >= start_datetime,
            Message.created_at <= end_datetime
        ]
        
        date_col = func.date(Message.created_at)
        
        query = (
            select(
                date_col.label('period'),
                func.count(Message.id).label('total'),
                func.sum(
                    case(
                        (Message.role == 'user', 1),
                        else_=0
                    )
                ).label('user_messages'),
                func.sum(
                    case(
                        (Message.role == 'assistant', 1),
                        else_=0
                    )
                ).label('bot_messages')
            )
            .where(and_(*filters))
            .group_by(date_col)
            .order_by(date_col)
        )
        
        result = await self.session.execute(query)
        rows = result.fetchall()
        
        return [
            {
                "date": row.period.isoformat() if hasattr(row.period, 'isoformat') else str(row.period),
                "total": row.total,
                "user_messages": row.user_messages or 0,
                "bot_messages": row.bot_messages or 0
            }
            for row in rows
        ]

    async def get_agent_performance(
        self,
        workspace_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        """Get performance metrics per agent."""
        
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
            
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Get all agents
        agents_query = select(Agent).where(Agent.workspace_id == workspace_id)
        agents_result = await self.session.execute(agents_query)
        agents = agents_result.scalars().all()
        
        performance_data = []
        
        for agent in agents:
            # Conversations for this agent
            conv_query = select(func.count(Conversation.id)).where(
                and_(
                    Conversation.agent_id == agent.id,
                    Conversation.created_at >= start_datetime,
                    Conversation.created_at <= end_datetime
                )
            )
            conv_result = await self.session.execute(conv_query)
            conv_count = conv_result.scalar() or 0
            
            # Messages for conversations of this agent (via workspace filter)
            msg_query = select(
                func.count(Message.id),
                func.avg(Message.response_time_ms),
                func.avg(Message.confidence_score)
            ).where(
                and_(
                    Message.workspace_id == workspace_id,
                    Message.created_at >= start_datetime,
                    Message.created_at <= end_datetime,
                    Message.role == 'assistant'
                )
            )
            msg_result = await self.session.execute(msg_query)
            msg_data = msg_result.fetchone()
            
            performance_data.append({
                "agent_id": str(agent.id),
                "agent_name": agent.name,
                "status": agent.status,
                "conversations": conv_count,
                "avg_response_time_ms": round(msg_data[1], 2) if msg_data[1] else 0,
                "avg_confidence": round((msg_data[2] or 0) * 100, 1)
            })
        
        return sorted(performance_data, key=lambda x: x['conversations'], reverse=True)

    async def get_hourly_distribution(
        self,
        workspace_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        """Get conversation distribution by hour of day."""
        
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
            
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        query = (
            select(
                extract('hour', Conversation.created_at).label('hour'),
                func.count(Conversation.id).label('count')
            )
            .where(
                and_(
                    Conversation.workspace_id == workspace_id,
                    Conversation.created_at >= start_datetime,
                    Conversation.created_at <= end_datetime
                )
            )
            .group_by(extract('hour', Conversation.created_at))
            .order_by(extract('hour', Conversation.created_at))
        )
        
        result = await self.session.execute(query)
        rows = result.fetchall()
        
        # Fill in all 24 hours
        hourly_data = {int(row.hour): row.count for row in rows}
        
        return [
            {"hour": h, "conversations": hourly_data.get(h, 0)}
            for h in range(24)
        ]

    async def get_top_pages(
        self,
        workspace_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get top pages where conversations are happening."""
        
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
            
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        query = (
            select(
                Conversation.referrer_url,
                Conversation.page_title,
                func.count(Conversation.id).label('count')
            )
            .where(
                and_(
                    Conversation.workspace_id == workspace_id,
                    Conversation.created_at >= start_datetime,
                    Conversation.created_at <= end_datetime,
                    Conversation.referrer_url.isnot(None)
                )
            )
            .group_by(Conversation.referrer_url, Conversation.page_title)
            .order_by(func.count(Conversation.id).desc())
            .limit(limit)
        )
        
        result = await self.session.execute(query)
        rows = result.fetchall()
        
        return [
            {
                "url": row.referrer_url,
                "title": row.page_title or "Unknown",
                "conversations": row.count
            }
            for row in rows
        ]

    async def get_response_time_distribution(
        self,
        workspace_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Get response time distribution buckets."""
        
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
            
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Define buckets: <1s, 1-2s, 2-3s, 3-5s, >5s
        buckets = [
            {"label": "<1s", "min": 0, "max": 1000},
            {"label": "1-2s", "min": 1000, "max": 2000},
            {"label": "2-3s", "min": 2000, "max": 3000},
            {"label": "3-5s", "min": 3000, "max": 5000},
            {"label": ">5s", "min": 5000, "max": float('inf')},
        ]
        
        distribution = []
        
        for bucket in buckets:
            query = select(func.count(Message.id)).where(
                and_(
                    Message.workspace_id == workspace_id,
                    Message.created_at >= start_datetime,
                    Message.created_at <= end_datetime,
                    Message.role == 'assistant',
                    Message.response_time_ms >= bucket["min"],
                    Message.response_time_ms < bucket["max"] if bucket["max"] != float('inf') else True
                )
            )
            result = await self.session.execute(query)
            count = result.scalar() or 0
            distribution.append({
                "label": bucket["label"],
                "count": count
            })
        
        return {"distribution": distribution}
