'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { KeyIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getAdminApiKeys, AdminApiKey, revokeAdminApiKey } from '@/src/features/admin/admin.service';
import { TableRowSkeleton } from '@/src/components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<AdminApiKey[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAdminApiKeys(200, 0);
        setKeys(data.api_keys);
        setTotal(data.total);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, []);

  const handleRevoke = async (keyId: string, name: string) => {
    if (!confirm(`Revoke API key "${name}"? This will disable it permanently.`)) return;
    try {
      await revokeAdminApiKey(keyId);
      setKeys(keys.map(k => k.id === keyId ? { ...k, is_active: false } : k));
      toast.success('API key revoked');
    } catch (e) { toast.error('Failed to revoke'); }
  };

  const filtered = search
    ? keys.filter(k => k.name.toLowerCase().includes(search.toLowerCase()) || k.workspace_name.toLowerCase().includes(search.toLowerCase()) || k.key_prefix.toLowerCase().includes(search.toLowerCase()))
    : keys;

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">API Keys</h1>
        <p className="text-gray-400 text-sm mt-1">{total} API keys across all workspaces</p>
      </motion.div>

      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input type="text" placeholder="Search keys..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all" />
      </div>

      <div className="bg-zinc-900/80 border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Key Name</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Prefix</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Workspace</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Status</th>
                <th className="text-center px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Requests</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Last Used</th>
                <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                [1,2,3,4].map(i => <TableRowSkeleton key={i} cols={7} />)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-xs text-gray-500">No API keys found</td></tr>
              ) : filtered.map((k) => (
                <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                        <KeyIcon className="w-4 h-4 text-yellow-400" />
                      </div>
                      <span className="text-sm font-medium text-white">{k.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 font-mono">{k.key_prefix}...</td>
                  <td className="px-5 py-3 text-sm text-gray-400">{k.workspace_name}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${k.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {k.is_active ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-center text-gray-400">{k.requests_count}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}</td>
                  <td className="px-5 py-3 text-right">
                    {k.is_active && (
                      <button onClick={() => handleRevoke(k.id, k.name)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Revoke</button>
                    )}
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
