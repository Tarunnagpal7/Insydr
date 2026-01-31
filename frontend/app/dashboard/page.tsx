'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/src/store/hooks';
import { fetchWorkspaces } from '@/src/store/workspace.store';
import Header from '@/src/components/layout/Header';
import Spinner from '@/src/components/ui/Spinner';
import {
  ArrowRightIcon,
  Squares2X2Icon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { workspaces, isLoading } = useAppSelector((state) => state.workspace);

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  // Calculate global stats
  const totalAgents = workspaces.reduce((sum, w) => sum + (w.stats?.total_agents || 0), 0);
  const totalConversations = workspaces.reduce((sum, w) => sum + (w.stats?.total_conversations || 0), 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Fluid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Header */}
      <Header />

      {/* Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-400 text-lg">
            Here's an overview of your account
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-600/20 rounded-xl">
                <Squares2X2Icon className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Workspaces</p>
                <p className="text-3xl font-bold text-white">{workspaces.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600/20 rounded-xl">
                <UserGroupIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Agents</p>
                <p className="text-3xl font-bold text-white">{totalAgents}</p>
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-600/20 rounded-xl">
                <ChartBarIcon className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Conversations</p>
                <p className="text-3xl font-bold text-white">{totalConversations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Workspaces Section */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-red-600 rounded-full" />
              Your Workspaces
            </h2>
            <Link
              href="/workspaces"
              className="text-sm text-red-500 hover:text-red-400 font-medium flex items-center gap-1"
            >
              View All
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" className="text-red-500" />
            </div>
          ) : workspaces.length === 0 ? (
            <div className="text-center py-12">
              <Squares2X2Icon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No workspaces yet</h3>
              <p className="text-gray-500 mb-6">Create your first workspace to get started</p>
              <Link
                href="/workspaces"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-red-900/20"
              >
                Go to Workspaces
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.slice(0, 6).map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/workspace/${workspace.id}`}
                  className="group flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-red-500/50 hover:bg-white/10 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold shadow-lg shadow-red-900/20 group-hover:scale-110 transition-transform">
                    {workspace.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate group-hover:text-red-400 transition-colors">
                      {workspace.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {workspace.stats?.total_agents || 0} agents
                    </p>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-gray-500 group-hover:text-red-500 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
