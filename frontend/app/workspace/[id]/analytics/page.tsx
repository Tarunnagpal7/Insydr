'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart3,
  MessageSquare,
  Users,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  Bot,
  Calendar,
  Filter,
  RefreshCw,
  Activity,
  Globe,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import classNames from 'classnames';
import {
  getDashboardStats,
  getConversationsOverTime,
  getMessagesOverTime,
  getAgentPerformance,
  getHourlyDistribution,
  getTopPages,
  getResponseTimeDistribution,
  formatDateForAPI,
  getDateRangePreset,
  DashboardStats,
  TimeSeriesPoint,
  MessageTimeSeriesPoint,
  AgentPerformance,
  HourlyPoint,
  TopPage,
  ResponseTimeDistribution
} from '@/src/features/analytics/analytics.service';
import { getAgents, Agent } from '@/src/features/agents/agents.service';

// Date range presets
const DATE_PRESETS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last 12 months', value: '12m' },
];

// Stat Card Component
const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = 'red' 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: any; 
  trend?: number; 
  color?: 'red' | 'emerald' | 'blue' | 'purple' | 'amber';
}) => {
  const colorClasses = {
    red: 'from-red-500/20 to-red-900/10 border-red-500/20',
    emerald: 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/20',
    blue: 'from-blue-500/20 to-blue-900/10 border-blue-500/20',
    purple: 'from-purple-500/20 to-purple-900/10 border-purple-500/20',
    amber: 'from-amber-500/20 to-amber-900/10 border-amber-500/20',
  };
  
  const iconColors = {
    red: 'text-red-500',
    emerald: 'text-emerald-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    amber: 'text-amber-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={classNames(
        "bg-gradient-to-br border rounded-2xl p-5 relative overflow-hidden",
        colorClasses[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={classNames("p-3 rounded-xl bg-white/5", iconColors[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={classNames(
          "flex items-center gap-1 mt-3 text-sm",
          trend >= 0 ? "text-emerald-500" : "text-red-500"
        )}>
          {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{Math.abs(trend).toFixed(1)}%</span>
          <span className="text-gray-500 ml-1">vs previous period</span>
        </div>
      )}
    </motion.div>
  );
};

// Simple Bar Chart Component
const BarChartSimple = ({ 
  data, 
  dataKey, 
  color = '#ef4444',
  height = 200 
}: { 
  data: any[]; 
  dataKey: string; 
  color?: string;
  height?: number;
}) => {
  if (!data.length) return <div className="h-full flex items-center justify-center text-gray-500">No data</div>;
  
  const maxValue = Math.max(...data.map(d => d[dataKey]));
  
  return (
    <div className="flex items-end gap-1 h-full" style={{ height }}>
      {data.map((item, idx) => {
        const heightPercent = maxValue > 0 ? (item[dataKey] / maxValue) * 100 : 0;
        return (
          <div 
            key={idx} 
            className="flex-1 flex flex-col items-center gap-1"
          >
            <div 
              className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer"
              style={{ 
                height: `${heightPercent}%`, 
                backgroundColor: color,
                minHeight: item[dataKey] > 0 ? '4px' : '0'
              }}
              title={`${item.date || item.hour}: ${item[dataKey]}`}
            />
            {data.length <= 14 && (
              <span className="text-[10px] text-gray-500 truncate w-full text-center">
                {item.date ? new Date(item.date).getDate() : item.hour}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Area Chart Component (simplified)
const AreaChartSimple = ({ 
  data, 
  lines,
  height = 200 
}: { 
  data: any[]; 
  lines: { key: string; color: string; label: string }[];
  height?: number;
}) => {
  if (!data.length) return <div className="h-full flex items-center justify-center text-gray-500">No data</div>;
  
  const allValues = lines.flatMap(line => data.map(d => d[line.key]));
  const maxValue = Math.max(...allValues);
  
  return (
    <div className="relative" style={{ height }}>
      {/* Legend */}
      <div className="absolute top-0 right-0 flex gap-4">
        {lines.map(line => (
          <div key={line.key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }} />
            <span className="text-xs text-gray-400">{line.label}</span>
          </div>
        ))}
      </div>
      
      {/* Chart */}
      <div className="flex items-end gap-1 h-full pt-8">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col gap-0.5">
            {lines.map(line => {
              const heightPercent = maxValue > 0 ? (item[line.key] / maxValue) * 100 : 0;
              return (
                <div
                  key={line.key}
                  className="w-full rounded-sm transition-all hover:opacity-80"
                  style={{ 
                    height: `${heightPercent}%`, 
                    backgroundColor: line.color,
                    minHeight: item[line.key] > 0 ? '2px' : '0'
                  }}
                  title={`${line.label}: ${item[line.key]}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Horizontal Bar Chart for Agent Performance
const HorizontalBarChart = ({ data }: { data: AgentPerformance[] }) => {
  if (!data.length) return <div className="h-full flex items-center justify-center text-gray-500">No agents</div>;
  
  const maxConversations = Math.max(...data.map(d => d.conversations));
  
  return (
    <div className="space-y-3">
      {data.slice(0, 5).map((agent, idx) => (
        <div key={agent.agent_id} className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-white font-medium truncate max-w-[150px]">{agent.agent_name}</span>
              <span className={classNames(
                "w-2 h-2 rounded-full",
                agent.status === 'active' ? 'bg-emerald-500' : 'bg-gray-500'
              )} />
            </div>
            <span className="text-sm text-gray-400">{agent.conversations} chats</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all"
              style={{ width: `${maxConversations > 0 ? (agent.conversations / maxConversations) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Heatmap for Hourly Distribution
const HourlyHeatmap = ({ data }: { data: HourlyPoint[] }) => {
  const maxValue = Math.max(...data.map(d => d.conversations));
  
  return (
    <div className="grid grid-cols-12 gap-1">
      {data.map((item) => {
        const intensity = maxValue > 0 ? item.conversations / maxValue : 0;
        return (
          <div
            key={item.hour}
            className="aspect-square rounded flex items-center justify-center text-[10px] text-gray-400 transition-all hover:scale-110 cursor-pointer"
            style={{ 
              backgroundColor: `rgba(239, 68, 68, ${intensity * 0.8 + 0.1})`,
            }}
            title={`${item.hour}:00 - ${item.conversations} conversations`}
          >
            {item.hour}
          </div>
        );
      })}
    </div>
  );
};

// Top Pages List
const TopPagesList = ({ data }: { data: TopPage[] }) => {
  if (!data.length) return <div className="h-full flex items-center justify-center text-gray-500 text-sm">No page data available</div>;
  
  const maxConversations = Math.max(...data.map(d => d.conversations));
  
  return (
    <div className="space-y-3">
      {data.map((page, idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Globe className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-white truncate" title={page.url}>{page.title}</span>
            </div>
            <span className="text-sm text-gray-400 shrink-0 ml-2">{page.conversations}</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
              style={{ width: `${(page.conversations / maxConversations) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Response Time Distribution Pie/Donut
const ResponseTimeDonut = ({ data }: { data: ResponseTimeDistribution }) => {
  if (!data.distribution.length) return <div className="h-full flex items-center justify-center text-gray-500">No data</div>;
  
  const total = data.distribution.reduce((sum, b) => sum + b.count, 0);
  const colors = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];
  
  return (
    <div className="flex items-center gap-6">
      {/* Simple bar representation */}
      <div className="flex-1 space-y-2">
        {data.distribution.map((bucket, idx) => {
          const percent = total > 0 ? (bucket.count / total) * 100 : 0;
          return (
            <div key={bucket.label} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-10">{bucket.label}</span>
              <div className="flex-1 h-4 bg-zinc-800 rounded overflow-hidden">
                <div 
                  className="h-full rounded transition-all"
                  style={{ 
                    width: `${percent}%`,
                    backgroundColor: colors[idx]
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 w-12 text-right">{percent.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const params = useParams();
  const workspaceId = params.id as string;

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [datePreset, setDatePreset] = useState('30d');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [agents, setAgents] = useState<Agent[]>([]);
  
  // Analytics Data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [conversationsData, setConversationsData] = useState<TimeSeriesPoint[]>([]);
  const [messagesData, setMessagesData] = useState<MessageTimeSeriesPoint[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyPoint[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [responseTimeData, setResponseTimeData] = useState<ResponseTimeDistribution | null>(null);

  // Compute date range
  const dateRange = useMemo(() => getDateRangePreset(datePreset), [datePreset]);

  // Load all data
  const loadAnalytics = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    
    try {
      const params = {
        workspace_id: workspaceId,
        start_date: formatDateForAPI(dateRange.start),
        end_date: formatDateForAPI(dateRange.end),
        agent_id: selectedAgent !== 'all' ? selectedAgent : undefined,
      };

      const [
        stats,
        conversations,
        messages,
        performance,
        hourly,
        pages,
        responseTime,
        agentsList
      ] = await Promise.all([
        getDashboardStats(params),
        getConversationsOverTime({ ...params, granularity: 'day' }),
        getMessagesOverTime(params),
        getAgentPerformance(params),
        getHourlyDistribution(params),
        getTopPages({ ...params, limit: 5 }),
        getResponseTimeDistribution(params),
        getAgents(workspaceId)
      ]);

      setDashboardStats(stats);
      setConversationsData(conversations);
      setMessagesData(messages);
      setAgentPerformance(performance);
      setHourlyData(hourly);
      setTopPages(pages);
      setResponseTimeData(responseTime);
      setAgents(agentsList);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [workspaceId, datePreset, selectedAgent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-8 h-8 text-red-500 animate-pulse" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-red-500" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Monitor your agent performance and usage metrics
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Agent Filter */}
          <div className="relative">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="appearance-none bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 pr-10 text-sm text-white focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="all">All Agents</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Date Range Filter */}
          <div className="relative">
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="appearance-none bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 pr-10 text-sm text-white focus:outline-none focus:border-red-500 cursor-pointer"
            >
              {DATE_PRESETS.map(preset => (
                <option key={preset.value} value={preset.value}>{preset.label}</option>
              ))}
            </select>
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadAnalytics(false)}
            disabled={refreshing}
            className="p-2 bg-zinc-900 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={classNames("w-5 h-5", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Conversations"
          value={dashboardStats?.total_conversations.toLocaleString() || '0'}
          icon={MessageSquare}
          trend={dashboardStats?.conversation_growth}
          color="red"
        />
        <StatCard
          title="Total Messages"
          value={dashboardStats?.total_messages.toLocaleString() || '0'}
          subtitle={`${dashboardStats?.total_tokens.toLocaleString() || '0'} tokens used`}
          icon={Zap}
          color="purple"
        />
        <StatCard
          title="Avg Response Time"
          value={`${((dashboardStats?.avg_response_time_ms || 0) / 1000).toFixed(2)}s`}
          subtitle="Time to first response"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Confidence Score"
          value={`${dashboardStats?.avg_confidence_score.toFixed(1) || '0'}%`}
          subtitle={`${dashboardStats?.active_agents || 0} active agents`}
          icon={Activity}
          color="emerald"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversations Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            Conversations Over Time
          </h3>
          <div className="h-[200px]">
            <BarChartSimple 
              data={conversationsData} 
              dataKey="conversations" 
              color="#ef4444"
            />
          </div>
        </motion.div>

        {/* Messages Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            Messages Over Time
          </h3>
          <div className="h-[200px]">
            <AreaChartSimple 
              data={messagesData}
              lines={[
                { key: 'user_messages', color: '#8b5cf6', label: 'User' },
                { key: 'bot_messages', color: '#ef4444', label: 'Bot' }
              ]}
            />
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-500" />
            Agent Performance
          </h3>
          <HorizontalBarChart data={agentPerformance} />
        </motion.div>

        {/* Hourly Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Peak Hours (24h)
          </h3>
          <p className="text-xs text-gray-500 mb-4">Conversation activity by hour of day</p>
          <HourlyHeatmap data={hourlyData} />
        </motion.div>

        {/* Response Time Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            Response Time Distribution
          </h3>
          {responseTimeData && <ResponseTimeDonut data={responseTimeData} />}
        </motion.div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-500" />
            Top Pages
          </h3>
          <p className="text-xs text-gray-500 mb-4">Pages where conversations originate</p>
          <TopPagesList data={topPages} />
        </motion.div>

        {/* Agent Stats Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" />
            Agent Details
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-gray-400 font-medium">Agent</th>
                  <th className="text-right py-2 text-gray-400 font-medium">Chats</th>
                  <th className="text-right py-2 text-gray-400 font-medium">Avg Time</th>
                  <th className="text-right py-2 text-gray-400 font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {agentPerformance.map(agent => (
                  <tr key={agent.agent_id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className={classNames(
                          "w-2 h-2 rounded-full",
                          agent.status === 'active' ? 'bg-emerald-500' : 'bg-gray-500'
                        )} />
                        <span className="text-white">{agent.agent_name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-gray-300">{agent.conversations}</td>
                    <td className="py-3 text-right text-gray-300">{(agent.avg_response_time_ms / 1000).toFixed(2)}s</td>
                    <td className="py-3 text-right">
                      <span className={classNames(
                        "px-2 py-0.5 rounded-full text-xs",
                        agent.avg_confidence >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                        agent.avg_confidence >= 60 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      )}>
                        {agent.avg_confidence.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
                {agentPerformance.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No agent data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
