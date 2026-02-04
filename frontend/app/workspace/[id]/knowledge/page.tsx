'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  ArrowUpTrayIcon, 
  DocumentTextIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { uploadDocument, getDocuments, deleteDocument, Document } from '@/src/features/knowledge/knowledge.service';
import toast from 'react-hot-toast';
import { useAppDispatch } from '@/src/store/hooks';

export default function KnowledgePage() {
  const params = useParams();
  const workspaceId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDocs = async () => {
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
  };

  useEffect(() => {
    fetchDocs();
  }, [workspaceId]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading, Processing & Embeding ...');

    try {
      const collectionId = "00000000-0000-0000-0000-000000000000"; 
      
      const newDoc = await uploadDocument(workspaceId, collectionId, file);
      
      setDocuments(prev => [newDoc, ...prev]);
      toast.success('Document processed successfully', { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to upload document', { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (docId: string) => {
      if(!confirm("Are you sure you want to delete this document?")) return;
      
      const toastId = toast.loading("Deleting...");
      try {
          await deleteDocument(docId);
          setDocuments(prev => prev.filter(d => d.id !== docId));
          toast.success("Deleted", { id: toastId });
      } catch (e) {
          toast.error("Failed to delete", { id: toastId });
      }
  };

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
          <p className="text-gray-400">Manage your documents and data sources.</p>
        </div>
        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <ArrowUpTrayIcon className="w-5 h-5" />
          )}
          Upload PDF
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".pdf" 
          className="hidden" 
        />
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
        />
      </div>

      {/* Document List */}
      <div className="grid gap-4">
        {isLoading ? (
             <div className="flex justify-center py-10">
                 <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
        ) : filteredDocs.length > 0 ? (
          filteredDocs.map((doc) => (
            <div 
              key={doc.id}
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500">
                  <DocumentTextIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{doc.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{(new Date(doc.created_at)).toLocaleDateString()}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 capitalize">
                      {doc.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {doc.source_url && (
                    <a 
                        href={doc.source_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-gray-500 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
                        title="View PDF"
                    >
                        <EyeIcon className="w-5 h-5" />
                    </a>
                  )}
                  <button 
                    onClick={() => handleDelete(doc.id)}
                    className="text-gray-500 hover:text-red-500 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
              <DocumentTextIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No documents yet</h3>
            <p className="text-gray-400 mb-4">Upload a PDF to get started with your knowledge base.</p>
            <button
               onClick={handleUploadClick}
               className="text-red-500 hover:text-red-400 font-medium"
            >
              Upload your first document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
