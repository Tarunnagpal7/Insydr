'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DocumentTextIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getAdminDocuments, AdminDocument } from '@/src/features/admin/admin.service';
import { TableRowSkeleton } from '@/src/components/ui/Skeleton';

import { useRouter } from 'next/navigation';

export default function AdminDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAdminDocuments(200, 0);
        setDocuments(data.documents);
        setTotal(data.total);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, []);

  const filtered = search
    ? documents.filter(d => d.title.toLowerCase().includes(search.toLowerCase()) || d.workspace_name.toLowerCase().includes(search.toLowerCase()))
    : documents;

  const sourceIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'url':
      case 'web': return '🌐';
      case 'crawl': return '🕷';
      default: return '📋';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Documents</h1>
        <p className="text-gray-400 text-sm mt-1">{total} documents across all workspaces</p>
      </motion.div>

      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search documents..."
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
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Document</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Type</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Workspace</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                [1,2,3,4,5].map(i => <TableRowSkeleton key={i} cols={5} />)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-xs text-gray-500">No documents found</td></tr>
              ) : filtered.map((doc) => (
                <tr 
                  key={doc.id} 
                  onClick={() => router.push(`/admin/documents/${doc.id}`)}
                  className="hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{sourceIcon(doc.source_type)}</span>
                      <span className="text-sm font-medium text-white group-hover:text-red-400 transition-colors truncate max-w-[200px]">{doc.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 uppercase">{doc.source_type}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">{doc.workspace_name}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      doc.status === 'processed' || doc.status === 'ready'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : doc.status === 'processing'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}
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
