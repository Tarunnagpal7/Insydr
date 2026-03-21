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
  ChevronDown,
  Search,
  Brain,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Download,
  FileText,
  UserCheck,
  UserPlus,
  HelpCircle,
  Database,
  BarChart2,
  Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import classNames from 'classnames';
import ReactMarkdown from 'react-markdown';
import {
  getDashboardStats,
  getConversationsOverTime,
  getMessagesOverTime,
  getAgentPerformance,
  getHourlyDistribution,
  getTopPages,
  getResponseTimeDistribution,
  getKnowledgeGaps,
  analyzeKnowledgeGaps,
  getFeedbackStats,
  getFeedbackOverTime,
  getConversationInsights,
  getDayOfWeekDistribution,
  getTopQuestions,
  getUserBehavior,
  getKnowledgeBaseStats,
  formatDateForAPI,
  getDateRangePreset,
  DashboardStats,
  TimeSeriesPoint,
  MessageTimeSeriesPoint,
  AgentPerformance,
  HourlyPoint,
  TopPage,
  ResponseTimeDistribution,
  UnansweredQuestion,
  GapAnalysis,
  FeedbackStats,
  FeedbackOverTimePoint,
  ConversationInsights,
  DayOfWeekPoint,
  TopQuestion,
  UserBehavior,
  KnowledgeBaseStats
} from '@/src/features/analytics/analytics.service';
import { getAgents, Agent } from '@/src/features/agents/agents.service';
import apiClient from '@/src/lib/api';

// Date range presets
const DATE_PRESETS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last 12 months', value: '12m' },
];

// Stat Card Component — Glassmorphism Redesign
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
  const glowColors = {
    red: 'shadow-red-500/20',
    emerald: 'shadow-emerald-500/20',
    blue: 'shadow-blue-500/20',
    purple: 'shadow-purple-500/20',
    amber: 'shadow-amber-500/20',
  };
  
  const iconBgColors = {
    red: 'bg-red-500/15 ring-red-500/30 text-red-400',
    emerald: 'bg-emerald-500/15 ring-emerald-500/30 text-emerald-400',
    blue: 'bg-blue-500/15 ring-blue-500/30 text-blue-400',
    purple: 'bg-purple-500/15 ring-purple-500/30 text-purple-400',
    amber: 'bg-amber-500/15 ring-amber-500/30 text-amber-400',
  };

  const accentColors = {
    red: 'from-red-500 to-rose-600',
    emerald: 'from-emerald-500 to-teal-600',
    blue: 'from-blue-500 to-cyan-600',
    purple: 'from-purple-500 to-violet-600',
    amber: 'from-amber-500 to-orange-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={classNames(
        "relative bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 overflow-hidden group cursor-default",
        `hover:${glowColors[color]}`,
        "hover:shadow-lg hover:border-white/[0.15] transition-all duration-300"
      )}
    >
      {/* Accent line at top */}
      <div className={classNames("absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-60 group-hover:opacity-100 transition-opacity", accentColors[color])} />
      
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
          {subtitle && <p className="text-[11px] text-gray-500">{subtitle}</p>}
        </div>
        <div className={classNames("p-2.5 rounded-xl ring-1", iconBgColors[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={classNames(
          "flex items-center gap-1 mt-3 text-xs font-medium",
          trend >= 0 ? "text-emerald-400" : "text-red-400"
        )}>
          {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span>{Math.abs(trend).toFixed(1)}%</span>
          <span className="text-gray-600 ml-0.5">vs prev</span>
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

// Knowledge Gaps Component
const KnowledgeGapsPanel = ({ workspaceId }: { workspaceId: string }) => {
  const [gaps, setGaps] = useState<UnansweredQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  useEffect(() => {
    const fetchGaps = async () => {
      try {
        const data = await getKnowledgeGaps({ workspace_id: workspaceId });
        setGaps(data);
      } catch (error) {
        console.error('Failed to load knowledge gaps', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGaps();
  }, [workspaceId]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeKnowledgeGaps({ workspace_id: workspaceId });
      setAnalysis(result.analysis);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Failed to analyze gaps', error);
      toast.error('Failed to analyze knowledge gaps');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-red-500" />
            Knowledge Gaps
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Questions your agents couldn't answer. Add these to your knowledge base.
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing || gaps.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          Analyze & Suggest
        </button>
      </div>

      {analysis && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-gradient-to-br from-red-500/10 to-purple-500/10 border border-red-500/20 rounded-xl"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-red-400" />
            <h4 className="font-semibold text-white">AI Content Suggestions</h4>
          </div>
          <div className="text-sm text-gray-300 prose prose-invert max-w-none prose-headings:text-white prose-strong:text-white prose-li:text-gray-300">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
        </motion.div>
      )}

      {gaps.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50">
          <div className="max-h-[360px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 bg-black/30 uppercase border-b border-white/10 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 font-medium">Unanswered Question</th>
                  <th className="px-6 py-3 font-medium text-center">Occurrences</th>
                  <th className="px-6 py-3 font-medium text-right">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {gaps.map((gap) => (
                  <tr key={gap.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-200">
                      {gap.question}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full bg-red-500/20 text-red-400">
                        {gap.occurrence_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400 whitespace-nowrap">
                      {new Date(gap.last_seen_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-zinc-900/30 rounded-xl border border-white/5 border-dashed">
          <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No knowledge gaps detected yet!</p>
          <p className="text-gray-500 text-xs mt-1">Your agents are answering everything perfectly.</p>
        </div>
      )}
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
  // New analytics data
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [feedbackOverTime, setFeedbackOverTime] = useState<FeedbackOverTimePoint[]>([]);
  const [conversationInsights, setConversationInsights] = useState<ConversationInsights | null>(null);
  const [dayOfWeekData, setDayOfWeekData] = useState<DayOfWeekPoint[]>([]);
  const [topQuestions, setTopQuestions] = useState<TopQuestion[]>([]);
  const [userBehavior, setUserBehavior] = useState<UserBehavior | null>(null);
  const [kbStats, setKbStats] = useState<KnowledgeBaseStats | null>(null);

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
        agentsList,
        feedback,
        feedbackTime,
        convInsights,
        dowData,
        topQ,
        behavior,
        kbStatsData
      ] = await Promise.all([
        getDashboardStats(params),
        getConversationsOverTime({ ...params, granularity: 'day' }),
        getMessagesOverTime(params),
        getAgentPerformance(params),
        getHourlyDistribution(params),
        getTopPages({ ...params, limit: 5 }),
        getResponseTimeDistribution(params),
        getAgents(workspaceId),
        getFeedbackStats(params).catch(() => null),
        getFeedbackOverTime(params).catch(() => []),
        getConversationInsights(params).catch(() => null),
        getDayOfWeekDistribution(params).catch(() => []),
        getTopQuestions({ ...params, limit: 20 }).catch(() => []),
        getUserBehavior(params).catch(() => null),
        getKnowledgeBaseStats({ workspace_id: workspaceId }).catch(() => null),
      ]);

      setDashboardStats(stats);
      setConversationsData(conversations);
      setMessagesData(messages);
      setAgentPerformance(performance);
      setHourlyData(hourly);
      setTopPages(pages);
      setResponseTimeData(responseTime);
      setAgents(agentsList);
      setFeedbackStats(feedback);
      setFeedbackOverTime(feedbackTime);
      setConversationInsights(convInsights);
      setDayOfWeekData(dowData);
      setTopQuestions(topQ);
      setUserBehavior(behavior);
      setKbStats(kbStatsData);
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
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center animate-pulse">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-gray-500 text-sm font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
              <p className="text-gray-500 text-xs mt-0.5">
                Real-time performance insights
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-zinc-900/60 backdrop-blur-lg border border-white/[0.06] rounded-xl p-1.5">
          {/* Agent Filter */}
          <div className="relative">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="appearance-none bg-white/[0.04] hover:bg-white/[0.08] border-0 rounded-lg px-3 py-1.5 pr-8 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-red-500/50 cursor-pointer transition-colors"
            >
              <option value="all">All Agents</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
          </div>

          <div className="w-px h-5 bg-white/10" />

          {/* Date Range Filter */}
          <div className="relative">
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="appearance-none bg-white/[0.04] hover:bg-white/[0.08] border-0 rounded-lg px-3 py-1.5 pr-8 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-red-500/50 cursor-pointer transition-colors"
            >
              {DATE_PRESETS.map(preset => (
                <option key={preset.value} value={preset.value}>{preset.label}</option>
              ))}
            </select>
            <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
          </div>

          <div className="w-px h-5 bg-white/10" />

          {/* Refresh Button */}
          <button
            onClick={() => loadAnalytics(false)}
            disabled={refreshing}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-50"
          >
            <RefreshCw className={classNames("w-4 h-4", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
        <StatCard
          title="Satisfaction"
          value={feedbackStats ? `${feedbackStats.satisfaction_score}%` : 'N/A'}
          subtitle={feedbackStats ? `${feedbackStats.total_feedback} ratings` : 'No feedback yet'}
          icon={Heart}
          color="amber"
        />
        <StatCard
          title="Knowledge Base"
          value={kbStats?.total_documents?.toLocaleString() || '0'}
          subtitle={`${kbStats?.total_chunks?.toLocaleString() || '0'} chunks indexed`}
          icon={Database}
          color="blue"
        />
      </div>

      {/* Conversation Insights Row */}
      {conversationInsights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-xl p-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-500 to-cyan-500" />
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">Avg Msgs/Conv</p>
            <p className="text-xl font-bold text-white mt-1 tracking-tight">{conversationInsights.avg_messages_per_conversation}</p>
          </div>
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-xl p-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-emerald-500 to-teal-500" />
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">Avg Duration</p>
            <p className="text-xl font-bold text-white mt-1 tracking-tight">{conversationInsights.avg_duration_seconds > 60 ? `${(conversationInsights.avg_duration_seconds / 60).toFixed(1)}m` : `${conversationInsights.avg_duration_seconds.toFixed(0)}s`}</p>
          </div>
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-xl p-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-amber-500 to-orange-500" />
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">Abandonment</p>
            <p className="text-xl font-bold text-white mt-1 tracking-tight">{conversationInsights.abandonment_rate}%</p>
          </div>
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-xl p-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-purple-500 to-violet-500" />
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">First Response</p>
            <p className="text-xl font-bold text-white mt-1 tracking-tight">{(conversationInsights.avg_first_response_ms / 1000).toFixed(2)}s</p>
          </div>
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-xl p-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-rose-500 to-pink-500" />
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">Visitors</p>
            <p className="text-xl font-bold text-white mt-1 tracking-tight">{userBehavior?.total_unique_visitors || 0}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{userBehavior?.new_visitor_ratio || 0}% new</p>
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversations Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
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
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
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
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
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
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
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
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
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
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
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
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" />
            Agent Details
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
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
      {/* Charts Row 4: Knowledge Gaps */}
      <div className="grid grid-cols-1 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
        >
          <KnowledgeGapsPanel workspaceId={workspaceId} />
        </motion.div>
      </div>

      {/* Row 5: Top Questions + Day of Week */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-500" />
            Top Asked Questions
          </h3>
          <p className="text-xs text-gray-500 mb-4">Most frequently asked by users</p>
          {topQuestions.length > 0 ? (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {topQuestions.map((q, i) => (
                <div key={i} className="flex items-start justify-between py-2 px-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{q.question}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Last asked {new Date(q.last_asked).toLocaleDateString()}</p>
                  </div>
                  <span className="ml-3 px-2 py-1 text-xs font-bold rounded-full bg-purple-500/20 text-purple-400 shrink-0">
                    {q.frequency}×
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 text-sm">
              <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No question data yet
            </div>
          )}
        </motion.div>

        {/* Day of Week */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-500" />
            Day-of-Week Activity
          </h3>
          <p className="text-xs text-gray-500 mb-4">Conversation distribution by day</p>
          {dayOfWeekData.length > 0 ? (
            <div className="flex items-end justify-between gap-2 h-48">
              {dayOfWeekData.map((d, i) => {
                const maxVal = Math.max(...dayOfWeekData.map(x => x.conversations), 1);
                const heightPct = (d.conversations / maxVal) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-400">{d.conversations}</span>
                    <div className="w-full relative" style={{ height: '140px' }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-teal-600 to-teal-400 transition-all"
                        style={{ height: `${Math.max(heightPct, 4)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{d.day}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 text-sm">
              No data yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Row 6: Feedback Analytics + User Behavior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-green-500" />
            Feedback Analytics
          </h3>
          <p className="text-xs text-gray-500 mb-4">User satisfaction from thumbs up/down</p>
          {feedbackStats && feedbackStats.total_feedback > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                  <ThumbsUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-green-400">{feedbackStats.thumbs_up}</p>
                  <p className="text-xs text-gray-400">Helpful</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                  <ThumbsDown className="w-4 h-4 text-red-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-red-400">{feedbackStats.thumbs_down}</p>
                  <p className="text-xs text-gray-400">Not Helpful</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <Heart className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{feedbackStats.satisfaction_score}%</p>
                  <p className="text-xs text-gray-400">Satisfaction</p>
                </div>
              </div>
              {/* Feedback over time mini chart */}
              {feedbackOverTime.length > 0 && (
                <div className="h-24 flex items-end gap-1">
                  {feedbackOverTime.map((d, i) => {
                    const total = d.thumbs_up + d.thumbs_down;
                    return (
                      <div key={i} className="flex-1 flex flex-col gap-px" title={`${d.date}: ${d.thumbs_up}👍 ${d.thumbs_down}👎`}>
                        <div className="bg-green-500/60 rounded-t-sm" style={{ height: `${total > 0 ? (d.thumbs_up / Math.max(...feedbackOverTime.map(x => x.thumbs_up + x.thumbs_down), 1)) * 80 : 2}px` }} />
                        <div className="bg-red-500/60 rounded-b-sm" style={{ height: `${total > 0 ? (d.thumbs_down / Math.max(...feedbackOverTime.map(x => x.thumbs_up + x.thumbs_down), 1)) * 80 : 2}px` }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 text-sm">
              <ThumbsUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No feedback data yet
            </div>
          )}
        </motion.div>

        {/* User Behavior */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            User Behavior
          </h3>
          <p className="text-xs text-gray-500 mb-4">Visitor engagement and retention</p>
          {userBehavior ? (
            <div className="space-y-4">
              {/* Visitors donut-like display */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserPlus className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs text-gray-400">New Visitors</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{userBehavior.new_visitors}</p>
                  <p className="text-xs text-indigo-400 mt-1">{userBehavior.new_visitor_ratio}% of total</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-gray-400">Returning</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{userBehavior.returning_visitors}</p>
                  <p className="text-xs text-emerald-400 mt-1">{userBehavior.total_unique_visitors > 0 ? (100 - userBehavior.new_visitor_ratio).toFixed(1) : 0}% of total</p>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Conversations per visitor</span>
                  <span className="text-lg font-bold text-white">{userBehavior.conversations_per_visitor}</span>
                </div>
                <div className="mt-2 w-full bg-zinc-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                    style={{ width: `${Math.min(userBehavior.conversations_per_visitor * 20, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 text-sm">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No visitor data yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Row 7: Knowledge Base Stats + Export */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Knowledge Base Stats */}
        {kbStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <Database className="w-5 h-5 text-sky-500" />
              Knowledge Base
            </h3>
            <p className="text-xs text-gray-500 mb-4">Source content overview</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 text-center">
                <FileText className="w-5 h-5 text-sky-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{kbStats.total_documents}</p>
                <p className="text-xs text-gray-400">Documents</p>
              </div>
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 text-center">
                <BarChart2 className="w-5 h-5 text-violet-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{kbStats.total_chunks}</p>
                <p className="text-xs text-gray-400">Chunks</p>
              </div>
            </div>
            {Object.keys(kbStats.documents_by_type).length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">By Source Type</p>
                <div className="space-y-2">
                  {Object.entries(kbStats.documents_by_type).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-300 capitalize">{type}</span>
                      <span className="text-sm font-bold text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Export Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <Download className="w-5 h-5 text-amber-500" />
            Export Data
          </h3>
          <p className="text-xs text-gray-500 mb-4">Download analytics data as CSV</p>
          <div className="space-y-3">
            {[
              { label: 'Conversations', desc: 'All conversations with metadata', path: 'conversations' },
              { label: 'Messages', desc: 'All messages with confidence scores', path: 'messages' },
              { label: 'Knowledge Gaps', desc: 'Unanswered questions report', path: 'knowledge-gaps' },
            ].map((item) => (
              <button
                key={item.path}
                onClick={async () => {
                  try {
                    const params: any = { workspace_id: workspaceId, format: 'csv' };
                    if (item.path !== 'knowledge-gaps') {
                      params.start_date = formatDateForAPI(dateRange.start);
                      params.end_date = formatDateForAPI(dateRange.end);
                    }
                    const response = await apiClient.get(`/analytics/export/${item.path}`, {
                      params,
                      responseType: 'blob',
                    });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `${item.path}_export.csv`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    toast.success(`${item.label} exported!`);
                  } catch {
                    toast.error('Export failed');
                  }
                }}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/8 border border-white/5 hover:border-amber-500/30 rounded-xl transition-all group"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <Download className="w-4 h-4 text-gray-500 group-hover:text-amber-400 transition-colors" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
