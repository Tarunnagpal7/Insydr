'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CpuChipIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getAdminAgents, AdminAgent } from '@/src/features/admin/admin.service';
import { TableRowSkeleton } from '@/src/components/ui/Skeleton';
import { useRouter } from 'next/navigation';

const AGENT_TYPE_ICONS: Record<string, string> = {
  sales_assistant: '💼',
  customer_support: '🎧',
  hr_assistant: '👥',
  technical_support: '🔧',
  general_knowledge: '📚',
  custom: '⚡',
};

export default function AdminAgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAdminAgents(200, 0);
        setAgents(data.agents);
        setTotal(data.total);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, []);

  const filtered = search
    ? agents.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.workspace_name.toLowerCase().includes(search.toLowerCase()))
    : agents;

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Agents</h1>
        <p className="text-gray-400 text-sm mt-1">{total} agents across all workspaces</p>
      </motion.div>

      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
        />
      </div>

      <div className="bg-zinc-900/80 border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Agent</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Type</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Workspace</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Status</th>
                <th className="text-center px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Conversations</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                [1,2,3,4,5].map(i => <TableRowSkeleton key={i} cols={6} />)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-xs text-gray-500">No agents found</td></tr>
              ) : filtered.map((agent) => (
                <tr key={agent.id} onClick={() => router.push(`/admin/agents/${agent.id}`)} className="hover:bg-white/[0.05] transition-colors cursor-pointer">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center text-lg shrink-0">
                        {AGENT_TYPE_ICONS[agent.agent_type] || '⚡'}
                      </div>
                      <span className="text-sm font-medium text-white">{agent.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 capitalize">{agent.agent_type?.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">{agent.workspace_name}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      agent.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}>
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-center text-gray-400">{agent.conversation_count}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
