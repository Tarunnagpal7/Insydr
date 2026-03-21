'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, UserIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { getAdminConversationDetail, AdminConversationDetail } from '@/src/features/admin/admin.service';

export default function AdminConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [conv, setConv] = useState<AdminConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAdminConversationDetail(params.id as string);
        setConv(data);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!conv) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Conversation not found</p>
        <button onClick={() => router.back()} className="mt-4 text-red-500 hover:text-red-400">Go back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/admin/conversations" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Conversations
      </Link>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Conversation View
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
              conv.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
            }`}>
              {conv.status}
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Session: <span className="font-mono">{conv.session_id}</span></p>
        </div>
      </motion.div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Agent / Workspace</p>
          <p className="text-sm font-medium text-white">{conv.agent_name}</p>
          <p className="text-[11px] text-gray-400 truncate">{conv.workspace_name}</p>
        </div>
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Visitor Info</p>
          <p className="text-sm font-medium text-white">{conv.user_ip || 'Unknown IP'}</p>
          <p className="text-[11px] text-gray-400 truncate" title={conv.user_agent || ''}>{conv.user_agent || 'Unknown browser'}</p>
        </div>
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Page context</p>
          <p className="text-sm font-medium text-white">{conv.hostname || 'Unknown host'}</p>
          <p className="text-[11px] text-gray-400 truncate" title={conv.page_title || ''}>{conv.page_title || 'No title'}</p>
        </div>
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Timeline</p>
          <p className="text-sm font-medium text-white">{conv.started_at ? new Date(conv.started_at).toLocaleString() : '—'}</p>
          <p className="text-[11px] text-gray-400">{conv.ended_at ? `Ended: ${new Date(conv.ended_at).toLocaleTimeString()}` : 'Ongoing'}</p>
        </div>
      </div>

      {/* Chat Transcript */}
      <div className="bg-zinc-900/80 border border-white/[0.08] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-6">Chat Transcript</h3>
        <div className="space-y-6">
          {conv.messages.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No messages in this conversation yet.</p>
          ) : (
            conv.messages.map((msg, i) => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <CpuChipIcon className="w-4 h-4 text-blue-400" />
                  </div>
                )}
                
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-red-600' : 'bg-white/10'} rounded-2xl px-4 py-3`}>
                  <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                  
                  {msg.role !== 'user' && (
                    <div className="mt-2 flex gap-3 text-[10px] text-gray-400 border-t border-white/10 pt-2">
                      {msg.confidence_score && <span>Score: {msg.confidence_score.toFixed(2)}</span>}
                      {msg.token_count && <span>Tokens: {msg.token_count}</span>}
                      {msg.response_time_ms && <span>Time: {msg.response_time_ms}ms</span>}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4 text-gray-300" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
