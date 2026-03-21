'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChatBubbleLeftRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getAdminConversations, AdminConversation } from '@/src/features/admin/admin.service';
import { TableRowSkeleton } from '@/src/components/ui/Skeleton';

import { useRouter } from 'next/navigation';

export default function AdminConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAdminConversations(200, 0);
        setConversations(data.conversations);
        setTotal(data.total);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, []);

  const filtered = search
    ? conversations.filter(c => c.agent_name.toLowerCase().includes(search.toLowerCase()) || c.hostname?.toLowerCase().includes(search.toLowerCase()) || c.session_id.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Conversations</h1>
        <p className="text-gray-400 text-sm mt-1">{total} conversations across the platform</p>
      </motion.div>

      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search by agent, hostname..."
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
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Hostname</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Status</th>
                <th className="text-center px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Messages</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Session</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                [1,2,3,4,5].map(i => <TableRowSkeleton key={i} cols={6} />)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-xs text-gray-500">No conversations found</td></tr>
              ) : filtered.map((conv) => (
                <tr 
                  key={conv.id} 
                  onClick={() => router.push(`/admin/conversations/${conv.id}`)}
                  className="hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{conv.agent_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-400">{conv.hostname || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      conv.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}>
                      {conv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-center text-gray-400">{conv.message_count}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 font-mono truncate max-w-[120px]" title={conv.session_id}>{conv.session_id.slice(0, 12)}...</td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {conv.started_at ? new Date(conv.started_at).toLocaleString() : '—'}
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
