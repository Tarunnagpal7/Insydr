'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getAdminUsers, AdminUser } from '@/src/features/admin/admin.service';
import { TableRowSkeleton } from '@/src/components/ui/Skeleton';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAdminUsers(200, 0);
        setUsers(data.users);
        setTotal(data.total);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, []);

  const filtered = search
    ? users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase()))
    : users;

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-gray-400 text-sm mt-1">{total} registered users on the platform</p>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900/80 border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">User</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Email</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Last Login</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                [1,2,3,4,5].map(i => <TableRowSkeleton key={i} cols={5} />)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-xs text-gray-500">No users found</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} onClick={() => router.push(`/admin/users/${u.id}`)} className="hover:bg-white/[0.05] transition-colors cursor-pointer">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {u.full_name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white">{u.full_name || 'Unnamed'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-400">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      u.email_verified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {u.email_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
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
