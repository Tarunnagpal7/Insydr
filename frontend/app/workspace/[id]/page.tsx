'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/src/store/hooks';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BellAlertIcon,
  ShieldCheckIcon,
  HeartIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  XMarkIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { StatCardSkeleton, ActivityFeedSkeleton } from '@/src/components/ui/Skeleton';
import { getDashboardStats, DashboardStats, getDateRangePreset, formatDateForAPI } from '@/src/features/analytics/analytics.service';
import toast from 'react-hot-toast';

// ─── Health Score Calculator ───
function calculateHealthScore(stats: any): { score: number; label: string; color: string; items: { label: string; status: 'good' | 'warning' | 'critical'; tip: string }[] } {
  const items: { label: string; status: 'good' | 'warning' | 'critical'; tip: string }[] = [];
  let totalScore = 0;
  let checks = 0;

  // Agent health
  if (stats.total_agents > 0) {
    items.push({ label: 'Agents configured', status: 'good', tip: `${stats.total_agents} active agent(s)` });
    totalScore += 25;
  } else {
    items.push({ label: 'No agents created', status: 'critical', tip: 'Create your first agent to get started' });
  }
  checks++;

  // Documents health
  if (stats.total_documents > 5) {
    items.push({ label: 'Knowledge base', status: 'good', tip: `${stats.total_documents} documents indexed` });
    totalScore += 25;
  } else if (stats.total_documents > 0) {
    items.push({ label: 'Knowledge base sparse', status: 'warning', tip: 'Add more documents for better responses' });
    totalScore += 15;
  } else {
    items.push({ label: 'No documents', status: 'critical', tip: 'Upload documents to train your agents' });
  }
  checks++;

  // Activity health
  if (stats.total_conversations > 10) {
    items.push({ label: 'Active conversations', status: 'good', tip: `${stats.total_conversations} conversations so far` });
    totalScore += 25;
  } else if (stats.total_conversations > 0) {
    items.push({ label: 'Low activity', status: 'warning', tip: 'Deploy your widget to get more conversations' });
    totalScore += 15;
  } else {
    items.push({ label: 'No conversations yet', status: 'warning', tip: 'Embed the widget on your website to start' });
    totalScore += 5;
  }
  checks++;

  // Messages health
  if (stats.total_messages > 50) {
    items.push({ label: 'Healthy message volume', status: 'good', tip: `${stats.total_messages} messages exchanged` });
    totalScore += 25;
  } else if (stats.total_messages > 0) {
    items.push({ label: 'Growing message volume', status: 'warning', tip: 'User engagement is building up' });
    totalScore += 15;
  } else {
    items.push({ label: 'No messages yet', status: 'warning', tip: 'Start testing your agent in the playground' });
    totalScore += 5;
  }
  checks++;

  const score = Math.min(100, Math.round(totalScore));
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Attention';
  const color = score >= 80 ? 'emerald' : score >= 60 ? 'blue' : score >= 40 ? 'amber' : 'red';

  return { score, label, color, items };
}

// ─── Stat Card ───
function StatCard({ name, value, icon: Icon, href, color, trend }: {
  name: string;
  value: number | string;
  icon: any;
  href: string;
  color: string;
  trend?: number;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2 }}
        className="group relative bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 overflow-hidden hover:border-white/[0.15] hover:shadow-lg transition-all duration-300 cursor-pointer"
      >
        {/* Accent line */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${color} opacity-60 group-hover:opacity-100 transition-opacity`} />
        
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${color.includes('blue') ? 'bg-blue-500/15 text-blue-400' : color.includes('green') ? 'bg-emerald-500/15 text-emerald-400' : color.includes('purple') ? 'bg-purple-500/15 text-purple-400' : 'bg-amber-500/15 text-amber-400'}`}>
            <Icon className="h-5 w-5" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend >= 0 ? <ArrowTrendingUpIcon className="w-3.5 h-3.5" /> : <ArrowTrendingDownIcon className="w-3.5 h-3.5" />}
              {Math.abs(trend).toFixed(0)}%
            </div>
          )}
        </div>
        <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-1">{name}</p>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      </motion.div>
    </Link>
  );
}

// ─── Notification Item ───
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

function getNotifications(stats: any): Notification[] {
  const notifications: Notification[] = [];
  const now = new Date();

  if (stats.total_agents === 0) {
    notifications.push({
      id: 'no-agents',
      type: 'alert',
      title: 'Get Started',
      message: 'Create your first AI agent to start engaging with visitors.',
      time: 'Just now',
      read: false,
    });
  }

  if (stats.total_documents === 0) {
    notifications.push({
      id: 'no-docs',
      type: 'warning',
      title: 'Knowledge Base Empty',
      message: 'Upload documents or crawl a website to train your agents.',
      time: 'Just now',
      read: false,
    });
  }

  if (stats.total_conversations > 0) {
    notifications.push({
      id: 'conversations',
      type: 'success',
      title: 'Conversations Active',
      message: `You have ${stats.total_conversations} conversation(s) so far. View analytics for insights.`,
      time: 'Recent',
      read: false,
    });
  }

  if (stats.total_agents > 0 && stats.total_documents > 0) {
    notifications.push({
      id: 'ready',
      type: 'info',
      title: 'System Ready',
      message: 'Your workspace is configured and ready to serve visitors.',
      time: 'Active',
      read: true,
    });
  }

  return notifications;
}

const NOTIFICATION_ICONS: Record<string, any> = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  alert: BellAlertIcon,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  info: 'text-blue-400 bg-blue-500/10',
  success: 'text-emerald-400 bg-emerald-500/10',
  warning: 'text-amber-400 bg-amber-500/10',
  alert: 'text-red-400 bg-red-500/10',
};

// ─── Activity Item (static for now, backend endpoint needed) ───
interface ActivityItem {
  id: string;
  icon: any;
  iconColor: string;
  title: string;
  time: string;
}

function getRecentActivity(stats: any): ActivityItem[] {
  const activities: ActivityItem[] = [];
  
  if (stats.total_conversations > 0) {
    activities.push({
      id: 'conv-recent',
      icon: ChatBubbleLeftRightIcon,
      iconColor: 'text-blue-400 bg-blue-500/10',
      title: `${stats.total_conversations} conversations recorded`,
      time: 'Since creation',
    });
  }

  if (stats.total_documents > 0) {
    activities.push({
      id: 'docs-upload',
      icon: DocumentTextIcon,
      iconColor: 'text-emerald-400 bg-emerald-500/10',
      title: `${stats.total_documents} documents in knowledge base`,
      time: 'Active',
    });
  }

  if (stats.total_agents > 0) {
    activities.push({
      id: 'agent-created',
      icon: SparklesIcon,
      iconColor: 'text-purple-400 bg-purple-500/10',
      title: `${stats.total_agents} agent(s) configured`,
      time: 'Active',
    });
  }

  if (stats.total_messages > 0) {
    activities.push({
      id: 'messages',
      icon: ChatBubbleLeftRightIcon,
      iconColor: 'text-amber-400 bg-amber-500/10',
      title: `${stats.total_messages} messages exchanged`,
      time: 'Total',
    });
  }

  return activities;
}

// ─── Main Dashboard ───
export default function WorkspaceDashboard() {
  const params = useParams();
  const workspaceId = params.id as string;
  const { currentWorkspace } = useAppSelector((state) => state.workspace);
  const { user } = useAppSelector((state) => state.auth);

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);

  // Fetch real analytics stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const { start, end } = getDateRangePreset('30d');
        const stats = await getDashboardStats({
          workspace_id: workspaceId,
          start_date: formatDateForAPI(start),
          end_date: formatDateForAPI(end),
        });
        setDashboardStats(stats);
      } catch (error) {
        console.error('Failed to load dashboard stats', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (workspaceId) fetchStats();
  }, [workspaceId]);

  if (!currentWorkspace) return null;

  const wsStats = currentWorkspace.stats || {
    total_agents: 0,
    total_documents: 0,
    total_conversations: 0,
    total_messages: 0,
  };

  const healthData = calculateHealthScore(wsStats);
  const notifications = getNotifications(wsStats);
  const activities = getRecentActivity(wsStats);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const statCards = [
    {
      name: 'Total Agents',
      value: wsStats.total_agents,
      icon: ChatBubbleLeftRightIcon,
      href: `/workspace/${workspaceId}/agents`,
      color: 'from-blue-500 to-cyan-500',
      trend: dashboardStats?.conversation_growth,
    },
    {
      name: 'Documents',
      value: wsStats.total_documents,
      icon: DocumentTextIcon,
      href: `/workspace/${workspaceId}/knowledge`,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      name: 'Conversations',
      value: dashboardStats?.total_conversations || wsStats.total_conversations,
      icon: ChartBarIcon,
      href: `/workspace/${workspaceId}/analytics`,
      color: 'from-purple-500 to-violet-500',
      trend: dashboardStats?.conversation_growth,
    },
    {
      name: 'Messages',
      value: dashboardStats?.total_messages || wsStats.total_messages,
      icon: ClockIcon,
      href: `/workspace/${workspaceId}/analytics`,
      color: 'from-amber-500 to-orange-500',
    },
  ];

  const quickActions = [
    {
      title: 'Create New Agent',
      description: 'Set up a new AI agent for your use case',
      href: `/workspace/${workspaceId}/agents`,
      icon: ChatBubbleLeftRightIcon,
      color: 'from-red-600 to-red-800',
    },
    {
      title: 'Upload Documents',
      description: "Add knowledge to your agent's training data",
      href: `/workspace/${workspaceId}/knowledge`,
      icon: ArrowUpTrayIcon,
      color: 'from-blue-600 to-blue-800',
    },
    {
      title: 'View Analytics',
      description: 'Check your agent performance and insights',
      href: `/workspace/${workspaceId}/analytics`,
      icon: ChartBarIcon,
      color: 'from-purple-600 to-purple-800',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting}, {user?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Here&apos;s what&apos;s happening with <span className="text-white font-medium">{currentWorkspace.name}</span> today.
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      {isLoadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <motion.div key={stat.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Grid: Health + Notifications + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Health Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4 text-red-500" />
            Workspace Health
          </h3>

          {/* Score Ring */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={healthData.color === 'emerald' ? '#10b981' : healthData.color === 'blue' ? '#3b82f6' : healthData.color === 'amber' ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(healthData.score / 100) * 314} 314`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{healthData.score}</span>
                <span className="text-xs text-gray-400">{healthData.label}</span>
              </div>
            </div>
          </div>

          {/* Health Items */}
          <div className="space-y-2.5">
            {healthData.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                <div className={`w-2 h-2 rounded-full shrink-0 ${item.status === 'good' ? 'bg-emerald-500' : item.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-300 truncate">{item.label}</p>
                  <p className="text-[10px] text-gray-500 truncate">{item.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Column 2: Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BellAlertIcon className="w-4 h-4 text-amber-500" />
              Notifications
            </h3>
            {notifications.length > 0 && (
              <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                {notifications.filter(n => !n.read).length} new
              </span>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((notification) => {
                const Icon = NOTIFICATION_ICONS[notification.type] || InformationCircleIcon;
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      notification.read ? 'bg-white/[0.02] border-white/5' : 'bg-white/[0.04] border-white/10'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${NOTIFICATION_COLORS[notification.type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white">{notification.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{notification.message}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {notifications.length === 0 && (
              <div className="text-center py-8">
                <CheckCircleIcon className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                <p className="text-xs text-gray-500">All caught up! No new notifications.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Column 3: Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-purple-500" />
            Recent Activity
          </h3>

          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activity.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-300">{activity.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="w-8 h-8 text-gray-600/50 mx-auto mb-2" />
              <p className="text-xs text-gray-500 mb-3">No activity yet</p>
              <Link
                href={`/workspace/${workspaceId}/agents`}
                className="text-xs text-red-400 hover:text-red-300 font-medium"
              >
                Create an agent to get started →
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
      >
        <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-red-500" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="group p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-red-500/30 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1 group-hover:text-red-400 transition-colors">
                  {action.title}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Analytics Preview */}
      {dashboardStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ChartBarIcon className="w-4 h-4 text-blue-500" />
              Analytics Snapshot (Last 30 Days)
            </h3>
            <Link href={`/workspace/${workspaceId}/analytics`} className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              View All <EyeIcon className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Avg Response Time</p>
              <p className="text-lg font-bold text-white">{dashboardStats.avg_response_time_ms < 1000 ? `${dashboardStats.avg_response_time_ms}ms` : `${(dashboardStats.avg_response_time_ms / 1000).toFixed(1)}s`}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Confidence Score</p>
              <p className="text-lg font-bold text-white">{(dashboardStats.avg_confidence_score * 100).toFixed(0)}%</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Active Agents</p>
              <p className="text-lg font-bold text-white">{dashboardStats.active_agents}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Growth</p>
              <p className={`text-lg font-bold ${dashboardStats.conversation_growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {dashboardStats.conversation_growth >= 0 ? '+' : ''}{dashboardStats.conversation_growth.toFixed(1)}%
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
