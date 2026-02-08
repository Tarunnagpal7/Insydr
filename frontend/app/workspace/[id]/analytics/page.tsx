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

// Beautiful SVG Area Chart for Conversations
const ConversationsChart = ({ 
  data,
  height = 220 
}: { 
  data: TimeSeriesPoint[];
  height?: number;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No conversation data</p>
        </div>
      </div>
    );
  }
  
  const maxValue = Math.max(...data.map(d => d.conversations), 1);
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 100; // Percentage based
  const chartHeight = height - padding.top - padding.bottom;
  
  // Generate smooth curve path
  const generatePath = (points: { x: number; y: number }[], close: boolean = false) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cp1x = prev.x + (curr.x - prev.x) / 3;
      const cp2x = prev.x + (2 * (curr.x - prev.x)) / 3;
      path += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    
    if (close) {
      path += ` L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;
    }
    
    return path;
  };

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: chartHeight - (d.conversations / maxValue) * chartHeight
  }));

  const linePath = generatePath(points);
  const areaPath = generatePath(points, true);

  // Y-axis labels
  const yLabels = [0, Math.round(maxValue / 2), maxValue];

  return (
    <div className="relative" style={{ height }}>
      {/* Y-axis labels */}
      <div className="absolute left-0 top-5 bottom-10 w-10 flex flex-col justify-between text-right pr-2">
        {yLabels.reverse().map((val, i) => (
          <span key={i} className="text-[10px] text-gray-500">{val}</span>
        ))}
      </div>
      
      {/* Chart */}
      <div className="absolute left-12 right-0 top-0 bottom-0">
        <svg width="100%" height="100%" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
          <defs>
            {/* Gradient for area fill */}
            <linearGradient id="conversationsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ef4444" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Grid lines */}
          <g className="opacity-20">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <line
                key={i}
                x1="0"
                y1={padding.top + chartHeight * ratio}
                x2="100"
                y2={padding.top + chartHeight * ratio}
                stroke="white"
                strokeDasharray="2,4"
              />
            ))}
          </g>
          
          {/* Area fill */}
          <path
            d={areaPath}
            fill="url(#conversationsGradient)"
            transform={`translate(0, ${padding.top})`}
          />
          
          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
            transform={`translate(0, ${padding.top})`}
          />
          
          {/* Data points */}
          {points.map((point, i) => (
            <g key={i} transform={`translate(0, ${padding.top})`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredIndex === i ? 5 : 3}
                fill="#ef4444"
                stroke="#1a1a1a"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {/* Outer glow on hover */}
              {hoveredIndex === i && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="8"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1"
                  opacity="0.5"
                />
              )}
            </g>
          ))}
        </svg>
        
        {/* Tooltip */}
        {hoveredIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bg-zinc-800 border border-red-500/30 rounded-lg px-3 py-2 shadow-xl pointer-events-none z-10"
            style={{
              left: `${points[hoveredIndex].x}%`,
              top: points[hoveredIndex].y + padding.top - 50,
              transform: 'translateX(-50%)'
            }}
          >
            <p className="text-xs text-gray-400">{new Date(data[hoveredIndex].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            <p className="text-sm font-bold text-white">{data[hoveredIndex].conversations} <span className="text-red-400 font-normal">conversations</span></p>
          </motion.div>
        )}
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
          {data.length <= 14 ? (
            data.map((d, i) => (
              <span key={i} className="text-[10px] text-gray-500">
                {new Date(d.date).getDate()}
              </span>
            ))
          ) : (
            <>
              <span className="text-[10px] text-gray-500">
                {new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-[10px] text-gray-500">
                {new Date(data[Math.floor(data.length / 2)].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-[10px] text-gray-500">
                {new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="absolute top-0 right-0 flex gap-4">
        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase">Total</p>
          <p className="text-sm font-bold text-white">{data.reduce((sum, d) => sum + d.conversations, 0)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase">Avg/Day</p>
          <p className="text-sm font-bold text-white">{Math.round(data.reduce((sum, d) => sum + d.conversations, 0) / data.length)}</p>
        </div>
      </div>
    </div>
  );
};

// Beautiful SVG Stacked Area Chart for Messages
const MessagesChart = ({ 
  data,
  height = 220 
}: { 
  data: MessageTimeSeriesPoint[];
  height?: number;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No message data</p>
        </div>
      </div>
    );
  }
  
  const maxValue = Math.max(...data.map(d => d.total), 1);
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartHeight = height - padding.top - padding.bottom;
  
  // Generate smooth curve path
  const generatePath = (points: { x: number; y: number }[], close: boolean = false, baseY?: number) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cp1x = prev.x + (curr.x - prev.x) / 3;
      const cp2x = prev.x + (2 * (curr.x - prev.x)) / 3;
      path += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    
    if (close && baseY !== undefined) {
      path += ` L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`;
    }
    
    return path;
  };

  // Calculate points for both lines
  const userPoints = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: chartHeight - (d.user_messages / maxValue) * chartHeight
  }));
  
  const botPoints = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: chartHeight - (d.bot_messages / maxValue) * chartHeight
  }));
  
  const totalPoints = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: chartHeight - (d.total / maxValue) * chartHeight
  }));

  // Y-axis labels
  const yLabels = [0, Math.round(maxValue / 2), maxValue];

  // Calculate totals for summary
  const totalUser = data.reduce((sum, d) => sum + d.user_messages, 0);
  const totalBot = data.reduce((sum, d) => sum + d.bot_messages, 0);

  return (
    <div className="relative" style={{ height }}>
      {/* Legend */}
      <div className="absolute top-0 right-0 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-xs text-gray-400">User ({totalUser})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-gray-400">Bot ({totalBot})</span>
        </div>
      </div>
      
      {/* Y-axis labels */}
      <div className="absolute left-0 top-5 bottom-10 w-10 flex flex-col justify-between text-right pr-2">
        {yLabels.reverse().map((val, i) => (
          <span key={i} className="text-[10px] text-gray-500">{val}</span>
        ))}
      </div>
      
      {/* Chart */}
      <div className="absolute left-12 right-0 top-0 bottom-0">
        <svg width="100%" height="100%" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
          <defs>
            {/* Purple gradient for user messages */}
            <linearGradient id="userGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
            {/* Red gradient for bot messages */}
            <linearGradient id="botGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <g className="opacity-20">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <line
                key={i}
                x1="0"
                y1={padding.top + chartHeight * ratio}
                x2="100"
                y2={padding.top + chartHeight * ratio}
                stroke="white"
                strokeDasharray="2,4"
              />
            ))}
          </g>
          
          {/* User area fill */}
          <path
            d={generatePath(userPoints, true, chartHeight)}
            fill="url(#userGradient)"
            transform={`translate(0, ${padding.top})`}
          />
          
          {/* Bot area fill */}
          <path
            d={generatePath(botPoints, true, chartHeight)}
            fill="url(#botGradient)"
            transform={`translate(0, ${padding.top})`}
          />
          
          {/* User line */}
          <path
            d={generatePath(userPoints)}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={`translate(0, ${padding.top})`}
          />
          
          {/* Bot line */}
          <path
            d={generatePath(botPoints)}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={`translate(0, ${padding.top})`}
          />
          
          {/* Interactive hover areas */}
          {data.map((d, i) => (
            <rect
              key={i}
              x={(i / data.length) * 100}
              y={padding.top}
              width={100 / data.length}
              height={chartHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
          
          {/* Hover line */}
          {hoveredIndex !== null && (
            <line
              x1={userPoints[hoveredIndex].x}
              y1={padding.top}
              x2={userPoints[hoveredIndex].x}
              y2={padding.top + chartHeight}
              stroke="white"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.5"
            />
          )}
          
          {/* Data points on hover */}
          {hoveredIndex !== null && (
            <g transform={`translate(0, ${padding.top})`}>
              <circle cx={userPoints[hoveredIndex].x} cy={userPoints[hoveredIndex].y} r="5" fill="#8b5cf6" stroke="#1a1a1a" strokeWidth="2" />
              <circle cx={botPoints[hoveredIndex].x} cy={botPoints[hoveredIndex].y} r="5" fill="#ef4444" stroke="#1a1a1a" strokeWidth="2" />
            </g>
          )}
        </svg>
        
        {/* Tooltip */}
        {hoveredIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bg-zinc-800/95 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 shadow-2xl pointer-events-none z-10"
            style={{
              left: `${userPoints[hoveredIndex].x}%`,
              top: Math.min(userPoints[hoveredIndex].y, botPoints[hoveredIndex].y) + padding.top - 80,
              transform: 'translateX(-50%)'
            }}
          >
            <p className="text-xs text-gray-400 mb-2 border-b border-white/10 pb-2">
              {new Date(data[hoveredIndex].date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-sm text-white">User: <span className="font-bold">{data[hoveredIndex].user_messages}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm text-white">Bot: <span className="font-bold">{data[hoveredIndex].bot_messages}</span></span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-white/10 mt-1">
                <span className="text-xs text-gray-400">Total: <span className="text-white font-bold">{data[hoveredIndex].total}</span></span>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
          {data.length <= 14 ? (
            data.map((d, i) => (
              <span key={i} className="text-[10px] text-gray-500">
                {new Date(d.date).getDate()}
              </span>
            ))
          ) : (
            <>
              <span className="text-[10px] text-gray-500">
                {new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-[10px] text-gray-500">
                {new Date(data[Math.floor(data.length / 2)].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-[10px] text-gray-500">
                {new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </>
          )}
        </div>
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
          <div className="h-[220px]">
            <ConversationsChart 
              data={conversationsData}
              height={220}
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
          <div className="h-[220px]">
            <MessagesChart 
              data={messagesData}
              height={220}
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
