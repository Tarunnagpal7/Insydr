'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, DocumentIcon, LinkIcon, ServerStackIcon } from '@heroicons/react/24/outline';
import { getAdminDocumentDetail, AdminDocumentDetail } from '@/src/features/admin/admin.service';

export default function AdminDocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<AdminDocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAdminDocumentDetail(params.id as string);
        setDoc(data);
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

  if (!doc) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Document not found</p>
        <button onClick={() => router.back()} className="mt-4 text-red-500 hover:text-red-400">Go back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href="/admin/documents" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Documents
      </Link>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <DocumentIcon className="w-6 h-6 text-red-400" />
            {doc.title}
          </h1>
          <p className="text-gray-400 text-sm mt-1">ID: <span className="font-mono">{doc.id}</span></p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
          doc.status === 'processed' || doc.status === 'ready'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : doc.status === 'processing'
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        }`}>
          {doc.status.toUpperCase()}
        </span>
      </motion.div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl flex items-center gap-3">
          <ServerStackIcon className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-[10px] uppercase text-gray-500 mb-0.5">Workspace</p>
            <p className="text-sm font-medium text-white truncate max-w-[150px]" title={doc.workspace_name}>{doc.workspace_name}</p>
          </div>
        </div>
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl flex items-center gap-3">
          <LinkIcon className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-[10px] uppercase text-gray-500 mb-0.5">Source Type / URL</p>
            <p className="text-sm font-medium text-white uppercase">{doc.source_type}</p>
            {doc.source_url && (
              <p className="text-[11px] text-gray-400 truncate max-w-[150px]">
                <a href={doc.source_url} target="_blank" rel="noreferrer" className="hover:text-red-400 hover:underline">{doc.source_url}</a>
              </p>
            )}
            {doc.file_path && (
              <p className="text-[11px] text-gray-400 truncate max-w-[150px]">File: {doc.file_path.split('/').pop()}</p>
            )}
          </div>
        </div>
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Processing Info</p>
          <p className="text-sm font-medium text-white">Version: {doc.version_number}</p>
          <p className="text-[11px] text-gray-400">Language: {doc.language || 'Unknown'}</p>
        </div>
        <div className="bg-zinc-900/80 border border-white/[0.08] p-4 rounded-xl">
          <p className="text-[10px] uppercase text-gray-500 mb-1">Timeline</p>
          <p className="text-sm font-medium text-white">Created: {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}</p>
          <p className="text-[11px] text-gray-400">Updated: {doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : '—'}</p>
        </div>
      </div>

      {/* Raw Chunks */}
      <div className="bg-zinc-900/80 border border-white/[0.08] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
          Document Content Chunks
          <span className="bg-white/10 text-gray-300 px-2.5 py-0.5 rounded-full text-xs">{doc.chunks.length} total chunks</span>
        </h3>
        
        <div className="space-y-4">
          {doc.chunks.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10 border border-dashed border-white/10 rounded-xl">No content chunks generated for this document.</p>
          ) : (
            doc.chunks.map((chunk) => (
              <div key={chunk.id} className="border border-white/5 bg-zinc-950/50 rounded-xl p-4 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
                  <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">Chunk #{chunk.chunk_index}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest">{chunk.token_count} tokens</span>
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{chunk.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
