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
