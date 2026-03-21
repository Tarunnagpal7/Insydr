import apiClient from '@/src/lib/api';

// Types
export interface DateRange {
  start: string;
  end: string;
}

export interface DashboardStats {
  total_conversations: number;
  total_messages: number;
  avg_response_time_ms: number;
  avg_confidence_score: number;
  active_agents: number;
  total_tokens: number;
  conversation_growth: number;
  date_range: DateRange;
}

export interface TimeSeriesPoint {
  date: string;
  conversations: number;
}

export interface MessageTimeSeriesPoint {
  date: string;
  total: number;
  user_messages: number;
  bot_messages: number;
}

export interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  status: string;
  conversations: number;
  avg_response_time_ms: number;
  avg_confidence: number;
}

export interface HourlyPoint {
  hour: number;
  conversations: number;
}

export interface TopPage {
  url: string;
  title: string;
  conversations: number;
}

export interface ResponseTimeBucket {
  label: string;
  count: number;
}

export interface ResponseTimeDistribution {
  distribution: ResponseTimeBucket[];
}

export interface UnansweredQuestion {
  id: string;
  question: string;
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
}

export interface GapAnalysis {
  analysis: string;
}

// API Query Params
export interface AnalyticsQueryParams {
  workspace_id: string;
  start_date?: string;
  end_date?: string;
  agent_id?: string;
}

// API Functions
export const getDashboardStats = async (params: AnalyticsQueryParams): Promise<DashboardStats> => {
  const response = await apiClient.get<DashboardStats>('/analytics/dashboard', { params });
  return response.data;
};

export const getConversationsOverTime = async (
  params: AnalyticsQueryParams & { granularity?: 'day' | 'week' | 'month' }
): Promise<TimeSeriesPoint[]> => {
  const response = await apiClient.get<TimeSeriesPoint[]>('/analytics/conversations-over-time', { params });
  return response.data;
};

export const getMessagesOverTime = async (params: AnalyticsQueryParams): Promise<MessageTimeSeriesPoint[]> => {
  const response = await apiClient.get<MessageTimeSeriesPoint[]>('/analytics/messages-over-time', { params });
  return response.data;
};

export const getAgentPerformance = async (params: AnalyticsQueryParams): Promise<AgentPerformance[]> => {
  const response = await apiClient.get<AgentPerformance[]>('/analytics/agent-performance', { params });
  return response.data;
};

export const getHourlyDistribution = async (params: AnalyticsQueryParams): Promise<HourlyPoint[]> => {
  const response = await apiClient.get<HourlyPoint[]>('/analytics/hourly-distribution', { params });
  return response.data;
};

export const getTopPages = async (
  params: AnalyticsQueryParams & { limit?: number }
): Promise<TopPage[]> => {
  const response = await apiClient.get<TopPage[]>('/analytics/top-pages', { params });
  return response.data;
};

export const getResponseTimeDistribution = async (
  params: AnalyticsQueryParams
): Promise<ResponseTimeDistribution> => {
  const response = await apiClient.get<ResponseTimeDistribution>('/analytics/response-time-distribution', { params });
  return response.data;
};

export const getKnowledgeGaps = async (
  params: AnalyticsQueryParams & { limit?: number; status?: string }
): Promise<UnansweredQuestion[]> => {
  const response = await apiClient.get<UnansweredQuestion[]>('/analytics/knowledge-gaps', { params });
  return response.data;
};

export const analyzeKnowledgeGaps = async (
  params: AnalyticsQueryParams & { limit?: number }
): Promise<GapAnalysis> => {
  const response = await apiClient.post<GapAnalysis>('/analytics/knowledge-gaps/analyze', null, { params });
  return response.data;
};

// ═══════════════════════════════════════════
// NEW Types
// ═══════════════════════════════════════════

export interface FeedbackStats {
  thumbs_up: number;
  thumbs_down: number;
  total_feedback: number;
  satisfaction_score: number;
}

export interface FeedbackOverTimePoint {
  date: string;
  thumbs_up: number;
  thumbs_down: number;
}

export interface ConversationInsights {
  total_conversations: number;
  avg_messages_per_conversation: number;
  abandonment_rate: number;
  avg_duration_seconds: number;
  avg_first_response_ms: number;
}

export interface DayOfWeekPoint {
  day: string;
  day_index: number;
  conversations: number;
}

export interface TopQuestion {
  question: string;
  frequency: number;
  last_asked: string;
}

export interface UserBehavior {
  total_unique_visitors: number;
  new_visitors: number;
  returning_visitors: number;
  new_visitor_ratio: number;
  conversations_per_visitor: number;
  total_conversations: number;
}

export interface KnowledgeBaseStats {
  total_documents: number;
  total_chunks: number;
  documents_by_type: Record<string, number>;
  documents_by_status: Record<string, number>;
}

// ═══════════════════════════════════════════
// NEW API Functions
// ═══════════════════════════════════════════

export const getFeedbackStats = async (params: AnalyticsQueryParams): Promise<FeedbackStats> => {
  const response = await apiClient.get<FeedbackStats>('/analytics/feedback-stats', { params });
  return response.data;
};

export const getFeedbackOverTime = async (params: AnalyticsQueryParams): Promise<FeedbackOverTimePoint[]> => {
  const response = await apiClient.get<FeedbackOverTimePoint[]>('/analytics/feedback-over-time', { params });
  return response.data;
};

export const getConversationInsights = async (params: AnalyticsQueryParams): Promise<ConversationInsights> => {
  const response = await apiClient.get<ConversationInsights>('/analytics/conversation-insights', { params });
  return response.data;
};

export const getDayOfWeekDistribution = async (params: AnalyticsQueryParams): Promise<DayOfWeekPoint[]> => {
  const response = await apiClient.get<DayOfWeekPoint[]>('/analytics/day-of-week', { params });
  return response.data;
};

export const getTopQuestions = async (
  params: AnalyticsQueryParams & { limit?: number }
): Promise<TopQuestion[]> => {
  const response = await apiClient.get<TopQuestion[]>('/analytics/top-questions', { params });
  return response.data;
};

export const getUserBehavior = async (params: AnalyticsQueryParams): Promise<UserBehavior> => {
  const response = await apiClient.get<UserBehavior>('/analytics/user-behavior', { params });
  return response.data;
};

export const getKnowledgeBaseStats = async (params: { workspace_id: string }): Promise<KnowledgeBaseStats> => {
  const response = await apiClient.get<KnowledgeBaseStats>('/analytics/knowledge-base-stats', { params });
  return response.data;
};

export const exportConversationsCSV = (params: AnalyticsQueryParams): string => {
  const searchParams = new URLSearchParams({ ...params, format: 'csv' } as Record<string, string>);
  return `/analytics/export/conversations?${searchParams.toString()}`;
};

export const exportMessagesCSV = (params: AnalyticsQueryParams): string => {
  const searchParams = new URLSearchParams({ ...params, format: 'csv' } as Record<string, string>);
  return `/analytics/export/messages?${searchParams.toString()}`;
};

export const exportKnowledgeGapsCSV = (params: { workspace_id: string }): string => {
  const searchParams = new URLSearchParams({ ...params, format: 'csv' } as Record<string, string>);
  return `/analytics/export/knowledge-gaps?${searchParams.toString()}`;
};

// Helper functions
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getDateRangePreset = (preset: string): { start: Date; end: Date } => {
  const end = new Date();
  let start = new Date();

  switch (preset) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case '12m':
      start.setMonth(end.getMonth() - 12);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  return { start, end };
};

