'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  UsersIcon,
  Squares2X2Icon,
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  KeyIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { getAdminStats, PlatformStats, getAdminUsers, AdminUser, getAdminWorkspaces, AdminWorkspace, getAdminActivity, AdminActivity } from '@/src/features/admin/admin.service';
import { StatCardSkeleton } from '@/src/components/ui/Skeleton';

export default function AdminOverview() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [recentWorkspaces, setRecentWorkspaces] = useState<AdminWorkspace[]>([]);
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsData, usersData, wsData, activityData] = await Promise.all([
          getAdminStats(),
          getAdminUsers(5, 0),
          getAdminWorkspaces(5, 0),
          getAdminActivity(15),
        ]);
        setStats(statsData);
        setRecentUsers(usersData.users);
        setRecentWorkspaces(wsData.workspaces);
        setActivity(activityData.activity);
      } catch (error) {
        console.error('Failed to load admin data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const statCards = stats ? [
    { name: 'Total Users', value: stats.total_users, icon: UsersIcon, color: 'from-blue-500 to-cyan-500', href: '/admin/users' },
    { name: 'Workspaces', value: stats.total_workspaces, icon: Squares2X2Icon, color: 'from-purple-500 to-violet-500', href: '/admin/workspaces' },
    { name: 'Agents', value: `${stats.active_agents}/${stats.total_agents}`, icon: CpuChipIcon, color: 'from-emerald-500 to-teal-500', href: '/admin/agents', sub: 'active / total' },
    { name: 'Conversations', value: stats.total_conversations, icon: ChatBubbleLeftRightIcon, color: 'from-amber-500 to-orange-500', href: '/admin/conversations' },
    { name: 'Documents', value: stats.total_documents, icon: DocumentTextIcon, color: 'from-red-500 to-pink-500', href: '/admin/documents' },
    { name: 'Messages', value: stats.total_messages, icon: ChartBarIcon, color: 'from-indigo-500 to-blue-500', href: '/admin' },
    { name: 'API Keys', value: stats.total_api_keys, icon: KeyIcon, color: 'from-yellow-500 to-amber-500', href: '/admin/api-keys' },
  ] : [];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-gray-400 text-sm mt-1">All data across every workspace on the platform.</p>
      </motion.div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map(i => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={card.href}>
                  <div className="group bg-zinc-900/80 border border-white/[0.08] rounded-2xl p-5 hover:border-white/[0.15] hover:shadow-lg transition-all cursor-pointer relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} bg-opacity-15`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-0.5">{card.name}</p>
                    <p className="text-2xl font-bold text-white">{card.value}</p>
                    {'sub' in card && card.sub && (
                      <p className="text-[10px] text-gray-500 mt-0.5">{card.sub}</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Two column: Recent Users + Recent Workspaces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900/80 border border-white/[0.08] rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-blue-400" />
              Recent Users
            </h3>
            <Link href="/admin/users" className="text-[11px] text-gray-500 hover:text-white transition-colors">View all →</Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {u.full_name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.full_name || 'Unnamed'}</p>
                  <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                  u.email_verified
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {u.email_verified ? 'Verified' : 'Pending'}
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && !isLoading && (
              <div className="px-5 py-8 text-center text-xs text-gray-500">No users found</div>
            )}
          </div>
        </motion.div>

        {/* Recent Workspaces */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-zinc-900/80 border border-white/[0.08] rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Squares2X2Icon className="w-4 h-4 text-purple-400" />
              Workspaces
            </h3>
            <Link href="/admin/workspaces" className="text-[11px] text-gray-500 hover:text-white transition-colors">View all →</Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentWorkspaces.map((ws) => (
              <div key={ws.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {ws.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{ws.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{ws.owner_email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-[10px] text-gray-500 shrink-0">
                  <span title="Agents">{ws.agent_count} agents</span>
                  <span title="Documents">{ws.document_count} docs</span>
                </div>
              </div>
            ))}
            {recentWorkspaces.length === 0 && !isLoading && (
              <div className="px-5 py-8 text-center text-xs text-gray-500">No workspaces found</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-zinc-900/80 border border-white/[0.08] rounded-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-4 h-4 text-amber-400" />
            Recent Activity
          </h3>
        </div>
        <div className="divide-y divide-white/5">
          {activity.length === 0 && !isLoading && (
            <div className="px-5 py-8 text-center text-xs text-gray-500">No recent activity</div>
          )}
          {activity.map((item, i) => (
            <Link
              key={`${item.type}-${item.id}-${i}`}
              href={item.type === 'conversation' ? `/admin/conversations/${item.id}` : item.type === 'document' ? `/admin/documents/${item.id}` : `/admin/agents/${item.id}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03] transition-colors"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                item.type === 'conversation' ? 'bg-blue-500/10' : item.type === 'document' ? 'bg-red-500/10' : 'bg-emerald-500/10'
              }`}>
                {item.type === 'conversation' ? <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-blue-400" /> : item.type === 'document' ? <DocumentTextIcon className="w-3.5 h-3.5 text-red-400" /> : <CpuChipIcon className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{item.label}</p>
              </div>
              <span className="text-[10px] text-gray-600 shrink-0">
                {item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}
              </span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
