'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, CpuChipIcon, ChatBubbleLeftRightIcon, EnvelopeIcon, GlobeAltIcon, FolderIcon } from '@heroicons/react/24/outline';
import { getAdminAgentDetail, AdminAgentDetail, toggleAgentActive } from '@/src/features/admin/admin.service';
import toast from 'react-hot-toast';

export default function AdminAgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<AdminAgentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAdminAgentDetail(params.id as string);
        setAgent(data);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, [params.id]);

  const handleToggle = async () => {
    if (!agent) return;
    setToggling(true);
    try {
      const result = await toggleAgentActive(agent.id);
      setAgent({ ...agent, is_active: result.is_active });
      toast.success(result.is_active ? 'Agent activated' : 'Agent deactivated');
    } catch (e) { toast.error('Failed to toggle'); }
    finally { setToggling(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!agent) return <div className="text-center py-20"><p className="text-gray-400">Agent not found</p></div>;

  const configSections = [
    { label: 'Configuration (LLM)', data: agent.configuration },
    { label: 'Behavior Settings', data: agent.behavior_settings },
    { label: 'Response Config', data: agent.response_config },
    { label: 'Conversation Rules', data: agent.conversation_rules },
  ].filter(s => s.data && Object.keys(s.data).length > 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href="/admin/agents" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Agents
      </Link>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          {agent.avatar_url ? (
            <img src={agent.avatar_url} alt={agent.name} className="w-14 h-14 rounded-2xl object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center">
              <CpuChipIcon className="w-7 h-7 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5 capitalize">{agent.agent_type?.replace(/_/g, ' ')} · {agent.workspace_name}</p>
          </div>
        </div>
        <button onClick={handleToggle} disabled={toggling} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${agent.is_active ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'}`}>
          {toggling ? '...' : agent.is_active ? 'Deactivate' : 'Activate'}
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Status</p>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${agent.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>{agent.is_active ? 'Active' : 'Inactive'}</span>
        </div>
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Conversations</p>
          <p className="text-sm font-semibold text-white">{agent.conversation_count}</p>
        </div>
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Total Messages</p>
          <p className="text-sm font-semibold text-white">{agent.message_count}</p>
        </div>
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Version</p>
          <p className="text-sm font-semibold text-white">{agent.version}</p>
        </div>
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Published</p>
          <p className="text-sm font-semibold text-white">{agent.published_at ? new Date(agent.published_at).toLocaleDateString() : 'Not published'}</p>
        </div>
      </div>

      {/* Messages */}
      {(agent.greeting_message || agent.fallback_message) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {agent.greeting_message && (
            <div className="bg-zinc-900/80 border border-white/[0.08] p-5 rounded-xl">
              <p className="text-[10px] uppercase text-gray-500 mb-2 flex items-center gap-1"><ChatBubbleLeftRightIcon className="w-3 h-3" /> Greeting Message</p>
              <p className="text-sm text-gray-300">{agent.greeting_message}</p>
            </div>
          )}
          {agent.fallback_message && (
            <div className="bg-zinc-900/80 border border-white/[0.08] p-5 rounded-xl">
              <p className="text-[10px] uppercase text-gray-500 mb-2">Fallback Message</p>
              <p className="text-sm text-gray-300">{agent.fallback_message}</p>
            </div>
          )}
        </div>
      )}

      {/* Allowed Domains */}
      {agent.allowed_domains && agent.allowed_domains.length > 0 && (
        <div className="bg-zinc-900/80 border border-white/[0.08] p-5 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-3 flex items-center gap-1"><GlobeAltIcon className="w-3 h-3" /> Allowed Domains</p>
          <div className="flex flex-wrap gap-2">
            {agent.allowed_domains.map((d, i) => (
              <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300">{d}</span>
            ))}
          </div>
        </div>
      )}

      {/* Knowledge Collections */}
      {agent.knowledge_collections.length > 0 && (
        <div className="bg-zinc-900/80 border border-white/[0.08] p-5 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-3 flex items-center gap-1"><FolderIcon className="w-3 h-3" /> Knowledge Collections</p>
          <div className="flex flex-wrap gap-2">
            {agent.knowledge_collections.map(c => (
              <span key={c.id} className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">{c.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Config JSON */}
      {configSections.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">Agent Configuration</h3>
          {configSections.map(section => (
            <div key={section.label} className="bg-zinc-900/80 border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06]">
                <p className="text-xs font-medium text-gray-400">{section.label}</p>
              </div>
              <pre className="px-5 py-4 text-xs text-gray-300 overflow-x-auto max-h-[300px] overflow-y-auto">{JSON.stringify(section.data, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}

      {/* Widget Config */}
      {agent.widget_config && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">Widget Configuration</h3>
          {Object.entries(agent.widget_config).filter(([_, v]) => v && Object.keys(v).length > 0).map(([key, val]) => (
            <div key={key} className="bg-zinc-900/80 border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06]">
                <p className="text-xs font-medium text-gray-400 capitalize">{key}</p>
              </div>
              <pre className="px-5 py-4 text-xs text-gray-300 overflow-x-auto max-h-[300px] overflow-y-auto">{JSON.stringify(val, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
