'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  ChatBubbleLeftRightIcon, 
  CpuChipIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { fetchAgents, createAgent } from '@/src/store/agent.store';
import { CreateAgentPayload } from '@/src/features/agents/agents.service';
import { getDocuments, uploadDocument, Document } from '@/src/features/knowledge/knowledge.service';
import toast from 'react-hot-toast';
import { Dialog, Tab } from '@headlessui/react';
import classNames from 'classnames';

export default function AgentsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const dispatch = useAppDispatch();
  const { agents, isLoading } = useAppSelector((state) => state.agent);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAgentData, setNewAgentData] = useState<Partial<CreateAgentPayload>>({ name: '', description: '', agent_type: 'custom' });
  
  // Knowledge Selection State
  const [knowledgeSource, setKnowledgeSource] = useState<'upload' | 'select'>('upload');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingDocs, setExistingDocs] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  
  // Allowed Domains State
  const [allowedDomains, setAllowedDomains] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      dispatch(fetchAgents(workspaceId));
    }
  }, [dispatch, workspaceId]);

  // Fetch docs when modal opens
  useEffect(() => {
      if (isCreateModalOpen && workspaceId) {
          setIsLoadingDocs(true);
          getDocuments(workspaceId)
              .then(setExistingDocs)
              .catch(() => toast.error("Failed to load documents"))
              .finally(() => setIsLoadingDocs(false));
      }
  }, [isCreateModalOpen, workspaceId]);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentData.name) return;
    
    setIsSubmitting(true);
    const toastId = toast.loading('Creating agent...');

    try {
      let docIdsToLink = [...selectedDocIds];

      // 1. Upload new PDF if present
      if (knowledgeSource === 'upload' && pdfFile) {
         const collectionId = "00000000-0000-0000-0000-000000000000"; 
         const newDoc = await uploadDocument(workspaceId, collectionId, pdfFile);
         if (newDoc && newDoc.id) {
             docIdsToLink.push(newDoc.id);
         }
      }

      // 2. Parse allowed domains
      const domainsList = allowedDomains
        .split(/[,\n]/)
        .map(d => d.trim())
        .filter(d => d.length > 0);

      // 3. Create Agent with linked docs and allowed domains
      const payload: CreateAgentPayload = {
          name: newAgentData.name || 'New Agent',
          description: newAgentData.description || '',
          agent_type: newAgentData.agent_type || 'custom',
          document_ids: docIdsToLink,
          allowed_domains: domainsList
      };

      await dispatch(createAgent({ workspaceId, data: payload })).unwrap();
      
      toast.success('Agent created successfully!', { id: toastId });
      setIsCreateModalOpen(false);
      setNewAgentData({ name: '', description: '', agent_type: 'custom' });
      setPdfFile(null);
      setSelectedDocIds([]);
      setAllowedDomains('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create agent', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDocSelection = (id: string) => {
      setSelectedDocIds(prev => 
         prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
      );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="text-gray-400">Create and manage your AI agents.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-800 text-white font-medium rounded-lg hover:from-red-500 hover:to-red-700 transition-all shadow-lg shadow-red-900/20"
        >
          <PlusIcon className="w-5 h-5" />
          Create New Agent
        </button>
      </div>

      {isLoading && agents.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
            <CpuChipIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">No agents found</h3>
          <p className="text-gray-400 mb-6">Create your first AI agent to get started.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-red-500 hover:text-red-400 font-medium"
          >
            Create an Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div 
              key={agent.id}
              onClick={() => router.push(`/workspace/${workspaceId}/agents/${agent.id}`)}
              className="bg-zinc-900 border border-white/10 rounded-xl p-5 hover:border-red-500/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center text-white">
                   <span className="text-xl font-bold">{agent.name[0]}</span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                  agent.status === 'active' 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}>
                  {agent.status}
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">{agent.name}</h3>
              <p className="text-sm text-gray-400 line-clamp-2 mb-4 h-10">
                {agent.description || 'No description provided.'}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-white/5 pt-4">
                <div className="flex items-center gap-1">
                   <CpuChipIcon className="w-4 h-4" />
                   {agent.version}
                </div>
                <div className="flex items-center gap-1 ml-auto group-hover:text-red-500 transition-colors">
                   <ChatBubbleLeftRightIcon className="w-4 h-4" />
                   Chat
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Agent Modal */}
      <Dialog 
        open={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-xl w-full bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-900 shrink-0">
              <Dialog.Title className="text-lg font-bold text-white">Create New Agent</Dialog.Title>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white">
                 ✕ 
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
            <form id="create-agent-form" onSubmit={handleCreateAgent} className="space-y-6">
              <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                    <input
                    type="text"
                    required
                    value={newAgentData.name}
                    onChange={(e) => setNewAgentData({...newAgentData, name: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500"
                    placeholder="e.g. Support Bot"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                    <textarea
                    value={newAgentData.description}
                    onChange={(e) => setNewAgentData({...newAgentData, description: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500"
                    placeholder="What does this agent do?"
                    rows={2}
                    />
                </div>
              </div>

               <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Knowledge Base</label>
                
                <Tab.Group>
                    <Tab.List className="flex space-x-1 rounded-xl bg-white/5 p-1 mb-4">
                        <Tab className={({ selected }) =>
                            classNames(
                            'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                            'focus:outline-none',
                            selected
                                ? 'bg-zinc-800 text-white shadow'
                                : 'text-gray-400 hover:bg-white/[0.12] hover:text-white'
                            )
                        }
                        onClick={() => setKnowledgeSource('upload')}
                        >
                            Upload New PDF
                        </Tab>
                        <Tab className={({ selected }) =>
                            classNames(
                            'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                            'focus:outline-none',
                            selected
                                ? 'bg-zinc-800 text-white shadow'
                                : 'text-gray-400 hover:bg-white/[0.12] hover:text-white'
                            )
                        }
                        onClick={() => setKnowledgeSource('select')}
                        >
                            Select Existing
                        </Tab>
                    </Tab.List>
                    
                    <Tab.Panels>
                        <Tab.Panel>
                            <div className="relative border border-dashed border-white/20 rounded-lg p-8 text-center hover:bg-white/5 transition-colors cursor-pointer group">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {pdfFile ? (
                                    <div className="flex flex-col items-center justify-center gap-2 text-white">
                                    <DocumentTextIcon className="w-8 h-8 text-red-500" />
                                    <span className="truncate max-w-[200px] font-medium">{pdfFile.name}</span>
                                    <button 
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                                        className="text-xs text-red-400 hover:text-red-300 underline mt-1"
                                    >
                                        Remove
                                    </button>
                                    </div>
                                ) : (
                                    <>
                                    <PlusIcon className="w-10 h-10 text-gray-500 mx-auto mb-3 group-hover:text-white transition-colors" />
                                    <p className="text-sm font-medium text-gray-300">Click to upload a PDF</p>
                                    <p className="text-xs text-gray-500 mt-1">Supports PDF files up to 10MB</p>
                                    </>
                                )}
                            </div>
                        </Tab.Panel>
                        <Tab.Panel>
                            <div className="border border-white/10 rounded-lg bg-black/20 max-h-48 overflow-y-auto">
                                {isLoadingDocs ? (
                                    <div className="p-4 text-center text-gray-500">Loading documents...</div>
                                ) : existingDocs.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">No documents found in knowledge base.</div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {existingDocs.map(doc => (
                                            <div 
                                                key={doc.id} 
                                                onClick={() => toggleDocSelection(doc.id)}
                                                className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors ${selectedDocIds.includes(doc.id) ? 'bg-red-500/10' : ''}`}
                                            >
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedDocIds.includes(doc.id) ? 'bg-red-500 border-red-500 text-white' : 'border-gray-600'}`}>
                                                    {selectedDocIds.includes(doc.id) && <CheckCircleIcon className="w-4 h-4" />}
                                                </div>
                                                <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white truncate">{doc.title}</p>
                                                    <p className="text-xs text-gray-500">{(new Date(doc.created_at)).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
              </div>

              {/* Allowed Domains Section */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                  <GlobeAltIcon className="w-4 h-4" />
                  Allowed Domains
                </label>
                <textarea
                  value={allowedDomains}
                  onChange={(e) => setAllowedDomains(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 font-mono text-sm"
                  placeholder="example.com&#10;app.example.com&#10;localhost:3000"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Enter domains that can embed this widget (one per line). Leave empty to allow all domains.
                </p>
              </div>
            </form>
            </div>

            <div className="p-6 border-t border-white/10 bg-zinc-900 shrink-0 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="create-agent-form"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                  Create Agent
                </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
