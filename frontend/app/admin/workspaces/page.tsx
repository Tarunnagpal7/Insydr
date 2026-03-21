'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Squares2X2Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getAdminWorkspaces, AdminWorkspace } from '@/src/features/admin/admin.service';
import { TableRowSkeleton } from '@/src/components/ui/Skeleton';
import { useRouter } from 'next/navigation';

export default function AdminWorkspacesPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAdminWorkspaces(200, 0);
        setWorkspaces(data.workspaces);
        setTotal(data.total);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, []);

  const filtered = search
    ? workspaces.filter(ws => ws.name.toLowerCase().includes(search.toLowerCase()) || ws.owner_email.toLowerCase().includes(search.toLowerCase()))
    : workspaces;

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Workspaces</h1>
        <p className="text-gray-400 text-sm mt-1">{total} workspaces across the platform</p>
      </motion.div>

      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search workspaces..."
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
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Workspace</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Owner</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Plan</th>
                <th className="text-center px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Agents</th>
                <th className="text-center px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Docs</th>
                <th className="text-center px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Convos</th>
                <th className="text-center px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Members</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                [1,2,3,4].map(i => <TableRowSkeleton key={i} cols={8} />)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-xs text-gray-500">No workspaces found</td></tr>
              ) : filtered.map((ws) => (
                <tr key={ws.id} onClick={() => router.push(`/admin/workspaces/${ws.id}`)} className="hover:bg-white/[0.05] transition-colors cursor-pointer">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {ws.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{ws.name}</p>
                        <p className="text-[10px] text-gray-500">{ws.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-gray-300">{ws.owner_name}</p>
                    <p className="text-[10px] text-gray-500">{ws.owner_email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-gray-300 border border-white/10 uppercase tracking-wide">
                      {ws.subscription_tier}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-center text-gray-400">{ws.agent_count}</td>
                  <td className="px-5 py-3 text-sm text-center text-gray-400">{ws.document_count}</td>
                  <td className="px-5 py-3 text-sm text-center text-gray-400">{ws.conversation_count}</td>
                  <td className="px-5 py-3 text-sm text-center text-gray-400">{ws.member_count}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {ws.created_at ? new Date(ws.created_at).toLocaleDateString() : '—'}
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
