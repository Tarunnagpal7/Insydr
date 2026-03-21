from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy import select, func, and_, extract, case, distinct, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.conversation import Conversation
from app.db.models.message import Message
from app.db.models.agent import Agent
from app.db.models.usage_metric import UsageMetric
from app.db.models.analytics_event import AnalyticsEvent
from app.db.models.document import Document
from app.db.models.document_chunk import DocumentChunk


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

    async def get_unanswered_questions(
        self,
        workspace_id: UUID,
        limit: int = 50,
        status: str = "unresolved",
    ) -> List[Dict[str, Any]]:
        from app.db.models.unanswered_question import UnansweredQuestion
        
        query = (
            select(UnansweredQuestion)
            .where(
                and_(
                    UnansweredQuestion.workspace_id == workspace_id,
                    UnansweredQuestion.status == status
                )
            )
            .order_by(UnansweredQuestion.occurrence_count.desc())
            .limit(limit)
        )
        
        result = await self.session.execute(query)
        questions = result.scalars().all()
        
        return [
            {
                "id": str(q.id),
                "question": q.question,
                "occurrence_count": q.occurrence_count,
                "first_seen_at": q.first_seen_at.isoformat(),
                "last_seen_at": q.last_seen_at.isoformat(),
            }
            for q in questions
        ]

    async def analyze_knowledge_gaps(self, questions: List[Dict[str, Any]]) -> str:
        """Use LLM to identify patterns and suggest new content."""
        if not questions:
            return "No unanswered questions found to analyze."
            
        questions_text = "\n".join([f"- {q['question']} (asked {q['occurrence_count']} times)" for q in questions])
        
        prompt = f"""
        You are an expert knowledge base manager and support architect.
        Below is a list of questions from users that the current AI agent failed to answer due to missing knowledge.
        
        UNANSWERED QUESTIONS:
        {questions_text}
        
        Your task:
        1. Identify the top 2-3 common themes or patterns in what users are asking.
        2. Provide 3-5 specific "Recommended FAQ Questions" with suggested brief answers that the human admin should add to their knowledge base to solve these gaps.
        
        Format the output nicely using Markdown. Be concise, actionable, and professional.
        """
        
        try:
            from app.services.llm_service import LLMService
            llm = LLMService()
            response = await llm.generate(prompt, temperature=0.3)
            return response.strip()
        except Exception as e:
            print(f"Failed to analyze knowledge gaps: {e}")
            return "Analysis failed due to an error connecting to the AI service."

    # ═══════════════════════════════════════════
    # NEW: Feedback Analytics
    # ═══════════════════════════════════════════

    async def get_feedback_stats(
        self,
        workspace_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """Get thumbs up/down ratio and satisfaction score."""
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())

        base_filters = [
            AnalyticsEvent.workspace_id == workspace_id,
            AnalyticsEvent.created_at >= start_dt,
            AnalyticsEvent.created_at <= end_dt,
        ]

        up_query = select(func.count(AnalyticsEvent.id)).where(
            and_(*base_filters, AnalyticsEvent.event_type == "feedback_thumbs_up")
        )
        down_query = select(func.count(AnalyticsEvent.id)).where(
            and_(*base_filters, AnalyticsEvent.event_type == "feedback_thumbs_down")
        )

        up_result = await self.session.execute(up_query)
        down_result = await self.session.execute(down_query)
        thumbs_up = up_result.scalar() or 0
        thumbs_down = down_result.scalar() or 0
        total_feedback = thumbs_up + thumbs_down
        satisfaction = round((thumbs_up / total_feedback) * 100, 1) if total_feedback > 0 else 0

        return {
            "thumbs_up": thumbs_up,
            "thumbs_down": thumbs_down,
            "total_feedback": total_feedback,
            "satisfaction_score": satisfaction,
        }

    async def get_feedback_over_time(
        self,
        workspace_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """Get feedback trends over time."""
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())

        date_col = func.date(AnalyticsEvent.created_at)
        query = (
            select(
                date_col.label("period"),
                func.sum(case((AnalyticsEvent.event_type == "feedback_thumbs_up", 1), else_=0)).label("thumbs_up"),
                func.sum(case((AnalyticsEvent.event_type == "feedback_thumbs_down", 1), else_=0)).label("thumbs_down"),
            )
            .where(
                and_(
                    AnalyticsEvent.workspace_id == workspace_id,
                    AnalyticsEvent.created_at >= start_dt,
                    AnalyticsEvent.created_at <= end_dt,
                    AnalyticsEvent.event_type.in_(["feedback_thumbs_up", "feedback_thumbs_down"]),
                )
            )
            .group_by(date_col)
            .order_by(date_col)
        )
        result = await self.session.execute(query)
        rows = result.fetchall()
        return [
            {
                "date": row.period.isoformat() if hasattr(row.period, "isoformat") else str(row.period),
                "thumbs_up": row.thumbs_up or 0,
                "thumbs_down": row.thumbs_down or 0,
            }
            for row in rows
        ]

    # ═══════════════════════════════════════════
    # NEW: Conversation Insights
    # ═══════════════════════════════════════════

    async def get_conversation_insights(
        self,
        workspace_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """Get avg duration, avg messages/conversation, abandonment rate."""
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())

        conv_filters = [
            Conversation.workspace_id == workspace_id,
            Conversation.created_at >= start_dt,
            Conversation.created_at <= end_dt,
        ]

        # Total conversations
        total_q = select(func.count(Conversation.id)).where(and_(*conv_filters))
        total_r = await self.session.execute(total_q)
        total_conversations = total_r.scalar() or 0

        # Messages per conversation
        msg_per_conv_q = (
            select(
                Message.conversation_id,
                func.count(Message.id).label("msg_count"),
            )
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                and_(
                    Message.workspace_id == workspace_id,
                    Conversation.created_at >= start_dt,
                    Conversation.created_at <= end_dt,
                )
            )
            .group_by(Message.conversation_id)
        )
        msg_per_conv_r = await self.session.execute(msg_per_conv_q)
        msg_counts = [row.msg_count for row in msg_per_conv_r.fetchall()]
        avg_msgs = round(sum(msg_counts) / len(msg_counts), 1) if msg_counts else 0

        # Abandoned conversations (only 1 message = user didn't continue)
        abandoned = sum(1 for c in msg_counts if c <= 1)
        abandonment_rate = round((abandoned / len(msg_counts)) * 100, 1) if msg_counts else 0

        # Avg conversation duration (first msg to last msg)
        duration_q = (
            select(
                Message.conversation_id,
                func.min(Message.created_at).label("first_msg"),
                func.max(Message.created_at).label("last_msg"),
            )
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                and_(
                    Message.workspace_id == workspace_id,
                    Conversation.created_at >= start_dt,
                    Conversation.created_at <= end_dt,
                )
            )
            .group_by(Message.conversation_id)
            .having(func.count(Message.id) > 1)
        )
        duration_r = await self.session.execute(duration_q)
        durations = []
        for row in duration_r.fetchall():
            diff = (row.last_msg - row.first_msg).total_seconds()
            durations.append(diff)
        avg_duration_seconds = round(sum(durations) / len(durations), 1) if durations else 0

        # Time to first response (avg time between user msg and bot msg)
        first_response_q = select(func.avg(Message.response_time_ms)).where(
            and_(
                Message.workspace_id == workspace_id,
                Message.role == "assistant",
                Message.response_time_ms.isnot(None),
                Message.created_at >= start_dt,
                Message.created_at <= end_dt,
            )
        )
        first_response_r = await self.session.execute(first_response_q)
        avg_first_response_ms = first_response_r.scalar() or 0

        return {
            "total_conversations": total_conversations,
            "avg_messages_per_conversation": avg_msgs,
            "abandonment_rate": abandonment_rate,
            "avg_duration_seconds": avg_duration_seconds,
            "avg_first_response_ms": round(avg_first_response_ms, 1) if avg_first_response_ms else 0,
        }

    # ═══════════════════════════════════════════
    # NEW: Day-of-Week Distribution
    # ═══════════════════════════════════════════

    async def get_day_of_week_distribution(
        self,
        workspace_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """Get conversation distribution by day of week (0=Sunday)."""
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())

        query = (
            select(
                extract("dow", Conversation.created_at).label("day_of_week"),
                func.count(Conversation.id).label("count"),
            )
            .where(
                and_(
                    Conversation.workspace_id == workspace_id,
                    Conversation.created_at >= start_dt,
                    Conversation.created_at <= end_dt,
                )
            )
            .group_by(extract("dow", Conversation.created_at))
            .order_by(extract("dow", Conversation.created_at))
        )
        result = await self.session.execute(query)
        rows = result.fetchall()

        day_names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        day_data = {int(row.day_of_week): row.count for row in rows}

        return [
            {"day": day_names[i], "day_index": i, "conversations": day_data.get(i, 0)}
            for i in range(7)
        ]

    # ═══════════════════════════════════════════
    # NEW: Top Asked Questions
    # ═══════════════════════════════════════════

    async def get_top_questions(
        self,
        workspace_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """Get most frequently asked user messages."""
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())

        # Group similar questions by exact text
        query = (
            select(
                Message.content,
                func.count(Message.id).label("frequency"),
                func.max(Message.created_at).label("last_asked"),
            )
            .where(
                and_(
                    Message.workspace_id == workspace_id,
                    Message.role == "user",
                    Message.created_at >= start_dt,
                    Message.created_at <= end_dt,
                    func.length(Message.content) > 5,  # Skip very short messages
                )
            )
            .group_by(Message.content)
            .order_by(func.count(Message.id).desc())
            .limit(limit)
        )
        result = await self.session.execute(query)
        rows = result.fetchall()

        return [
            {
                "question": row.content[:200],  # Truncate long messages
                "frequency": row.frequency,
                "last_asked": row.last_asked.isoformat(),
            }
            for row in rows
        ]

    # ═══════════════════════════════════════════
    # NEW: User Behavior Insights
    # ═══════════════════════════════════════════

    async def get_user_behavior(
        self,
        workspace_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """Get new vs returning visitors, engagement metrics."""
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())

        conv_filters = [
            Conversation.workspace_id == workspace_id,
            Conversation.created_at >= start_dt,
            Conversation.created_at <= end_dt,
        ]

        # Count unique IPs in this period
        total_visitors_q = select(func.count(distinct(Conversation.user_ip))).where(
            and_(*conv_filters, Conversation.user_ip.isnot(None))
        )
        total_visitors_r = await self.session.execute(total_visitors_q)
        total_unique_visitors = total_visitors_r.scalar() or 0

        # IPs that appeared before the start_date (returning)
        returning_q = (
            select(func.count(distinct(Conversation.user_ip)))
            .where(
                and_(
                    *conv_filters,
                    Conversation.user_ip.isnot(None),
                    Conversation.user_ip.in_(
                        select(distinct(Conversation.user_ip)).where(
                            and_(
                                Conversation.workspace_id == workspace_id,
                                Conversation.created_at < start_dt,
                                Conversation.user_ip.isnot(None),
                            )
                        )
                    ),
                )
            )
        )
        returning_r = await self.session.execute(returning_q)
        returning_visitors = returning_r.scalar() or 0
        new_visitors = max(0, total_unique_visitors - returning_visitors)

        # Total conversations
        total_conv_q = select(func.count(Conversation.id)).where(and_(*conv_filters))
        total_conv_r = await self.session.execute(total_conv_q)
        total_conversations = total_conv_r.scalar() or 0

        # Conversations per visitor
        convs_per_visitor = round(total_conversations / total_unique_visitors, 1) if total_unique_visitors > 0 else 0

        return {
            "total_unique_visitors": total_unique_visitors,
            "new_visitors": new_visitors,
            "returning_visitors": returning_visitors,
            "new_visitor_ratio": round((new_visitors / total_unique_visitors) * 100, 1) if total_unique_visitors > 0 else 0,
            "conversations_per_visitor": convs_per_visitor,
            "total_conversations": total_conversations,
        }

    # ═══════════════════════════════════════════
    # NEW: Source & Knowledge Analytics
    # ═══════════════════════════════════════════

    async def get_knowledge_base_stats(
        self,
        workspace_id: UUID,
    ) -> Dict[str, Any]:
        """Get knowledge base overview stats."""
        # Total documents
        doc_q = select(func.count(Document.id)).where(Document.workspace_id == workspace_id)
        doc_r = await self.session.execute(doc_q)
        total_docs = doc_r.scalar() or 0

        # Total chunks
        chunk_q = select(func.count(DocumentChunk.id)).where(DocumentChunk.workspace_id == workspace_id)
        chunk_r = await self.session.execute(chunk_q)
        total_chunks = chunk_r.scalar() or 0

        # Documents by source type
        type_q = (
            select(Document.source_type, func.count(Document.id).label("count"))
            .where(Document.workspace_id == workspace_id)
            .group_by(Document.source_type)
        )
        type_r = await self.session.execute(type_q)
        by_type = {row.source_type: row.count for row in type_r.fetchall()}

        # Documents by status
        status_q = (
            select(Document.status, func.count(Document.id).label("count"))
            .where(Document.workspace_id == workspace_id)
            .group_by(Document.status)
        )
        status_r = await self.session.execute(status_q)
        by_status = {row.status: row.count for row in status_r.fetchall()}

        return {
            "total_documents": total_docs,
            "total_chunks": total_chunks,
            "documents_by_type": by_type,
            "documents_by_status": by_status,
        }

    # ═══════════════════════════════════════════
    # NEW: CSV Export
    # ═══════════════════════════════════════════

    async def export_conversations(
        self,
        workspace_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """Export conversations data as list of dicts for CSV."""
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())

        query = (
            select(Conversation)
            .where(
                and_(
                    Conversation.workspace_id == workspace_id,
                    Conversation.created_at >= start_dt,
                    Conversation.created_at <= end_dt,
                )
            )
            .order_by(Conversation.created_at.desc())
        )
        result = await self.session.execute(query)
        conversations = result.scalars().all()

        rows = []
        for c in conversations:
            # Count messages for this conversation
            msg_q = select(func.count(Message.id)).where(Message.conversation_id == c.id)
            msg_r = await self.session.execute(msg_q)
            msg_count = msg_r.scalar() or 0

            rows.append({
                "conversation_id": str(c.id),
                "agent_id": str(c.agent_id),
                "page_url": c.referrer_url or "",
                "page_title": c.page_title or "",
                "hostname": c.hostname or "",
                "language": c.language or "",
                "status": c.status,
                "message_count": msg_count,
                "started_at": c.started_at.isoformat() if c.started_at else "",
                "created_at": c.created_at.isoformat(),
            })
        return rows

    async def export_messages(
        self,
        workspace_id: UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """Export messages data as list of dicts for CSV."""
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())

        query = (
            select(Message)
            .where(
                and_(
                    Message.workspace_id == workspace_id,
                    Message.created_at >= start_dt,
                    Message.created_at <= end_dt,
                )
            )
            .order_by(Message.created_at.desc())
            .limit(5000)
        )
        result = await self.session.execute(query)
        messages = result.scalars().all()

        return [
            {
                "message_id": str(m.id),
                "conversation_id": str(m.conversation_id),
                "role": m.role,
                "content": m.content[:500],
                "confidence_score": m.confidence_score or "",
                "response_time_ms": m.response_time_ms or "",
                "token_count": m.token_count or "",
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]

