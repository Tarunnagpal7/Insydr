'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  ArrowUpTrayIcon, 
  DocumentTextIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  EyeIcon,
  GlobeAltIcon,
  PencilSquareIcon,
  FolderIcon,
  BeakerIcon,
  PlusIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckIcon,
  FolderPlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { 
  uploadDocument, getDocuments, deleteDocument, processDocument,
  ingestText, crawlWebsite, moveDocumentToCollection,
  getCollections, createCollection, updateCollection, deleteCollection,
  testQuery,
  Document, Collection, ChunkResult,
} from '@/src/features/knowledge/knowledge.service';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ───
const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.csv', '.md'];
const ACCEPTED_FILES = '.pdf,.docx,.txt,.csv,.md';
const DEFAULT_COLLECTION_ID = "00000000-0000-0000-0000-000000000000";

const SOURCE_TYPE_ICONS: Record<string, string> = {
  pdf: '📄', docx: '📝', text: '📃', markdown: '📑', csv: '📊', web: '🌐', manual_text: '✍️', file: '📁',
};

const STATUS_STYLES: Record<string, string> = {
  processed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  uploaded: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  error_embedding: 'bg-red-500/10 text-red-500 border-red-500/20',
  error_processing: 'bg-red-500/10 text-red-500 border-red-500/20',
  crawling: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

type TabType = 'documents' | 'test';

export default function KnowledgePage() {
  const params = useParams();
  const workspaceId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [activeTab, setActiveTab] = useState<TabType>('documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  
  // Modals
  const [showTextModal, setShowTextModal] = useState(false);
  const [showCrawlModal, setShowCrawlModal] = useState(false);
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
  
  // Drag & Drop
  const [isDragging, setIsDragging] = useState(false);

  // Test Console
  const [testQueryText, setTestQueryText] = useState('');
  const [testCollectionId, setTestCollectionId] = useState<string>('all');
  const [testResults, setTestResults] = useState<ChunkResult[]>([]);
  const [testImprovements, setTestImprovements] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Collections expanded state
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  // Inline rename
  const [renamingCollectionId, setRenamingCollectionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // ─── Data Fetching ───
  const fetchDocs = useCallback(async () => {
    try {
      if (!workspaceId) return;
      const docs = await getDocuments(workspaceId);
      setDocuments(docs);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  const fetchCollections = useCallback(async () => {
    try {
      if (!workspaceId) return;
      const cols = await getCollections(workspaceId);
      setCollections(cols);
    } catch (error) {
      console.error(error);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchDocs();
    fetchCollections();
  }, [fetchDocs, fetchCollections]);

  // ─── File Upload ───
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext);
    });

    if (validFiles.length === 0) {
      toast.error(`No supported files. Accepted: ${SUPPORTED_EXTENSIONS.join(', ')}`);
      return;
    }

    setIsUploading(true);
    let successCount = 0;

    for (const file of validFiles) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }
      const toastId = toast.loading(`Uploading ${file.name}...`);
      try {
        const newDoc = await uploadDocument(workspaceId, DEFAULT_COLLECTION_ID, file);
        setDocuments(prev => [newDoc, ...prev]);
        toast.success(`${file.name} uploaded`, { id: toastId });
        successCount++;
      } catch (error: any) {
        const msg = error.response?.data?.detail || error.message || 'Upload failed';
        toast.error(msg, { id: toastId });
      }
    }

    if (successCount > 0 && validFiles.length > 1) {
      toast.success(`${successCount}/${validFiles.length} files uploaded successfully`);
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  };

  // ─── Drag & Drop ───
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  // ─── Delete ───
  const handleDelete = async (docId: string) => {
    if (!confirm("Delete this document?")) return;
    const toastId = toast.loading("Deleting...");
    try {
      await deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      setSelectedDocs(prev => { const n = new Set(prev); n.delete(docId); return n; });
      toast.success("Deleted", { id: toastId });
    } catch { toast.error("Failed to delete", { id: toastId }); }
  };

  const handleBulkDelete = async () => {
    if (selectedDocs.size === 0) return;
    if (!confirm(`Delete ${selectedDocs.size} document(s)?`)) return;
    const toastId = toast.loading(`Deleting ${selectedDocs.size} documents...`);
    let deleted = 0;
    for (const docId of selectedDocs) {
      try { await deleteDocument(docId); deleted++; } catch {}
    }
    setDocuments(prev => prev.filter(d => !selectedDocs.has(d.id)));
    setSelectedDocs(new Set());
    toast.success(`${deleted} document(s) deleted`, { id: toastId });
  };

  const handleProcess = async (docId: string) => {
    const toastId = toast.loading("Processing embeddings...");
    try {
      const updated = await processDocument(docId);
      setDocuments(prev => prev.map(d => d.id === docId ? updated : d));
      toast.success("Processing complete", { id: toastId });
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Processing failed';
      toast.error(msg, { id: toastId });
    }
  };

  // ─── Create Collection from selected docs ───
  const handleCreateCollectionFromSelection = async (name: string) => {
    if (selectedDocs.size === 0) return;
    const toastId = toast.loading('Creating collection...');
    try {
      const col = await createCollection(workspaceId, name);
      // Move all selected docs into this collection
      for (const docId of selectedDocs) {
        try {
          const updated = await moveDocumentToCollection(docId, col.id);
          setDocuments(prev => prev.map(d => d.id === docId ? updated : d));
        } catch {}
      }
      setSelectedDocs(new Set());
      fetchCollections();
      toast.success(`Collection "${name}" created with ${selectedDocs.size} documents`, { id: toastId });
    } catch { toast.error('Failed to create collection', { id: toastId }); }
  };

  // ─── Remove doc from collection (back to standalone) ───
  const handleRemoveFromCollection = async (docId: string) => {
    const toastId = toast.loading('Removing from collection...');
    try {
      const updated = await moveDocumentToCollection(docId, DEFAULT_COLLECTION_ID);
      setDocuments(prev => prev.map(d => d.id === docId ? updated : d));
      fetchCollections();
      toast.success('Removed from collection', { id: toastId });
    } catch { toast.error('Failed', { id: toastId }); }
  };

  // ─── Rename collection ───
  const handleRenameCollection = async (colId: string) => {
    if (!renameValue.trim()) return;
    try {
      await updateCollection(colId, { name: renameValue.trim() });
      setCollections(prev => prev.map(c => c.id === colId ? { ...c, name: renameValue.trim() } : c));
      setRenamingCollectionId(null);
      setRenameValue('');
      toast.success('Collection renamed');
    } catch { toast.error('Failed to rename'); }
  };

  // ─── Delete collection (docs become standalone) ───
  const handleDeleteCollection = async (colId: string) => {
    if (!confirm('Delete this collection? Documents inside will become standalone files.')) return;
    const toastId = toast.loading('Deleting collection...');
    try {
      // Move all docs in this collection to default first
      const colDocs = documents.filter(d => d.collection_id === colId);
      for (const doc of colDocs) {
        try {
          const updated = await moveDocumentToCollection(doc.id, DEFAULT_COLLECTION_ID);
          setDocuments(prev => prev.map(d => d.id === doc.id ? updated : d));
        } catch {}
      }
      await deleteCollection(colId);
      fetchCollections();
      toast.success('Collection deleted, documents kept as standalone', { id: toastId });
    } catch { toast.error('Failed to delete collection', { id: toastId }); }
  };

  // ─── Toggle collection expand ───
  const toggleCollectionExpand = (colId: string) => {
    setExpandedCollections(prev => {
      const n = new Set(prev);
      if (n.has(colId)) n.delete(colId); else n.add(colId);
      return n;
    });
  };

  // ─── Filtering ───
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.meta?.tags || []).some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || doc.source_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Separate standalone docs and collection-grouped docs
  const standaloneDocs = filteredDocs.filter(d => !d.collection_id || d.collection_id === DEFAULT_COLLECTION_ID);
  const collectionGroups = collections.map(col => ({
    ...col,
    docs: filteredDocs.filter(d => d.collection_id === col.id),
  })).filter(g => g.docs.length > 0 || !searchQuery); // Show empty collections when not searching

  const uniqueTypes = [...new Set(documents.map(d => d.source_type))];
  const uniqueStatuses = [...new Set(documents.map(d => d.status))];

  // ─── Test Query ───
  const handleTestQuery = async () => {
    if (!testQueryText.trim()) return;
    setIsTesting(true);
    setTestImprovements(null);
    try {
      const response = await testQuery(workspaceId, testQueryText, testCollectionId === 'all' ? undefined : testCollectionId);
      setTestResults(response.results);
      setTestImprovements(response.suggested_improvements || null);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Query failed');
    } finally { setIsTesting(false); }
  };

  // ─── Render a single document row ───
  const renderDocRow = (doc: Document, inCollection: boolean = false) => (
    <motion.div
      key={doc.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between p-3 ${inCollection ? 'pl-12' : 'p-4'} bg-white/5 border border-white/10 rounded-xl hover:bg-white/[0.07] transition-colors group`}
    >
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={selectedDocs.has(doc.id)}
          onChange={() => setSelectedDocs(prev => { const n = new Set(prev); n.has(doc.id) ? n.delete(doc.id) : n.add(doc.id); return n; })}
          className="rounded border-gray-600 bg-transparent" />
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-base">
          {SOURCE_TYPE_ICONS[doc.source_type] || '📁'}
        </div>
        <div>
          <h3 className="font-medium text-white text-sm">{doc.title}</h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span className="text-xs text-gray-500 uppercase">{doc.source_type}</span>
            <span className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[doc.status] || STATUS_STYLES.uploaded}`}>
              {(doc.status === 'crawling' || doc.status === 'processing') && (
                <div className="w-3 h-3 border-[1.5px] border-current border-t-transparent rounded-full animate-spin opacity-70" />
              )}
              {doc.status}
            </span>
            {doc.meta?.tags?.slice(0, 2).map((tag: string, i: number) => (
              <span key={i} className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-full border border-white/5">{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {doc.status === 'uploaded' && (
          <button onClick={() => handleProcess(doc.id)} className="p-2 text-gray-300 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Process Embeddings">
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        )}
        {inCollection && (
          <button onClick={() => handleRemoveFromCollection(doc.id)} className="p-2 text-gray-300 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors" title="Remove from collection">
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
        {doc.source_url && (
          <a href={doc.source_url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="View Source">
            <EyeIcon className="w-4 h-4" />
          </a>
        )}
        <button onClick={() => handleDelete(doc.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
          <p className="text-gray-400 text-sm">Manage documents, organize into collections, and test your RAG pipeline.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTextModal(true)} className="flex items-center gap-2 px-3 py-2 bg-zinc-800 text-gray-300 font-medium rounded-lg hover:bg-zinc-700 border border-white/10 transition-colors text-sm">
            <PencilSquareIcon className="w-4 h-4" /> Add Text
          </button>
          <button onClick={() => setShowCrawlModal(true)} className="flex items-center gap-2 px-3 py-2 bg-zinc-800 text-gray-300 font-medium rounded-lg hover:bg-zinc-700 border border-white/10 transition-colors text-sm">
            <GlobeAltIcon className="w-4 h-4" /> Crawl Website
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm">
            {isUploading ? <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <ArrowUpTrayIcon className="w-4 h-4" />}
            Upload Files
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={ACCEPTED_FILES} multiple className="hidden" />
        </div>
      </div>

      {/* Tabs - just Documents and Test Console */}
      <div className="border-b border-white/10">
        <div className="flex gap-6">
          {([
            { id: 'documents' as TabType, label: 'Documents', icon: DocumentTextIcon, count: documents.length },
            { id: 'test' as TabType, label: 'Test Console', icon: BeakerIcon },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-red-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ DOCUMENTS TAB ═══ */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging ? 'border-red-500 bg-red-500/5' : 'border-white/10 hover:border-white/20'
            }`}
          >
            <ArrowUpTrayIcon className="w-8 h-8 mx-auto text-gray-500 mb-2" />
            <p className="text-sm text-gray-400">
              Drag & drop files here or <button onClick={() => fileInputRef.current?.click()} className="text-red-500 hover:underline">browse</button>
            </p>
            <p className="text-xs text-gray-600 mt-1">Supports: PDF, DOCX, TXT, CSV, MD (Max 10MB per file)</p>
          </div>

          {/* Search, Filters & Selection Actions */}
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text" placeholder="Search by title or tags..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500/50"
              />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none">
              <option value="all">All Types</option>
              {uniqueTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none">
              <option value="all">All Status</option>
              {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Selection actions bar */}
          {selectedDocs.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-zinc-900 border border-white/10 rounded-xl">
              <span className="text-sm text-gray-300 mr-2">{selectedDocs.size} selected</span>
              <button onClick={() => setShowCreateCollectionModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors">
                <FolderPlusIcon className="w-4 h-4" /> Create Collection
              </button>
              <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-500 transition-colors">
                <TrashIcon className="w-4 h-4" /> Delete
              </button>
              <button onClick={() => setSelectedDocs(new Set())} className="ml-auto text-xs text-gray-400 hover:text-white">Clear selection</button>
            </div>
          )}

          {/* Document List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Collections (grouped docs) */}
                {collectionGroups.map(group => (
                  <div key={group.id} className="rounded-xl border border-white/10 overflow-hidden">
                    {/* Collection Header */}
                    <div className="flex items-center justify-between p-3 bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                      <button onClick={() => toggleCollectionExpand(group.id)} className="flex items-center gap-3 flex-1 text-left">
                        {expandedCollections.has(group.id)
                          ? <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                          : <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                        }
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <FolderIcon className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          {renamingCollectionId === group.id ? (
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <input
                                type="text" value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleRenameCollection(group.id); if (e.key === 'Escape') setRenamingCollectionId(null); }}
                                className="bg-zinc-800 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                autoFocus
                              />
                              <button onClick={() => handleRenameCollection(group.id)} className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded"><CheckIcon className="w-4 h-4" /></button>
                              <button onClick={() => setRenamingCollectionId(null)} className="p-1 text-gray-400 hover:bg-white/10 rounded"><XMarkIcon className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <>
                              <span className="font-medium text-white text-sm">{group.name}</span>
                              <span className="text-xs text-gray-500 ml-2">{group.docs.length} documents</span>
                            </>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setRenamingCollectionId(group.id); setRenameValue(group.name); }}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Rename">
                          <PencilSquareIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCollection(group.id); }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete collection (keeps documents)">
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Collection Documents */}
                    <AnimatePresence>
                      {expandedCollections.has(group.id) && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="space-y-1 p-2 bg-black/10">
                            {group.docs.length > 0 ? group.docs.map(doc => renderDocRow(doc, true)) : (
                              <p className="text-center text-sm text-gray-500 py-4">No documents in this collection</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {/* Standalone docs (not in any collection) */}
                {standaloneDocs.map(doc => renderDocRow(doc, false))}

                {/* Empty state */}
                {standaloneDocs.length === 0 && collectionGroups.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <DocumentTextIcon className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                    <h3 className="text-lg font-medium text-white mb-1">No documents yet</h3>
                    <p className="text-gray-400 text-sm mb-4">Upload files, add text, or crawl a website to build your knowledge base.</p>
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => fileInputRef.current?.click()} className="text-red-500 hover:text-red-400 font-medium text-sm">Upload Files</button>
                      <span className="text-gray-600">•</span>
                      <button onClick={() => setShowTextModal(true)} className="text-red-500 hover:text-red-400 font-medium text-sm">Add Text</button>
                      <span className="text-gray-600">•</span>
                      <button onClick={() => setShowCrawlModal(true)} className="text-red-500 hover:text-red-400 font-medium text-sm">Crawl Website</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ TEST CONSOLE TAB ═══ */}
      {activeTab === 'test' && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <BeakerIcon className="w-5 h-5 text-red-500" /> Answer Preview
            </h2>
            <p className="text-sm text-gray-400 mb-4">Test queries against your knowledge base to see what chunks are retrieved and their relevance scores.</p>
            <div className="flex gap-3">
              <select
                value={testCollectionId}
                onChange={e => setTestCollectionId(e.target.value)}
                className="bg-zinc-800 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50"
              >
                <option value="all">All Documents</option>
                {collections.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
              <input
                type="text" placeholder="Ask a question about your knowledge base..."
                value={testQueryText} onChange={e => setTestQueryText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTestQuery()}
                className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500/50"
              />
              <button onClick={handleTestQuery} disabled={isTesting || !testQueryText.trim()}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm">
                {isTesting ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {testImprovements && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 flex items-start gap-4">
              <SparklesIcon className="w-6 h-6 text-blue-400 mt-1 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-blue-400 mb-1">AI Suggestion</h3>
                <p className="text-sm text-blue-200 leading-relaxed">{testImprovements}</p>
              </div>
            </div>
          )}

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase">Results ({testResults.length})</h3>
              {testResults.map((result, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white bg-white/10 w-6 h-6 rounded-full flex items-center justify-center">#{i + 1}</span>
                      <span className="text-sm font-medium text-white">{result.document_title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(result.score * 100)}%`, backgroundColor: result.score > 0.7 ? '#10b981' : result.score > 0.4 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className={`text-xs font-mono font-bold ${result.score > 0.7 ? 'text-emerald-500' : result.score > 0.4 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {Math.round(result.score * 100)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed bg-black/20 rounded-lg p-3 border border-white/5">{result.content}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ MODALS ═══ */}
      <AnimatePresence>
        {showTextModal && <TextModal workspaceId={workspaceId} onClose={() => setShowTextModal(false)} onSuccess={(doc) => { setDocuments(prev => [doc, ...prev]); setShowTextModal(false); }} />}
        {showCrawlModal && <CrawlModal workspaceId={workspaceId} onClose={() => setShowCrawlModal(false)} onSuccess={() => { setShowCrawlModal(false); setTimeout(fetchDocs, 3000); }} />}
        {showCreateCollectionModal && (
          <CreateCollectionModal
            selectedCount={selectedDocs.size}
            onClose={() => setShowCreateCollectionModal(false)}
            onSubmit={(name) => { handleCreateCollectionFromSelection(name); setShowCreateCollectionModal(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Create Collection from Selection Modal ───
function CreateCollectionModal({ selectedCount, onClose, onSubmit }: { selectedCount: number; onClose: () => void; onSubmit: (name: string) => void }) {
  const [name, setName] = useState('');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}
        className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><FolderPlusIcon className="w-5 h-5 text-blue-500" /> Create Collection</h2>
        <p className="text-sm text-gray-400 mb-4">{selectedCount} document(s) will be grouped into this collection.</p>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Collection name..." autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSubmit(name.trim()); }}
          className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 mb-4" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 bg-zinc-800 text-gray-300 rounded-lg hover:bg-zinc-700 text-sm transition-colors">Cancel</button>
          <button onClick={() => name.trim() && onSubmit(name.trim())} disabled={!name.trim()} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm transition-colors">Create</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Modals ───

function TextModal({ workspaceId, onClose, onSuccess }: { workspaceId: string; onClose: () => void; onSuccess: (doc: Document) => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const DEFAULT_COLLECTION_ID = "00000000-0000-0000-0000-000000000000";

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Title and content required'); return; }
    setIsSubmitting(true);
    const toastId = toast.loading('Processing text...');
    try {
      const doc = await ingestText(workspaceId, DEFAULT_COLLECTION_ID, title, content, contentType);
      toast.success('Text ingested successfully', { id: toastId });
      onSuccess(doc);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed', { id: toastId });
    } finally { setIsSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}
        className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><PencilSquareIcon className="w-5 h-5 text-red-500" /> Add Text Content</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg"><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Product FAQ" className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50" />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Content Type</label>
            <select value={contentType} onChange={e => setContentType(e.target.value)} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
              <option value="text">Plain Text</option>
              <option value="markdown">Markdown</option>
              <option value="faq">FAQ (Q&A Pairs)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Content</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={10}
              placeholder={contentType === 'faq' ? 'Q: What is your product?\nA: Our product is...\n\nQ: How does pricing work?\nA: Pricing starts at...' : 'Enter your text content here...'}
              className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-red-500/50 resize-y" />
          </div>
          <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm">
            {isSubmitting ? 'Processing...' : 'Add to Knowledge Base'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CrawlModal({ workspaceId, onClose, onSuccess }: { workspaceId: string; onClose: () => void; onSuccess: () => void }) {
  const [url, setUrl] = useState('');
  const [maxDepth, setMaxDepth] = useState(2);
  const [maxPages, setMaxPages] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const DEFAULT_COLLECTION_ID = "00000000-0000-0000-0000-000000000000";

  const handleSubmit = async () => {
    if (!url.trim()) { toast.error('URL required'); return; }
    if (!url.startsWith('http://') && !url.startsWith('https://')) { toast.error('URL must start with http:// or https://'); return; }
    setIsSubmitting(true);
    const toastId = toast.loading('Starting crawl...');
    try {
      const result = await crawlWebsite(workspaceId, DEFAULT_COLLECTION_ID, url, maxDepth, maxPages);
      toast.success(result.message, { id: toastId });
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed', { id: toastId });
    } finally { setIsSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}
        className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><GlobeAltIcon className="w-5 h-5 text-red-500" /> Crawl Website</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg"><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Website URL</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Max Depth (1-5)</label>
              <input type="number" min={1} max={5} value={maxDepth} onChange={e => setMaxDepth(Number(e.target.value))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Max Pages</label>
              <input type="number" min={1} max={100} value={maxPages} onChange={e => setMaxPages(Number(e.target.value))} className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" />
            </div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-xs text-yellow-300">Crawling runs in the background. Crawled pages will automatically be grouped into a new Collection named after the website domain.</p>
          </div>
          <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm">
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Scraping...
              </span>
            ) : 'Start Crawling'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
