'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  ChatBubbleLeftRightIcon, 
  CpuChipIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { fetchAgents, createAgent } from '@/src/store/agent.store';
import { CreateAgentPayload, getAgentLimit, AgentLimitInfo, getAgentTypes, AgentTypeInfo, BehaviorSettings } from '@/src/features/agents/agents.service';
import { getDocuments, uploadDocument, Document } from '@/src/features/knowledge/knowledge.service';
import toast from 'react-hot-toast';
import { Dialog, Tab } from '@headlessui/react';
import classNames from 'classnames';

// Agent type icons/emojis for the selector cards
const AGENT_TYPE_ICONS: Record<string, string> = {
  sales_assistant: '💼',
  customer_support: '🎧',
  hr_assistant: '👥',
  technical_support: '🔧',
  general_knowledge: '📚',
  custom: '⚡',
};

const TONE_OPTIONS = [
  { value: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
  { value: 'professional', label: 'Professional', desc: 'Polished and business-like' },
  { value: 'formal', label: 'Formal', desc: 'Structured and authoritative' },
  { value: 'casual', label: 'Casual', desc: 'Relaxed and laid-back' },
  { value: 'technical', label: 'Technical', desc: 'Precise and detailed' },
];

const STYLE_OPTIONS = [
  { value: 'brief', label: 'Brief', desc: '2-3 sentence answers' },
  { value: 'detailed', label: 'Detailed', desc: 'Thorough explanations' },
  { value: 'conversational', label: 'Conversational', desc: 'Natural dialogue flow' },
  { value: 'structured', label: 'Structured', desc: 'Bullet points & headers' },
];

export default function AgentsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const dispatch = useAppDispatch();
  const { agents, isLoading } = useAppSelector((state) => state.agent);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAgentData, setNewAgentData] = useState<Partial<CreateAgentPayload>>({ name: '', description: '', agent_type: 'custom' });
  
  // Agent Types State
  const [agentTypes, setAgentTypes] = useState<Record<string, AgentTypeInfo>>({});
  const [selectedType, setSelectedType] = useState('custom');
  
  // Behavior Settings State
  const [behaviorSettings, setBehaviorSettings] = useState<BehaviorSettings>({
    tone: 'friendly',
    response_style: 'conversational',
    temperature: 0.5,
  });
  
  // Agent Limit State
  const [limitInfo, setLimitInfo] = useState<AgentLimitInfo | null>(null);
  
  // Knowledge Selection State
  const [knowledgeSource, setKnowledgeSource] = useState<'upload' | 'select'>('upload');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingDocs, setExistingDocs] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  
  // Allowed Domains State
  const [allowedDomains, setAllowedDomains] = useState<string>('');

  // Create modal step (0 = type selection, 1 = details)
  const [createStep, setCreateStep] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      dispatch(fetchAgents(workspaceId));
      fetchLimitInfo();
    }
  }, [dispatch, workspaceId]);
  
  // Fetch agent types on mount
  useEffect(() => {
    getAgentTypes().then(setAgentTypes).catch(console.error);
  }, []);

  const fetchLimitInfo = async () => {
    try {
      const info = await getAgentLimit(workspaceId);
      setLimitInfo(info);
    } catch (e) {
      console.error("Failed to fetch agent limit", e);
    }
  };

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

  // When agent type is selected, auto-apply defaults
  const handleTypeSelect = (typeKey: string) => {
    setSelectedType(typeKey);
    const typeInfo = agentTypes[typeKey];
    if (typeInfo) {
      setBehaviorSettings(typeInfo.default_behavior);
      setNewAgentData(prev => ({
        ...prev,
        agent_type: typeKey,
      }));
    }
  };

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

      // 3. Create Agent with linked docs, allowed domains, and behavior settings
      const payload: CreateAgentPayload = {
          name: newAgentData.name || 'New Agent',
          description: newAgentData.description || '',
          agent_type: selectedType,
          document_ids: docIdsToLink,
          allowed_domains: domainsList,
          behavior_settings: behaviorSettings,
      };

      await dispatch(createAgent({ workspaceId, data: payload })).unwrap();
      
      toast.success('Agent created successfully!', { id: toastId });
      setIsCreateModalOpen(false);
      resetCreateForm();
      fetchLimitInfo();
    } catch (error: any) {
      const message = typeof error === 'string' ? error : error?.message || 'Failed to create agent';
      toast.error(message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setNewAgentData({ name: '', description: '', agent_type: 'custom' });
    setPdfFile(null);
    setSelectedDocIds([]);
    setAllowedDomains('');
    setSelectedType('custom');
    setBehaviorSettings({ tone: 'friendly', response_style: 'conversational', temperature: 0.5 });
    setCreateStep(0);
  };

  const toggleDocSelection = (id: string) => {
      setSelectedDocIds(prev => 
         prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
      );
  };

  const isAtLimit = limitInfo ? !limitInfo.can_create : false;
  const limitLabel = limitInfo 
    ? limitInfo.max_allowed === -1 
      ? `${limitInfo.current_count} agents (Unlimited)`
      : `${limitInfo.current_count} / ${limitInfo.max_allowed} agents`
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="text-gray-400">Create and manage your AI agents.</p>
        </div>
        <div className="flex items-center gap-4">
          {limitLabel && (
            <div className={classNames(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border",
              isAtLimit
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-white/5 text-gray-400 border-white/10"
            )}>
              <CpuChipIcon className="w-3.5 h-3.5" />
              {limitLabel}
              {limitInfo && limitInfo.max_allowed !== -1 && (
                <span className="text-[10px] uppercase tracking-wide opacity-60">
                  {limitInfo.tier}
                </span>
              )}
            </div>
          )}
          
          <button
            onClick={() => {
              if (isAtLimit) {
                toast.error(`Agent limit reached on your ${limitInfo?.tier} plan. Upgrade to create more agents.`);
                return;
              }
              setIsCreateModalOpen(true);
            }}
            disabled={isAtLimit}
            className={classNames(
              "flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-all shadow-lg",
              isAtLimit
                ? "bg-gray-700 text-gray-400 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-red-600 to-red-800 text-white hover:from-red-500 hover:to-red-700 shadow-red-900/20"
            )}
          >
            <PlusIcon className="w-5 h-5" />
            Create New Agent
          </button>
        </div>
      </div>

      {/* Plan Limit Warning */}
      {isAtLimit && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-200 font-medium">Agent limit reached</p>
            <p className="text-xs text-amber-200/60 mt-1">
              Your <span className="font-semibold">{limitInfo?.tier}</span> plan allows up to{' '}
              <span className="font-semibold">{limitInfo?.max_allowed}</span> agent(s).
              Upgrade your plan to create unlimited agents.
            </p>
          </div>
        </div>
      )}

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
                {agent.avatar_url ? (
                  <img 
                    src={agent.avatar_url} 
                    alt={agent.name}
                    className="w-12 h-12 rounded-xl object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center text-2xl">
                     {AGENT_TYPE_ICONS[agent.agent_type] || '⚡'}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {!agent.is_active && (
                    <span className="px-2 py-1 rounded-full text-[10px] font-medium border bg-gray-500/10 text-gray-400 border-gray-500/20 uppercase">
                      Hidden
                    </span>
                  )}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                    agent.is_active 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                      : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}>
                    {agent.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1">{agent.name}</h3>
              <p className="text-xs text-gray-500 mb-2 capitalize">{agent.agent_type?.replace(/_/g, ' ') || 'Custom'}</p>
              <p className="text-sm text-gray-400 line-clamp-2 mb-4 h-10">
                {agent.description || 'No description provided.'}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-white/5 pt-4">
                <div className="flex items-center gap-1">
                   <CpuChipIcon className="w-4 h-4" />
                   {agent.version}
                </div>
                {agent.behavior_settings?.tone && (
                  <div className="flex items-center gap-1 capitalize">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    {agent.behavior_settings.tone}
                  </div>
                )}
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
        onClose={() => { setIsCreateModalOpen(false); resetCreateForm(); }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-900 shrink-0">
              <Dialog.Title className="text-lg font-bold text-white">
                {createStep === 0 ? 'Choose Agent Type' : 'Configure Agent'}
              </Dialog.Title>
              <div className="flex items-center gap-3">
                {/* Step indicator */}
                <div className="flex items-center gap-1.5">
                  <div className={classNames("w-2 h-2 rounded-full", createStep === 0 ? "bg-red-500" : "bg-white/20")} />
                  <div className={classNames("w-2 h-2 rounded-full", createStep === 1 ? "bg-red-500" : "bg-white/20")} />
                </div>
                <button onClick={() => { setIsCreateModalOpen(false); resetCreateForm(); }} className="text-gray-400 hover:text-white">
                   ✕ 
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              {createStep === 0 ? (
                /* ─── STEP 0: Agent Type Selection ─── */
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">Select a template to get started with optimized prompts and behavior settings.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(agentTypes).map(([key, info]) => (
                      <button
                        key={key}
                        onClick={() => handleTypeSelect(key)}
                        className={classNames(
                          "p-4 rounded-xl border text-left transition-all hover:scale-[1.02]",
                          selectedType === key 
                            ? "border-red-500 bg-red-500/10 ring-1 ring-red-500/30" 
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        )}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{AGENT_TYPE_ICONS[key] || '⚡'}</span>
                          <span className="text-sm font-semibold text-white">{info.label}</span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">{info.description}</p>
                        {selectedType === key && (
                          <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-500">
                            <span className="px-2 py-0.5 bg-white/5 rounded-full capitalize">{info.default_behavior.tone}</span>
                            <span className="px-2 py-0.5 bg-white/5 rounded-full capitalize">{info.default_behavior.response_style?.replace(/_/g, ' ') ?? ''}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* ─── STEP 1: Agent Details & Behavior ─── */
                <form id="create-agent-form" onSubmit={handleCreateAgent} className="space-y-6">
                  {/* Selected type badge */}
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-xl">{AGENT_TYPE_ICONS[selectedType] || '⚡'}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{agentTypes[selectedType]?.label || 'Custom'}</p>
                      <p className="text-xs text-gray-500">{agentTypes[selectedType]?.description}</p>
                    </div>
                    <button type="button" onClick={() => setCreateStep(0)} className="ml-auto text-xs text-red-400 hover:text-red-300">
                      Change
                    </button>
                  </div>

                  {/* Name & Description */}
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

                  {/* ─── Behavior & Personality ─── */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <SparklesIcon className="w-4 h-4 text-red-400" />
                      Behavior & Personality
                    </h3>

                    {/* Tone */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Tone</label>
                      <div className="flex flex-wrap gap-2">
                        {TONE_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setBehaviorSettings(prev => ({ ...prev, tone: opt.value }))}
                            className={classNames(
                              "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                              behaviorSettings.tone === opt.value
                                ? "border-red-500 bg-red-500/10 text-red-400"
                                : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Response Style */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Response Style</label>
                      <div className="flex flex-wrap gap-2">
                        {STYLE_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setBehaviorSettings(prev => ({ ...prev, response_style: opt.value }))}
                            className={classNames(
                              "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                              behaviorSettings.response_style === opt.value
                                ? "border-red-500 bg-red-500/10 text-red-400"
                                : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Temperature */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Creativity</label>
                          <span className="text-xs text-gray-400 font-mono">{(behaviorSettings.temperature ?? 0.5).toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-500">Consistent</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={behaviorSettings.temperature}
                          onChange={(e) => setBehaviorSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                          className="flex-1 accent-red-500 h-1.5"
                        />
                        <span className="text-[10px] text-gray-500">Creative</span>
                      </div>
                    </div>
                  </div>

                  {/* Knowledge Base */}
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

                  {/* Allowed Domains */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                      <GlobeAltIcon className="w-4 h-4" />
                      Allowed Domains
                    </label>
                    <textarea
                      value={allowedDomains}
                      onChange={(e) => setAllowedDomains(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 font-mono text-sm"
                      placeholder={"example.com\napp.example.com\nlocalhost:3000"}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Enter domains that can embed this widget (one per line). Leave empty to allow all domains.
                    </p>
                  </div>
                </form>
              )}
            </div>

            <div className="p-6 border-t border-white/10 bg-zinc-900 shrink-0 flex justify-between">
                <div>
                  {createStep === 1 && (
                    <button
                      type="button"
                      onClick={() => setCreateStep(0)}
                      className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                      ← Back
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsCreateModalOpen(false); resetCreateForm(); }}
                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  {createStep === 0 ? (
                    <button
                      type="button"
                      onClick={() => setCreateStep(1)}
                      className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      form="create-agent-form"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting && <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                      Create Agent
                    </button>
                  )}
                </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
