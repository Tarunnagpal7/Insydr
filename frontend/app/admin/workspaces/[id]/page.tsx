'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, UsersIcon, CpuChipIcon, DocumentTextIcon, KeyIcon, FolderIcon } from '@heroicons/react/24/outline';
import { getAdminWorkspaceDetail, AdminWorkspaceDetail } from '@/src/features/admin/admin.service';

export default function AdminWorkspaceDetailPage() {
  const params = useParams();
  const [ws, setWs] = useState<AdminWorkspaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'members' | 'agents' | 'documents' | 'keys' | 'collections'>('members');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAdminWorkspaceDetail(params.id as string);
        setWs(data);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, [params.id]);

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!ws) return <div className="text-center py-20"><p className="text-gray-400">Workspace not found</p></div>;

  const tabs = [
    { key: 'members', label: 'Members', count: ws.members.length, icon: UsersIcon },
    { key: 'agents', label: 'Agents', count: ws.agents.length, icon: CpuChipIcon },
    { key: 'documents', label: 'Documents', count: ws.documents.length, icon: DocumentTextIcon },
    { key: 'keys', label: 'API Keys', count: ws.api_keys.length, icon: KeyIcon },
    { key: 'collections', label: 'Collections', count: ws.collections.length, icon: FolderIcon },
  ] as const;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Link href="/admin/workspaces" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Workspaces
      </Link>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-xl font-bold text-white">
            {ws.name[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{ws.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{ws.slug} · Owner: {ws.owner_email}</p>
          </div>
        </div>
      </motion.div>

      {/* Info */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Plan</p>
          <p className="text-sm font-semibold text-white uppercase">{ws.subscription_tier}</p>
        </div>
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Members</p>
          <p className="text-sm font-semibold text-white">{ws.members.length}</p>
        </div>
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Agents</p>
          <p className="text-sm font-semibold text-white">{ws.agents.length}</p>
        </div>
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Documents</p>
          <p className="text-sm font-semibold text-white">{ws.documents.length}</p>
        </div>
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Created</p>
          <p className="text-sm font-semibold text-white">{ws.created_at ? new Date(ws.created_at).toLocaleDateString() : '—'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.06] pb-0">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${tab === t.key ? 'border-red-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
              <Icon className="w-4 h-4" /> {t.label} <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded-full">{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-zinc-900/80 border border-white/[0.08] rounded-2xl overflow-hidden">
        {tab === 'members' && (
          <table className="w-full">
            <thead><tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">User</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Email</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Role</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Joined</th>
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {ws.members.map(m => (
                <tr key={m.user_id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-sm text-white">{m.full_name}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">{m.email}</td>
                  <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-gray-300 border border-white/10 uppercase">{m.role}</span></td>
                  <td className="px-5 py-3 text-xs text-gray-500">{m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {ws.members.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-500">No members</td></tr>}
            </tbody>
          </table>
        )}

        {tab === 'agents' && (
          <table className="w-full">
            <thead><tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Agent</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Type</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Status</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Created</th>
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {ws.agents.map(a => (
                <tr key={a.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/agents/${a.id}`}>
                  <td className="px-5 py-3 text-sm font-medium text-white">{a.name}</td>
                  <td className="px-5 py-3 text-xs text-gray-400 capitalize">{a.agent_type?.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${a.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>{a.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-5 py-3 text-xs text-gray-500">{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {ws.agents.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-500">No agents</td></tr>}
            </tbody>
          </table>
        )}

        {tab === 'documents' && (
          <table className="w-full">
            <thead><tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Title</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Type</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Status</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Created</th>
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {ws.documents.map(d => (
                <tr key={d.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/documents/${d.id}`}>
                  <td className="px-5 py-3 text-sm text-white">{d.title}</td>
                  <td className="px-5 py-3 text-xs text-gray-400 uppercase">{d.source_type}</td>
                  <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${d.status === 'processed' || d.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{d.status}</span></td>
                  <td className="px-5 py-3 text-xs text-gray-500">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {ws.documents.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-500">No documents</td></tr>}
            </tbody>
          </table>
        )}

        {tab === 'keys' && (
          <table className="w-full">
            <thead><tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Name</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Prefix</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Status</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Requests</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Last Used</th>
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {ws.api_keys.map(k => (
                <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-sm text-white">{k.name}</td>
                  <td className="px-5 py-3 text-xs text-gray-400 font-mono">{k.key_prefix}...</td>
                  <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${k.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{k.is_active ? 'Active' : 'Revoked'}</span></td>
                  <td className="px-5 py-3 text-sm text-gray-400">{k.requests_count}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}</td>
                </tr>
              ))}
              {ws.api_keys.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-xs text-gray-500">No API keys</td></tr>}
            </tbody>
          </table>
        )}

        {tab === 'collections' && (
          <div className="divide-y divide-white/5">
            {ws.collections.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-gray-500">No collections</div>
            ) : ws.collections.map(c => (
              <div key={c.id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <p className="text-sm font-medium text-white flex items-center gap-2"><FolderIcon className="w-4 h-4 text-amber-400" /> {c.name}</p>
                {c.description && <p className="text-xs text-gray-500 mt-0.5 ml-6">{c.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
