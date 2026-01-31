'use client';

import { useAppSelector } from '@/src/store/hooks';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function WorkspaceDashboard() {
  const params = useParams();
  const workspaceId = params.id as string;
  const { currentWorkspace } = useAppSelector((state) => state.workspace);
  const { user } = useAppSelector((state) => state.auth);

  if (!currentWorkspace) return null;

  const stats = currentWorkspace.stats || {
    total_agents: 0,
    total_documents: 0,
    total_conversations: 0,
    total_messages: 0,
  };

  const statCards = [
    {
      name: 'Total Agents',
      value: stats.total_agents,
      icon: ChatBubbleLeftRightIcon,
      href: `/workspace/${workspaceId}/agents`,
      color: 'bg-blue-500',
    },
    {
      name: 'Documents',
      value: stats.total_documents,
      icon: DocumentTextIcon,
      href: `/workspace/${workspaceId}/knowledge`,
      color: 'bg-green-500',
    },
    {
      name: 'Conversations',
      value: stats.total_conversations,
      icon: ChartBarIcon,
      href: `/workspace/${workspaceId}/analytics`,
      color: 'bg-purple-500',
    },
    {
      name: 'Messages',
      value: stats.total_messages,
      icon: ClockIcon,
      href: `/workspace/${workspaceId}/analytics`,
      color: 'bg-orange-500',
    },
  ];

  const quickActions = [
    {
      title: 'Create New Agent',
      description: 'Set up a new AI agent for your use case',
      href: `/workspace/${workspaceId}/agents/new`,
      icon: ChatBubbleLeftRightIcon,
      color: 'from-red-600 to-red-800',
    },
    {
      title: 'Upload Documents',
      description: "Add knowledge to your agent's training data",
      href: `/workspace/${workspaceId}/knowledge`,
      icon: DocumentTextIcon,
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="group bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-red-500/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-xl shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-1">{stat.name}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-red-600 rounded-full" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="group p-6 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-red-500/50 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-red-400 transition-colors">
                  {action.title}
                </h4>
                <p className="text-sm text-gray-400">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Activity Placeholder */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-purple-600 rounded-full" />
          Recent Activity
        </h3>
        <div className="text-center py-12">
          <ClockIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-white mb-2">No activity yet</h4>
          <p className="text-gray-500 mb-6">Create your first agent to start seeing activity</p>
          <Link
            href={`/workspace/${workspaceId}/agents/new`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-red-900/20"
          >
            Create Agent
          </Link>
        </div>
      </div>
    </div>
  );
}
