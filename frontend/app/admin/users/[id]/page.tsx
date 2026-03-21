'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, EnvelopeIcon, ShieldCheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getAdminUserDetail, AdminUserDetail, deleteAdminUser } from '@/src/features/admin/admin.service';
import toast from 'react-hot-toast';

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAdminUserDetail(params.id as string);
        setUser(data);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, [params.id]);

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm(`Are you sure you want to delete user "${user.full_name || user.email}"? This action cannot be undone.`)) return;
    try {
      await deleteAdminUser(user.id);
      toast.success('User deleted');
      router.push('/admin/users');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to delete user');
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <div className="text-center py-20"><p className="text-gray-400">User not found</p></div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Users
      </Link>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-xl font-bold text-white">
            {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{user.full_name || 'Unnamed'}</h1>
            <p className="text-gray-400 text-sm flex items-center gap-2 mt-0.5">
              <EnvelopeIcon className="w-3.5 h-3.5" /> {user.email}
            </p>
          </div>
        </div>
        {user.email !== 'admin@gmail.com' && (
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm hover:bg-red-500/20 transition-colors">
            <TrashIcon className="w-4 h-4" /> Delete User
          </button>
        )}
      </motion.div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Status</p>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${user.email_verified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
            {user.email_verified ? 'Verified' : 'Pending'}
          </span>
        </div>
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Last Login</p>
          <p className="text-sm font-medium text-white">{user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}</p>
        </div>
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Joined</p>
          <p className="text-sm font-medium text-white">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</p>
        </div>
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Workspaces</p>
          <p className="text-sm font-medium text-white">{user.owned_workspaces.length} owned · {user.memberships.length} member</p>
        </div>
      </div>

      {/* Owned Workspaces */}
      <div className="bg-zinc-900/80 border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><ShieldCheckIcon className="w-4 h-4 text-purple-400" /> Owned Workspaces</h3>
        </div>
        <div className="divide-y divide-white/5">
          {user.owned_workspaces.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-gray-500">No owned workspaces</div>
          ) : user.owned_workspaces.map(ws => (
            <Link key={ws.id} href={`/admin/workspaces/${ws.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-xs font-bold text-white">{ws.name[0]?.toUpperCase()}</div>
                <div>
                  <p className="text-sm font-medium text-white">{ws.name}</p>
                  <p className="text-[10px] text-gray-500">{ws.slug}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-gray-300 border border-white/10 uppercase">{ws.subscription_tier}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Memberships */}
      <div className="bg-zinc-900/80 border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Workspace Memberships</h3>
        </div>
        <div className="divide-y divide-white/5">
          {user.memberships.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-gray-500">No memberships</div>
          ) : user.memberships.map(m => (
            <Link key={m.workspace_id} href={`/admin/workspaces/${m.workspace_id}`} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.03] transition-colors">
              <p className="text-sm text-white">{m.workspace_name}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="uppercase">{m.role}</span>
                <span>{m.joined_at ? new Date(m.joined_at).toLocaleDateString() : ''}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
