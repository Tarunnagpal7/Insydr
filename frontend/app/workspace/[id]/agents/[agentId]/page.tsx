'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Agent, getAgent, updateAgent, chatWithAgent, deleteAgent, uploadAgentAvatar, deleteAgentAvatar, toggleAgentActive, sendCtaEmailOtp, verifyCtaEmailOtp, ResponseConfig, ConversationRules } from '@/src/features/agents/agents.service';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, Bot, Save, Code, Settings, MessageSquare, Layout, Palette, Zap, Copy, Globe, Shield, CheckCircle, Terminal, ExternalLink, Layers, X, AlertCircle, Camera, Trash2, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import { Tab } from '@headlessui/react';
import classNames from 'classnames';
import ReactMarkdown from 'react-markdown';
import { getCollections, getDocuments, Collection, Document as KBDocument } from '@/src/features/knowledge/knowledge.service';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface WidgetSettings {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left';
  welcomeMessage: string;

  showPoweredBy: boolean;
}

const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
  theme: 'auto',
  primaryColor: '#EF4444', // Red-500
  position: 'bottom-right',
  welcomeMessage: 'Hello! How can I help you today?',

  showPoweredBy: true,
};

export default function AgentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;
  const workspaceId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Widget Customization State
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>(DEFAULT_WIDGET_SETTINGS);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Settings State
  const [domainInput, setDomainInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Avatar State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // CTA Email State
  const [ctaEmailInput, setCtaEmailInput] = useState('');
  const [ctaOtpInput, setCtaOtpInput] = useState('');
  const [ctaOtpSent, setCtaOtpSent] = useState(false);
  const [ctaSending, setCtaSending] = useState(false);
  const [ctaVerifying, setCtaVerifying] = useState(false);
  
  // Toggle State
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  // Guardrails Inputs
  const [topicInput, setTopicInput] = useState('');
  const [blockedWordInput, setBlockedWordInput] = useState('');

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (agentId) {
      loadAgent();
    }
  }, [agentId]);

  useEffect(() => {
    if (messages.length) scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAgent = async () => {
    try {
      setLoading(true);
      const data = await getAgent(agentId);
      setAgent(data);
      if (data.configuration && data.configuration.widget_settings) {
        setWidgetSettings({ ...DEFAULT_WIDGET_SETTINGS, ...data.configuration.widget_settings });
      } else {
        setWidgetSettings({ ...DEFAULT_WIDGET_SETTINGS });
      }
    } catch (error) {
      toast.error('Failed to load agent details');
      router.push(`/workspace/${workspaceId}/agents`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = () => {
    if (!domainInput || !agent) return;
    try {
        let domain = domainInput.trim().toLowerCase();
        // Clean input
        domain = domain.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
        
        if (!domain.includes('.')) {
             toast.error("Please enter a valid domain (e.g. example.com)");
             return;
        }

        const currentDomains = agent.allowed_domains || [];
        if (!currentDomains.includes(domain)) {
            setAgent({
                ...agent,
                allowed_domains: [...currentDomains, domain]
            });
            setHasUnsavedChanges(true);
            setDomainInput('');
            toast.success("Domain added");
        } else {
             toast.error("Domain already filtered");
        }
    } catch (e) {
        toast.error("Invalid domain format");
    }
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    if (!agent) return;
    setAgent({
        ...agent,
        allowed_domains: (agent.allowed_domains || []).filter(d => d !== domainToRemove)
    });
    setHasUnsavedChanges(true);
  };

  const handleDeleteAgent = async () => {
      if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) return;
      setIsDeleting(true);
      const toastId = toast.loading("Deleting agent...");
      try {
          await deleteAgent(agentId);
          toast.success("Agent deleted", { id: toastId });
          router.push(`/workspace/${workspaceId}/agents`);
      } catch (e) {
          toast.error("Failed to delete agent", { id: toastId });
          setIsDeleting(false);
      }
  };

  const handleSaveSettings = async () => {
      if (!agent) return;

      // Flush pending inputs directly into the save payload
      let updatedRules = { ...(agent.conversation_rules || {}) };
      let rulesChanged = false;

      if (topicInput.trim()) {
          updatedRules.allowed_topics = [...(updatedRules.allowed_topics || []), topicInput.trim()];
          setTopicInput('');
          rulesChanged = true;
      }
      if (blockedWordInput.trim()) {
          updatedRules.blocked_words = [...(updatedRules.blocked_words || []), blockedWordInput.trim()];
          setBlockedWordInput('');
          rulesChanged = true;
      }

      const agentToSave = rulesChanged ? { ...agent, conversation_rules: updatedRules } : agent;
      if (rulesChanged) {
          setAgent(agentToSave);
      }

      const toastId = toast.loading("Saving changes...");
      try {
          const updatedConfig = {
              ...agentToSave.configuration,
              widget_settings: widgetSettings
          };
          
          await updateAgent(agentToSave.id, {
              name: agentToSave.name,
              description: agentToSave.description,
              configuration: updatedConfig,
              behavior_settings: agentToSave.behavior_settings,
              response_config: agentToSave.response_config,
              conversation_rules: agentToSave.conversation_rules,
              allowed_domains: agentToSave.allowed_domains,
              is_active: agentToSave.is_active,
          });
          
          setHasUnsavedChanges(false);
          toast.success("Settings saved", { id: toastId });
      } catch (e) {
          toast.error("Failed to save settings", { id: toastId });
      }
  };

  // Avatar Upload Handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !agent) return;

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
          toast.error('Please upload a JPEG, PNG, WebP, or GIF image');
          return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
          toast.error('Avatar must be under 5MB');
          return;
      }

      setIsUploadingAvatar(true);
      const toastId = toast.loading('Uploading avatar...');
      try {
          const updated = await uploadAgentAvatar(agent.id, file);
          setAgent({ ...agent, avatar_url: updated.avatar_url });
          toast.success('Avatar updated!', { id: toastId });
      } catch (err) {
          toast.error('Failed to upload avatar', { id: toastId });
      } finally {
          setIsUploadingAvatar(false);
          // Reset input so the same file can be re-uploaded
          if (avatarInputRef.current) avatarInputRef.current.value = '';
      }
  };

  const handleDeleteAvatar = async () => {
      if (!agent || !agent.avatar_url) return;
      const toastId = toast.loading('Removing avatar...');
      try {
          const updated = await deleteAgentAvatar(agent.id);
          setAgent({ ...agent, avatar_url: null });
          toast.success('Avatar removed', { id: toastId });
      } catch (err) {
          toast.error('Failed to remove avatar', { id: toastId });
      }
  };

  // Toggle Active/Inactive
  const handleToggleActive = async () => {
      if (!agent) return;
      setIsTogglingActive(true);
      try {
          const updated = await toggleAgentActive(agent.id);
          setAgent({ ...agent, is_active: updated.is_active, status: updated.status });
          toast.success(updated.is_active ? 'Agent is now active and visible on websites' : 'Agent is now inactive and hidden from websites');
      } catch (err) {
          toast.error('Failed to toggle agent status');
      } finally {
          setIsTogglingActive(false);
      }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = await chatWithAgent(agentId, userMessage.content);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast.error('Failed to send message');
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  // Widget Preview Component
  const WidgetPreview = () => (
      <div className="relative w-full h-[500px] bg-gray-100 rounded-xl overflow-hidden border border-gray-300 shadow-inner flex items-center justify-center">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          {/* Mock Website Content */}
          <div className="absolute top-10 left-10 right-10 opacity-30 pointer-events-none">
              <div className="h-8 w-32 bg-gray-300 rounded mb-8"></div>
              <div className="h-4 w-full bg-gray-300 rounded mb-2"></div>
              <div className="h-4 w-2/3 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
          </div>

          {/* Widget Container - Positioned */}
          <div className={classNames(
              "absolute flex gap-4 transition-all duration-500",
              {
                  'flex-col items-end bottom-6 right-6': widgetSettings.position === 'bottom-right',
                  'flex-row-reverse items-end bottom-6 left-6': widgetSettings.position === 'bottom-left',
              }
          )}>
              {/* Chat Window (Open State Simulation) */}
              <div className={classNames(
                  "w-[320px] h-[400px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 border border-gray-200",
                  widgetSettings.position === 'bottom-left' ? "origin-bottom-left" : "origin-bottom-right"
              )}>
                  {/* Header */}
                  <div className="p-4 text-white flex items-center gap-3" style={{ backgroundColor: widgetSettings.primaryColor }}>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div>
                          <p className="font-semibold text-sm">{agent?.name}</p>
                          <div className="flex items-center gap-1.5 opacity-80">
                             <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                             <span className="text-xs">Online</span>
                          </div>
                      </div>
                  </div>
                  
                  {/* Body */}
                  <div className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-3">
                      <div className="flex justify-start">
                          <div className="bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-none p-3 text-sm shadow-sm max-w-[85%]">
                              {widgetSettings.welcomeMessage}
                          </div>
                      </div>
                       <div className="flex justify-end">
                          <div className="text-white rounded-2xl rounded-tr-none p-3 text-sm shadow-sm max-w-[85%]" style={{ backgroundColor: widgetSettings.primaryColor }}>
                              Can you help me with pricing?
                          </div>
                      </div>
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-gray-100 bg-white">
                      <div className="bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-500 flex justify-between items-center">
                          <span>Type a message...</span>
                          <Send className="w-4 h-4 ml-2 opacity-50" />
                      </div>
                      {widgetSettings.showPoweredBy && (
                        <div className="text-center mt-2">
                             <p className="text-[10px] text-gray-400">Powered by <span className="font-bold">Insydr</span></p>
                        </div>
                      )}
                  </div>
              </div>

               {/* Launcher */}
              <div className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform" style={{ backgroundColor: widgetSettings.primaryColor }}>
                 <MessageSquare className="w-7 h-7 text-white" />
              </div>
          </div>
      </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Sparkles className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!agent) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6 bg-zinc-950 overflow-x-hidden">
        <Tab.Group as="div" className="flex flex-col h-full min-h-0">
            {/* Header with Tabs */}
            <div className="sticky -top-2 shrink-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b border-white/5 px-6 pt-6 pb-0">
                <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.back()}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        {/* Agent Avatar in Header */}
                        {agent.avatar_url ? (
                            <img src={agent.avatar_url} alt={agent.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                                <span className="text-sm font-bold text-white">{agent.name[0]}</span>
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                {agent.name}
                                <span className={classNames(
                                    "px-2 py-0.5 rounded-full text-xs border uppercase",
                                    agent.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-gray-500/10 border-gray-500/20 text-gray-500' 
                                )}>{agent.is_active ? 'Active' : 'Inactive'}</span>
                            </h1>
                            <p className="text-xs text-gray-400 mt-0.5">Edit, customize, and integrate your agent.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Active/Inactive Toggle */}
                        <button
                            onClick={handleToggleActive}
                            disabled={isTogglingActive}
                            className={classNames(
                                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                                agent.is_active 
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                    : "bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20"
                            )}
                        >
                            <Power className="w-4 h-4" />
                            {isTogglingActive ? 'Toggling...' : agent.is_active ? 'Active' : 'Inactive'}
                        </button>
                        {hasUnsavedChanges && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={handleSaveSettings}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg shadow-red-900/20 text-sm font-medium transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                Save Changes
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-white/10">
                    <Tab.List className="flex space-x-6">
                        {['Playground', 'Customization', 'Integration', 'Knowledge', 'Settings'].map((tab) => (
                            <Tab
                                key={tab}
                                className={({ selected }) =>
                                    classNames(
                                        'py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none',
                                        selected
                                            ? 'border-red-500 text-white'
                                            : 'border-transparent text-gray-400 hover:text-gray-300'
                                    )
                                }
                            >
                                {tab}
                            </Tab>
                        ))}
                    </Tab.List>
                </div>
            </div>

            {/* Tab Content - Perfectly contained within the flex column */}
            <div className="flex-1  flex flex-col min-h-0">
                <Tab.Panels className="flex-1 flex flex-col min-h-0">
                <Tab.Panel className="flex-1 flex gap-6 p-6 focus:outline-none w-full min-h-0">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex-1 flex gap-6 min-h-0 w-full"
                        >
                         {/* Left Info */}
                         <div className="w-1/3 min-h-0 bg-zinc-900 border border-white/10 rounded-2xl p-6 flex flex-col justify-between gap-10 overflow-y-auto">
                            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-4">
                                <div className="flex items-center gap-3">
                                    {agent.avatar_url ? (
                                        <img src={agent.avatar_url} alt={agent.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center" style={{ backgroundImage: `linear-gradient(to bottom right, ${widgetSettings.primaryColor}, #000)` }}>
                                            <Bot className="w-6 h-6 text-white" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg font-semibold text-white truncate">{agent.name}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                           <span className={classNames("w-2 h-2 rounded-full", agent.is_active ? 'bg-emerald-500' : 'bg-gray-500')}></span>
                                           <span className="text-xs text-gray-400 capitalize">{agent.is_active ? 'Active' : 'Inactive'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase font-medium">Description</label>
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                    {agent.description || "No description provided."}
                                    </p>
                                </div>

                                <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 uppercase font-medium">Model</label>
                                        <div className="text-sm text-gray-300 font-mono bg-black/50 px-2 py-1 rounded inline-block border border-white/10">
                                        {agent.configuration?.model || "Standard"}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 uppercase font-medium">Agent Type</label>
                                        <div className="text-sm text-gray-300 capitalize">
                                        {agent.agent_type || "Custom"}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 uppercase font-medium">Tone</label>
                                        <div className="text-sm text-gray-300 capitalize">
                                        {agent.behavior_settings?.tone || "Friendly"}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 uppercase font-medium">Style</label>
                                        <div className="text-sm text-gray-300 capitalize">
                                        {agent.behavior_settings?.response_style || "Conversational"}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1 flex justify-between items-center bg-black/30 p-2 rounded">
                                    <span className="text-xs text-gray-500 uppercase font-medium">Creativity (Temp)</span>
                                    <span className="text-sm text-gray-300 font-mono">
                                    {(agent.behavior_settings?.temperature ?? 0.5).toFixed(1)}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-black/30 border border-white/5 mt-auto text-center">
                                <h3 className="text-sm font-semibold text-gray-300 mb-2">Ready to integrate?</h3>
                                <p className="text-xs text-gray-500 mb-3">Copy this Agent ID when configuring the Insydr.AI widget on your site.</p>
                                <code className="block bg-black/50 p-2 text-center rounded text-xs text-gray-400 font-mono select-all border border-white/10 overflow-hidden text-ellipsis">
                                    {agent.id}
                                </code>
                            </div>
                         </div>
                         
                         {/* Chat Interface */}
                         <div className="flex-1 min-h-0 bg-zinc-900 border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between" style={{ backgroundColor: widgetSettings.primaryColor }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                      {agent.avatar_url ? (
                                        <img src={agent.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                                      ) : (
                                        <Bot className="w-5 h-5 text-white" />
                                      )}
                                    </div>
                                    <div>
                                        <span className="font-medium text-white block leading-tight">{agent.name}</span>
                                        <span className="text-[10px] text-white/80 uppercase tracking-wide">Test Playground</span>
                                    </div>
                                </div>
                                <span className="text-[10px] text-white/80 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                    Gemini Powered
                                </span>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-zinc-900 scroll-smooth">
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: widgetSettings.primaryColor }}>
                                            <MessageSquare className="w-8 h-8" />
                                        </div>
                                        <p className="text-gray-400 text-sm max-w-xs">Send a message to test how `{agent.name}` responds based on its configuration and knowledge base.</p>
                                    </div>
                                )}
                                {/* Render Welcome Message if provided */}
                                {messages.length === 0 && widgetSettings.welcomeMessage && (
                                    <div className="flex justify-start">
                                        <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-zinc-800 text-gray-200 rounded-tl-none border border-white/5 shadow-sm">
                                            {widgetSettings.welcomeMessage}
                                        </div>
                                    </div>
                                )}
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div 
                                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user' ? 'text-white rounded-tr-none' : 'bg-zinc-800 text-gray-200 rounded-tl-none border border-white/5'}`}
                                            style={msg.role === 'user' ? { backgroundColor: widgetSettings.primaryColor } : {}}
                                        >
                                            {msg.role === 'assistant' ? (
                                                <div className="prose prose-invert prose-sm max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2 [&>ul]:pl-4 [&>ol]:pl-4 [&>li]:mb-1 [&>h1]:text-base [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-sm [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mb-1 [&>blockquote]:border-l-2 [&>blockquote]:border-white/20 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-gray-400 [&>pre]:bg-black/40 [&>pre]:rounded-lg [&>pre]:p-3 [&>pre]:overflow-x-auto [&_code]:bg-black/30 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&>pre_code]:bg-transparent [&>pre_code]:p-0">
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {sending && (
                                     <div className="flex justify-start">
                                         <div className="bg-zinc-800 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 shadow-sm">
                                             <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                             <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                             <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                         </div>
                                     </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-zinc-950">
                                <div className="flex items-center gap-2">
                                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-light" />
                                    <button 
                                        type="submit" 
                                        disabled={!input.trim() || sending} 
                                        className="disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                                        style={{ backgroundColor: (!input.trim() || sending) ? '#52525b' : widgetSettings.primaryColor }}
                                    >
                                        <Send className="w-5 h-5 ml-1" />
                                    </button>
                                </div>
                                {widgetSettings.showPoweredBy && (
                                    <div className="text-center mt-3">
                                        <p className="text-[10px] text-gray-500">Powered by <span className="font-bold">Insydr.AI</span></p>
                                    </div>
                                )}
                            </form>
                         </div>
                    </motion.div>
                </Tab.Panel>

                {/* 2. Customization Panel */}
                <Tab.Panel className="h-full p-6 focus:outline-none overflow-y-auto">
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-6 min-h-full">
                        {/* Settings Form */}
                        <div className="w-1/3 space-y-6 pb-20 pr-2">
                             
                             {/* Section: Branding */}
                             <div className="space-y-4">
                                 <h3 className="text-sm font-semibold text-gray-400 uppercase flex items-center gap-2">
                                     <Palette className="w-4 h-4" /> Branding
                                 </h3>
                                 <div className="space-y-3">

                                     <div>
                                         <label className="block text-sm text-gray-300 mb-1">Primary Color</label>
                                         <div className="flex items-center gap-3">
                                             <input 
                                                type="color" 
                                                value={widgetSettings.primaryColor}
                                                onChange={(e) => {
                                                    setWidgetSettings(p => ({ ...p, primaryColor: e.target.value }));
                                                    setHasUnsavedChanges(true);
                                                }}
                                                className="h-9 w-14 bg-transparent cursor-pointer rounded overflow-hidden" 
                                             />
                                             <span className="text-sm text-gray-500 font-mono">{widgetSettings.primaryColor}</span>
                                         </div>
                                     </div>
                                      <div>
                                         <label className="block text-sm text-gray-300 mb-1">Theme</label>
                                         <select 
                                            value={widgetSettings.theme}
                                            onChange={(e) => {
                                                setWidgetSettings(p => ({ ...p, theme: e.target.value as any }));
                                                setHasUnsavedChanges(true);
                                            }}
                                            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-red-500 outline-none"
                                         >
                                             <option value="auto">Auto (System)</option>
                                             <option value="light">Light</option>
                                             <option value="dark">Dark</option>
                                         </select>
                                     </div>
                                 </div>
                             </div>

                             {/* Section: Layout */}
                             <div className="space-y-4 pt-4 border-t border-white/5">
                                 <h3 className="text-sm font-semibold text-gray-400 uppercase flex items-center gap-2">
                                     <Layout className="w-4 h-4" /> Layout
                                 </h3>
                                 <div className="grid grid-cols-2 gap-3">
                                     {['bottom-right', 'bottom-left'].map((pos) => (
                                         <button
                                             key={pos}
                                             onClick={() => {
                                                 setWidgetSettings(p => ({ ...p, position: pos as any }));
                                                 setHasUnsavedChanges(true);
                                             }}
                                             className={classNames(
                                                 "p-3 rounded-lg border text-sm text-center capitalize transition-all",
                                                 widgetSettings.position === pos 
                                                    ? "bg-red-600/10 border-red-500 text-red-500" 
                                                    : "bg-zinc-800 border-white/5 text-gray-400 hover:bg-zinc-700"
                                             )}
                                         >
                                             {pos.replace('-', ' ')}
                                         </button>
                                     ))}
                                 </div>
                             </div>

                             {/* Section: Behavior & Personality */}
                             <div className="space-y-4 pt-4 border-t border-white/5">
                                 <h3 className="text-sm font-semibold text-gray-400 uppercase flex items-center gap-2">
                                     <Zap className="w-4 h-4" /> Behavior & Personality
                                 </h3>
                                  <div>
                                     <label className="block text-sm text-gray-300 mb-1">Welcome Message</label>
                                     <textarea 
                                        rows={2}
                                        value={widgetSettings.welcomeMessage}
                                        onChange={(e) => {
                                            setWidgetSettings(p => ({ ...p, welcomeMessage: e.target.value }));
                                            setHasUnsavedChanges(true);
                                        }}
                                        className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-red-500 outline-none resize-none" 
                                     />
                                 </div>

                                 {/* Tone */}
                                 <div>
                                     <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Tone</label>
                                     <div className="flex flex-wrap gap-1.5">
                                         {['friendly', 'professional', 'formal', 'casual', 'technical'].map(t => (
                                             <button
                                                 key={t}
                                                 type="button"
                                                 onClick={() => {
                                                     if (!agent) return;
                                                     setAgent({...agent, behavior_settings: { ...(agent.behavior_settings || {}), tone: t }});
                                                     setHasUnsavedChanges(true);
                                                 }}
                                                 className={classNames(
                                                     "px-2.5 py-1.5 rounded-md text-[11px] font-medium border capitalize transition-all",
                                                     agent?.behavior_settings?.tone === t
                                                         ? "border-red-500 bg-red-500/10 text-red-400"
                                                         : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                                                 )}
                                             >
                                                 {t}
                                             </button>
                                         ))}
                                     </div>
                                 </div>

                                 {/* Response Style */}
                                 <div>
                                     <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Response Style</label>
                                     <div className="flex flex-wrap gap-1.5">
                                         {['brief', 'detailed', 'conversational', 'structured'].map(s => (
                                             <button
                                                 key={s}
                                                 type="button"
                                                 onClick={() => {
                                                     if (!agent) return;
                                                     setAgent({...agent, behavior_settings: { ...(agent.behavior_settings || {}), response_style: s }});
                                                     setHasUnsavedChanges(true);
                                                 }}
                                                 className={classNames(
                                                     "px-2.5 py-1.5 rounded-md text-[11px] font-medium border capitalize transition-all",
                                                     agent?.behavior_settings?.response_style === s
                                                         ? "border-red-500 bg-red-500/10 text-red-400"
                                                         : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                                                 )}
                                             >
                                                 {s}
                                             </button>
                                         ))}
                                     </div>
                                 </div>

                                 {/* Temperature */}
                                 <div>
                                     <div className="flex items-center justify-between mb-1">
                                         <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Creativity</label>
                                         <span className="text-xs text-gray-400 font-mono">{(agent?.behavior_settings?.temperature ?? 0.5).toFixed(1)}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <span className="text-[9px] text-gray-500">Precise</span>
                                         <input
                                             type="range"
                                             min="0"
                                             max="1"
                                             step="0.1"
                                             value={agent?.behavior_settings?.temperature ?? 0.5}
                                             onChange={(e) => {
                                                 if (!agent) return;
                                                 setAgent({...agent, behavior_settings: { ...(agent.behavior_settings || {}), temperature: parseFloat(e.target.value) }});
                                                 setHasUnsavedChanges(true);
                                             }}
                                             className="flex-1 accent-red-500 h-1.5"
                                         />
                                         <span className="text-[9px] text-gray-500">Creative</span>
                                     </div>
                                 </div>

                                 {/* Custom Prompt */}
                                 <div>
                                     <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Custom Instructions</label>
                                     <textarea
                                         rows={3}
                                         value={agent?.configuration?.custom_prompt || ''}
                                         onChange={(e) => {
                                             if (!agent) return;
                                             setAgent({...agent, configuration: { ...(agent.configuration || {}), custom_prompt: e.target.value }});
                                             setHasUnsavedChanges(true);
                                         }}
                                         placeholder="Add custom instructions for your agent... e.g. 'Always recommend our Pro plan when users ask about pricing.'"
                                         className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-red-500 outline-none resize-none"
                                     />
                                     <p className="text-[10px] text-gray-500 mt-1">These instructions are appended to the agent's system prompt.</p>
                                 </div>

                                  <div className="flex items-center gap-3">
                                      <input 
                                        type="checkbox" 
                                        id="showPoweredBy"
                                        checked={widgetSettings.showPoweredBy}
                                        onChange={(e) => {
                                            setWidgetSettings(p => ({ ...p, showPoweredBy: e.target.checked }));
                                            setHasUnsavedChanges(true);
                                        }}
                                        className="rounded border-gray-600 bg-zinc-800 text-red-600 focus:ring-red-600"
                                      />
                                      <label htmlFor="showPoweredBy" className="text-sm text-gray-300">Show "Powered by Insydr"</label>
                                  </div>
                             </div>

                        </div>

                        {/* Preview Area */}
                        <div className="flex-1  bg-zinc-900 border border-white/10 rounded-2xl p-6 flex flex-col">
                            <h2 className="text-lg font-semibold text-white mb-4">Live Preview</h2>
                            <WidgetPreview />
                            <p className="mt-4 text-center text-xs text-gray-500">This is how your widget will appear on your website.</p>
                        </div>
                     </motion.div>
                </Tab.Panel>

                {/* 3. Integration Panel - Premium Redesign */}
                <Tab.Panel className="h-full p-6 focus:outline-none overflow-y-auto">
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-6 pb-8">
                         
                         {/* Left Column - Main Content */}
                         <div className="flex-1 space-y-6">
                             {/* Hero Section */}
                             <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-900/30 via-zinc-900 to-zinc-900 border border-red-500/20 p-8">
                                 <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                 <div className="relative">
                                     <div className="flex items-center gap-4 mb-4">
                                         <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/30">
                                             <Code className="w-7 h-7 text-white" />
                                         </div>
                                         <div>
                                             <h2 className="text-2xl font-bold text-white">Integrate Your Agent</h2>
                                             <p className="text-gray-400">Add this AI agent to your website with one line of code</p>
                                         </div>
                                     </div>
                                     <div className="flex items-center gap-6 mt-6">
                                         <div className="flex items-center gap-2 text-sm text-gray-400">
                                             <CheckCircle className="w-4 h-4 text-emerald-500" />
                                             <span>No coding required</span>
                                         </div>
                                         <div className="flex items-center gap-2 text-sm text-gray-400">
                                             <CheckCircle className="w-4 h-4 text-emerald-500" />
                                             <span>Works instantly</span>
                                         </div>
                                         <div className="flex items-center gap-2 text-sm text-gray-400">
                                             <CheckCircle className="w-4 h-4 text-emerald-500" />
                                             <span>Fully customizable</span>
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             {/* Embed Code Section */}
                             <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                                 <div className="px-5 py-4 border-b border-white/10 bg-black/30 flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                                             <Terminal className="w-4 h-4 text-red-400" />
                                         </div>
                                         <div>
                                             <span className="text-sm font-semibold text-white">Embed Code</span>
                                             <p className="text-xs text-gray-500">Copy and paste into your website</p>
                                         </div>
                                     </div>
                                     <button 
                                        onClick={() => {
                                            const code = `<script src="http://localhost:5173/widget.js" data-agent-id="${agentId}" data-api-key="YOUR_API_KEY" data-api-base="http://localhost:8000/api/v1" defer></script>`;
                                            navigator.clipboard.writeText(code);
                                            toast.success("Copied to clipboard!");
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-red-900/20 hover:shadow-red-900/30"
                                     >
                                         <Copy className="w-4 h-4" />
                                         Copy Code
                                     </button>
                                 </div>
                                 <div className="p-5 bg-black/60 font-mono text-sm">
                                     <div className="flex items-start gap-3">
                                         <span className="text-gray-600 select-none">1</span>
                                         <pre className="text-gray-300 whitespace-pre-wrap break-all">
                                             <span className="text-purple-400">&lt;script</span>{'\n'}
                                             <span className="text-cyan-400 ml-4">src</span>=<span className="text-emerald-400">"http://localhost:5173/widget.js"</span>{'\n'}
                                             <span className="text-cyan-400 ml-4">data-agent-id</span>=<span className="text-emerald-400">"{agentId}"</span>{'\n'}
                                             <span className="text-cyan-400 ml-4">data-api-key</span>=<span className="text-emerald-400">"YOUR_API_KEY"</span>{'\n'}
                                             <span className="text-cyan-400 ml-4">data-api-base</span>=<span className="text-emerald-400">"http://localhost:8000/api/v1"</span>{'\n'}
                                             <span className="text-cyan-400 ml-4">defer</span>{'\n'}
                                             <span className="text-purple-400">&gt;&lt;/script&gt;</span>
                                         </pre>
                                     </div>
                                 </div>
                                 <div className="px-5 py-3 border-t border-white/5 bg-zinc-900/50 flex items-center gap-2 text-xs text-gray-500">
                                     <Zap className="w-3.5 h-3.5 text-yellow-500" />
                                     Paste this before the closing <code className="px-1.5 py-0.5 bg-white/5 rounded text-gray-400">&lt;/body&gt;</code> tag
                                 </div>
                             </div>

                             {/* Security / Domain Section */}
                             <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                                 <div className="flex items-center gap-3 mb-4">
                                     <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                         <Shield className="w-4 h-4 text-emerald-400" />
                                     </div>
                                     <div>
                                         <h3 className="text-sm font-semibold text-white">Domain Security</h3>
                                         <p className="text-xs text-gray-500">Control where your widget can be embedded</p>
                                     </div>
                                 </div>
                                 
                                 {agent.allowed_domains && agent.allowed_domains.length > 0 ? (
                                     <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                         <div className="flex items-center gap-2 mb-3">
                                             <CheckCircle className="w-4 h-4 text-emerald-500" />
                                             <span className="text-sm text-emerald-400 font-medium">Domain restrictions enabled</span>
                                         </div>
                                         <div className="flex flex-wrap gap-2">
                                             {agent.allowed_domains.map((domain, idx) => (
                                                 <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-mono">
                                                     <Globe className="w-3.5 h-3.5" />
                                                     {domain}
                                                 </span>
                                             ))}
                                         </div>
                                     </div>
                                 ) : (
                                     <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                         <div className="flex items-start gap-3">
                                             <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
                                                 <Zap className="w-4 h-4 text-amber-500" />
                                             </div>
                                             <div>
                                                 <p className="text-sm text-amber-400 font-medium">No domain restrictions</p>
                                                 <p className="text-xs text-gray-400 mt-1">This widget can be embedded on any website. Configure allowed domains in agent settings for enhanced security.</p>
                                             </div>
                                         </div>
                                     </div>
                                 )}
                             </div>
                         </div>

                         {/* Right Column - Quick Info */}
                         <div className="w-80 space-y-6">
                             {/* Agent ID Card */}
                             <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                                 <div className="flex items-center gap-3 mb-4">
                                     <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                         <Layers className="w-4 h-4 text-purple-400" />
                                     </div>
                                     <span className="text-sm font-semibold text-white">Agent Details</span>
                                 </div>
                                 <div className="space-y-3">
                                     <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                         <label className="text-[10px] text-gray-500 uppercase font-medium">Agent ID</label>
                                         <p className="text-xs font-mono text-gray-300 mt-1 break-all select-all">{agent.id}</p>
                                     </div>
                                     <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                         <label className="text-[10px] text-gray-500 uppercase font-medium">Status</label>
                                         <div className="flex items-center gap-2 mt-1">
                                             <span className={classNames("w-2 h-2 rounded-full", agent.is_active ? 'bg-emerald-500' : 'bg-gray-500')} />
                                             <span className="text-xs text-gray-300 capitalize">{agent.is_active ? 'Active' : 'Inactive'}</span>
                                         </div>
                                     </div>
                                     <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                         <label className="text-[10px] text-gray-500 uppercase font-medium">Model</label>
                                         <p className="text-xs text-gray-300 mt-1">{agent.configuration?.model || 'Gemini'}</p>
                                     </div>
                                 </div>
                             </div>

                             {/* How It Works */}
                             <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                                 <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                     <Sparkles className="w-4 h-4 text-red-500" />
                                     How It Works
                                 </h3>
                                 <div className="space-y-4 relative">
                                     <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-red-500/50 via-red-500/20 to-transparent" />
                                     {[
                                         { icon: Terminal, title: 'Script Loads', desc: 'Browser fetches widget.js' },
                                         { icon: Globe, title: 'Initialize', desc: 'Widget connects to Insydr' },
                                         { icon: Shield, title: 'Validate', desc: 'Domain verification' },
                                         { icon: MessageSquare, title: 'Ready', desc: 'Chat widget activates' },
                                     ].map((item, idx) => (
                                         <div key={idx} className="flex items-start gap-3 relative z-10">
                                             <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                                                 <item.icon className="w-3 h-3 text-red-400" />
                                             </div>
                                             <div className="flex-1">
                                                 <p className="text-sm font-medium text-white">{item.title}</p>
                                                 <p className="text-xs text-gray-500">{item.desc}</p>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>

                             {/* Help Link */}
                             <div className="p-4 bg-gradient-to-br from-red-900/20 to-zinc-900 border border-red-500/10 rounded-xl group hover:border-red-500/30 transition-colors cursor-pointer">
                                 <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                         <ExternalLink className="w-5 h-5 text-red-500" />
                                         <span className="text-sm font-medium text-white">Need help?</span>
                                     </div>
                                     <span className="text-xs text-gray-500 group-hover:text-red-400 transition-colors">View docs →</span>
                                 </div>
                             </div>
                         </div>

                     </motion.div>
                </Tab.Panel>
                {/* ═══ Knowledge Tab ═══ */}
                <Tab.Panel className="flex-1 overflow-y-auto p-6 focus:outline-none">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl">
                        <KnowledgeTab workspaceId={workspaceId} agentId={agentId} agent={agent} setAgent={setAgent} setHasUnsavedChanges={setHasUnsavedChanges} />
                    </motion.div>
                </Tab.Panel>

                {/* 4. Settings Panel */}
                <Tab.Panel className="h-full p-6 focus:outline-none overflow-y-auto pb-32">
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl space-y-8">
                         
                         {/* General Settings */}
                         <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-gray-400" />
                                General Settings
                            </h2>
                            <div className="space-y-6 max-w-xl">
                                {/* Avatar Upload Section */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-3">Agent Avatar</label>
                                    <div className="flex items-center gap-5">
                                        {/* Avatar Preview */}
                                        <div className="relative group">
                                            {agent.avatar_url ? (
                                                <img 
                                                    src={agent.avatar_url} 
                                                    alt={agent.name}
                                                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white/10 group-hover:border-red-500/50 transition-colors"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-red-500/50 transition-colors">
                                                    <Camera className="w-6 h-6 text-gray-500 group-hover:text-red-400 transition-colors" />
                                                </div>
                                            )}
                                            {isUploadingAvatar && (
                                                <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                                                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <input
                                                ref={avatarInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,image/gif"
                                                onChange={handleAvatarUpload}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => avatarInputRef.current?.click()}
                                                disabled={isUploadingAvatar}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors border border-white/10 flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <Camera className="w-4 h-4" />
                                                {agent.avatar_url ? 'Change Avatar' : 'Upload Avatar'}
                                            </button>
                                            {agent.avatar_url && (
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteAvatar}
                                                    className="px-4 py-2 text-red-400 hover:text-red-300 text-sm font-medium rounded-lg transition-colors border border-red-500/20 hover:bg-red-500/10 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Remove
                                                </button>
                                            )}
                                            <p className="text-[11px] text-gray-500">JPEG, PNG, WebP, or GIF · Max 5MB · Cropped to 256×256</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-6">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Agent Name</label>
                                    <input 
                                        type="text" 
                                        value={agent.name}
                                        onChange={(e) => {
                                            setAgent({...agent, name: e.target.value});
                                            setHasUnsavedChanges(true);
                                        }}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                    <textarea 
                                        value={agent.description || ''}
                                        onChange={(e) => {
                                            setAgent({...agent, description: e.target.value});
                                            setHasUnsavedChanges(true);
                                        }}
                                        rows={3}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                                        placeholder="Describe what this agent does..."
                                    />
                                </div>

                                {/* Visibility Toggle */}
                                <div className="border-t border-white/5 pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="block text-sm font-medium text-white">Widget Visibility</label>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {agent.is_active 
                                                    ? 'This agent is currently visible on embedded websites.' 
                                                    : 'This agent is hidden and will not appear on any website.'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleToggleActive}
                                            disabled={isTogglingActive}
                                            className={classNames(
                                                "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none",
                                                agent.is_active ? "bg-emerald-500" : "bg-gray-600"
                                            )}
                                        >
                                            <span className={classNames(
                                                "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
                                                agent.is_active ? "translate-x-6" : "translate-x-1"
                                            )} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                         </div>

                         {/* Response Configuration */}
                         <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-400" />
                                Response Configuration
                            </h2>
                            <p className="text-sm text-gray-400 mb-6">Control how your agent formats and delivers responses.</p>
                            <div className="space-y-6 max-w-xl">
                                {/* Max Response Length */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Max Response Length <span className="text-gray-500 font-normal">(words)</span>
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min={0}
                                            max={500}
                                            step={10}
                                            value={agent.response_config?.max_length || 0}
                                            onChange={(e) => {
                                                setAgent({ ...agent, response_config: { ...agent.response_config, max_length: parseInt(e.target.value) } });
                                                setHasUnsavedChanges(true);
                                            }}
                                            className="flex-1 accent-amber-500 h-2 bg-zinc-700 rounded-full"
                                        />
                                        <span className="text-white text-sm font-mono w-16 text-right">
                                            {agent.response_config?.max_length || 'Auto'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">0 = no limit. The agent will try to keep responses under this word count.</p>
                                </div>

                                {/* Confidence Threshold */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Confidence Threshold
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            step={5}
                                            value={(agent.response_config?.confidence_threshold || 0) * 100}
                                            onChange={(e) => {
                                                setAgent({ ...agent, response_config: { ...agent.response_config, confidence_threshold: parseInt(e.target.value) / 100 } });
                                                setHasUnsavedChanges(true);
                                            }}
                                            className="flex-1 accent-amber-500 h-2 bg-zinc-700 rounded-full"
                                        />
                                        <span className="text-white text-sm font-mono w-16 text-right">
                                            {Math.round((agent.response_config?.confidence_threshold || 0) * 100)}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Below this confidence, the agent will use the fallback message instead of guessing.</p>
                                </div>

                                {/* Fallback Message */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Custom Fallback Message</label>
                                    <textarea
                                        value={agent.response_config?.fallback_message || ''}
                                        onChange={(e) => {
                                            setAgent({ ...agent, response_config: { ...agent.response_config, fallback_message: e.target.value } });
                                            setHasUnsavedChanges(true);
                                        }}
                                        rows={2}
                                        placeholder="I don't have enough information to answer that accurately..."
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                                    />
                                </div>

                                {/* Show Citations Toggle */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="block text-sm font-medium text-white">Source Citations</label>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Show document source names at the end of responses.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setAgent({ ...agent, response_config: { ...agent.response_config, show_citations: !agent.response_config?.show_citations } });
                                            setHasUnsavedChanges(true);
                                        }}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                                            agent.response_config?.show_citations ? 'bg-amber-500' : 'bg-gray-600'
                                        }`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                                            agent.response_config?.show_citations ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                    </button>
                                </div>

                                {/* Response Format */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Response Format</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { value: 'mixed', label: '🔀 Mixed' },
                                            { value: 'paragraphs', label: '📄 Paragraphs' },
                                            { value: 'bullets', label: '• Bullets' },
                                            { value: 'numbered', label: '1. Numbered' },
                                        ].map((fmt) => (
                                            <button
                                                key={fmt.value}
                                                onClick={() => {
                                                    setAgent({ ...agent, response_config: { ...agent.response_config, response_format: fmt.value } });
                                                    setHasUnsavedChanges(true);
                                                }}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    (agent.response_config?.response_format || 'mixed') === fmt.value
                                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                                }`}
                                            >
                                                {fmt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                         </div>

                         {/* Conversation Rules & Guardrails */}
                         <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-purple-400" />
                                Conversation Rules & Guardrails
                            </h2>
                            <p className="text-sm text-gray-400 mb-6">Define boundaries and rules for your agent&apos;s conversations.</p>
                            <div className="space-y-6 max-w-xl">
                                {/* Allowed Topics */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Allowed Topics <span className="text-gray-500 font-normal">(leave empty for all)</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {(agent.conversation_rules?.allowed_topics || []).map((topic, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/15 text-purple-300 text-sm rounded-full border border-purple-500/20">
                                                {topic}
                                                <button onClick={() => {
                                                    const topics = [...(agent.conversation_rules?.allowed_topics || [])];
                                                    topics.splice(idx, 1);
                                                    setAgent({ ...agent, conversation_rules: { ...agent.conversation_rules, allowed_topics: topics } });
                                                    setHasUnsavedChanges(true);
                                                }} className="hover:text-purple-100">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={topicInput}
                                        onChange={(e) => {
                                            setTopicInput(e.target.value);
                                            setHasUnsavedChanges(true);
                                        }}
                                        placeholder="Type a topic and press Enter..."
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && topicInput.trim()) {
                                                const val = topicInput.trim();
                                                const topics = [...(agent.conversation_rules?.allowed_topics || []), val];
                                                setAgent({ ...agent, conversation_rules: { ...agent.conversation_rules, allowed_topics: topics } });
                                                setTopicInput('');
                                                setHasUnsavedChanges(true);
                                            }
                                        }}
                                        onBlur={() => {
                                            if (topicInput.trim()) {
                                                const val = topicInput.trim();
                                                const topics = [...(agent.conversation_rules?.allowed_topics || []), val];
                                                setAgent({ ...agent, conversation_rules: { ...agent.conversation_rules, allowed_topics: topics } });
                                                setTopicInput('');
                                                setHasUnsavedChanges(true);
                                            }
                                        }}
                                    />
                                </div>

                                {/* Blocked Words / Topics */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Blocked Words / Topics
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {(agent.conversation_rules?.blocked_words || []).map((word, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 text-red-300 text-sm rounded-full border border-red-500/20">
                                                {word}
                                                <button onClick={() => {
                                                    const words = [...(agent.conversation_rules?.blocked_words || [])];
                                                    words.splice(idx, 1);
                                                    setAgent({ ...agent, conversation_rules: { ...agent.conversation_rules, blocked_words: words } });
                                                    setHasUnsavedChanges(true);
                                                }} className="hover:text-red-100">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={blockedWordInput}
                                        onChange={(e) => {
                                            setBlockedWordInput(e.target.value);
                                            setHasUnsavedChanges(true);
                                        }}
                                        placeholder="Type a blocked word and press Enter..."
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && blockedWordInput.trim()) {
                                                const val = blockedWordInput.trim();
                                                const words = [...(agent.conversation_rules?.blocked_words || []), val];
                                                setAgent({ ...agent, conversation_rules: { ...agent.conversation_rules, blocked_words: words } });
                                                setBlockedWordInput('');
                                                setHasUnsavedChanges(true);
                                            }
                                        }}
                                        onBlur={() => {
                                            if (blockedWordInput.trim()) {
                                                const val = blockedWordInput.trim();
                                                const words = [...(agent.conversation_rules?.blocked_words || []), val];
                                                setAgent({ ...agent, conversation_rules: { ...agent.conversation_rules, blocked_words: words } });
                                                setBlockedWordInput('');
                                                setHasUnsavedChanges(true);
                                            }
                                        }}
                                    />
                                </div>

                                {/* End-of-Conversation Message */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">End-of-Conversation Message</label>
                                    <textarea
                                        value={agent.conversation_rules?.end_message || ''}
                                        onChange={(e) => {
                                            setAgent({ ...agent, conversation_rules: { ...agent.conversation_rules, end_message: e.target.value } });
                                            setHasUnsavedChanges(true);
                                        }}
                                        rows={2}
                                        placeholder="Thanks for chatting! If you need more help, feel free to reach out..."
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Shown when the visitor says goodbye or the conversation ends.</p>
                                </div>


                            </div>
                         </div>

                         {/* CTA Email — Lead Generation */}
                         <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-400" />
                                Lead Generation (CTA Email)
                            </h2>
                            <p className="text-sm text-gray-400 mb-6">
                                Set up an email to receive visitor leads. When a visitor shows interest, they&apos;ll be 
                                able to share their contact info. You&apos;ll get an email with their details and conversation summary.
                            </p>
                            <div className="space-y-4 max-w-xl">
                                {agent.conversation_rules?.cta_email_verified ? (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                        <div className="flex items-center gap-3 mb-2">
                                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                                            <span className="text-sm font-medium text-emerald-300">Verified Email</span>
                                        </div>
                                        <p className="text-sm text-gray-300 font-mono bg-black/30 px-3 py-2 rounded-lg">
                                            {agent.conversation_rules?.cta_email}
                                        </p>
                                        <button
                                            onClick={() => {
                                                setAgent({ ...agent, conversation_rules: { ...agent.conversation_rules, cta_email: '', cta_email_verified: false } });
                                                setCtaOtpSent(false);
                                                setCtaEmailInput('');
                                                setHasUnsavedChanges(true);
                                            }}
                                            className="mt-3 text-sm text-red-400 hover:text-red-300 underline underline-offset-4"
                                        >
                                            Change email
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-3">
                                            <input
                                                type="email"
                                                value={ctaEmailInput}
                                                onChange={(e) => setCtaEmailInput(e.target.value)}
                                                placeholder="your-email@company.com"
                                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                                disabled={ctaOtpSent}
                                            />
                                            {!ctaOtpSent ? (
                                                <button
                                                    onClick={async () => {
                                                        if (!ctaEmailInput.trim() || !ctaEmailInput.includes('@')) {
                                                            toast.error('Please enter a valid email');
                                                            return;
                                                        }
                                                        setCtaSending(true);
                                                        try {
                                                            await sendCtaEmailOtp(agent.id, ctaEmailInput);
                                                            setCtaOtpSent(true);
                                                            toast.success('OTP sent! Check your email.');
                                                        } catch (e: any) {
                                                            toast.error(e?.response?.data?.detail || 'Failed to send OTP');
                                                        } finally {
                                                            setCtaSending(false);
                                                        }
                                                    }}
                                                    disabled={ctaSending || !ctaEmailInput}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    {ctaSending ? 'Sending...' : 'Send OTP'}
                                                </button>
                                            ) : null}
                                        </div>

                                        {ctaOtpSent && (
                                            <div className="space-y-3">
                                                <p className="text-sm text-blue-300">
                                                    ✉️ We sent a 6-digit code to <strong>{ctaEmailInput}</strong>
                                                </p>
                                                <div className="flex gap-3">
                                                    <input
                                                        type="text"
                                                        value={ctaOtpInput}
                                                        onChange={(e) => setCtaOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                        placeholder="Enter 6-digit OTP"
                                                        maxLength={6}
                                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:border-blue-500/50 transition-colors"
                                                    />
                                                    <button
                                                        onClick={async () => {
                                                            if (ctaOtpInput.length !== 6) {
                                                                toast.error('Please enter the full 6-digit code');
                                                                return;
                                                            }
                                                            setCtaVerifying(true);
                                                            try {
                                                                await verifyCtaEmailOtp(agent.id, ctaEmailInput, ctaOtpInput);
                                                                setAgent({
                                                                    ...agent,
                                                                    conversation_rules: {
                                                                        ...agent.conversation_rules,
                                                                        cta_email: ctaEmailInput,
                                                                        cta_email_verified: true,
                                                                    }
                                                                });
                                                                setCtaOtpSent(false);
                                                                setCtaOtpInput('');
                                                                toast.success('Email verified! Leads will be sent here.');
                                                            } catch (e: any) {
                                                                toast.error(e?.response?.data?.detail || 'Verification failed');
                                                            } finally {
                                                                setCtaVerifying(false);
                                                            }
                                                        }}
                                                        disabled={ctaVerifying || ctaOtpInput.length !== 6}
                                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                                                    >
                                                        {ctaVerifying ? 'Verifying...' : 'Verify'}
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setCtaOtpSent(false);
                                                        setCtaOtpInput('');
                                                    }}
                                                    className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-4"
                                                >
                                                    Use a different email
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                         </div>

                         {/* Domain Security */}
                         <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-emerald-500" />
                                Domain Security (Agent Level)
                            </h2>
                            <p className="text-sm text-gray-400 mb-6">
                                Restrict which domains can embed this agent. 
                                <span className="text-red-400 ml-1">
                                    If you use an API Key, these rules apply IN ADDITION to the key's restrictions.
                                </span>
                            </p>

                            <div className="space-y-4 max-w-xl">
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input 
                                            type="text" 
                                            value={domainInput}
                                            onChange={(e) => setDomainInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                                            placeholder="example.com"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleAddDomain}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors border border-emerald-500/20"
                                    >
                                        Add
                                    </button>
                                </div>

                                {(!agent.allowed_domains || agent.allowed_domains.length === 0) ? (
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                                        <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-amber-200 font-medium">No restrictions set</p>
                                            <p className="text-xs text-amber-200/60 mt-1">
                                                This agent can be embedded anywhere unless an API Key is enforced. We recommend adding domains or using an API Key.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {agent.allowed_domains.map((domain, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-lg group hover:border-white/10 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Globe className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-sm text-gray-300 font-mono">{domain}</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleRemoveDomain(domain)}
                                                    className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                         </div>

                         {/* Danger Zone */}
                         <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-red-500 mb-4 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Danger Zone
                            </h2>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white">Delete Agent</p>
                                    <p className="text-xs text-gray-400 mt-1">Permanently delete this agent and all its conversation history.</p>
                                </div>
                                <button 
                                    onClick={handleDeleteAgent}
                                    disabled={isDeleting}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors border border-red-500/50 shadow-lg shadow-red-900/20"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete Agent'}
                                </button>
                            </div>
                         </div>

                     </motion.div>
                </Tab.Panel>

            </Tab.Panels>
        </div>
        </Tab.Group>
    </div>
  );
}

// ─── Knowledge Tab Component ───
function KnowledgeTab({ workspaceId, agentId, agent, setAgent, setHasUnsavedChanges }: {
  workspaceId: string;
  agentId: string;
  agent: Agent;
  setAgent: (agent: Agent) => void;
  setHasUnsavedChanges: (v: boolean) => void;
}) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const DEFAULT_COLLECTION_ID = "00000000-0000-0000-0000-000000000000";
  const linkedDocIds: string[] = agent.configuration?.knowledge_sources || [];

  useEffect(() => {
    async function load() {
      try {
        const [cols, docs] = await Promise.all([
          getCollections(workspaceId),
          getDocuments(workspaceId),
        ]);
        setCollections(cols);
        setDocuments(docs);
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    }
    load();
  }, [workspaceId]);

  const toggleDocument = (docId: string) => {
    const current = agent.configuration?.knowledge_sources || [];
    const updated = current.includes(docId) ? current.filter((id: string) => id !== docId) : [...current, docId];
    setAgent({ ...agent, configuration: { ...agent.configuration, knowledge_sources: updated } });
    setHasUnsavedChanges(true);
  };

  const toggleAllInCollection = (collectionId: string) => {
    const colDocs = documents.filter(d => d.collection_id === collectionId && d.status === 'processed');
    const colDocIds = colDocs.map(d => d.id);
    const current: string[] = agent.configuration?.knowledge_sources || [];
    const allLinked = colDocIds.every(id => current.includes(id));
    const updated = allLinked
      ? current.filter(id => !colDocIds.includes(id))
      : [...current, ...colDocIds.filter(id => !current.includes(id))];
    setAgent({ ...agent, configuration: { ...agent.configuration, knowledge_sources: updated } });
    setHasUnsavedChanges(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedGroups(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // Group into collections and standalone
  const processedDocs = documents.filter(d => d.status === 'processed');
  const standaloneDocs = processedDocs.filter(d => !d.collection_id || d.collection_id === DEFAULT_COLLECTION_ID);
  const collectionGroups = collections.map(col => ({
    ...col,
    docs: processedDocs.filter(d => d.collection_id === col.id),
  })).filter(g => g.docs.length > 0);

  if (loading) {
    return <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-red-500" /> Knowledge Sources
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Select which collections and documents this agent can access.
          <strong className="text-gray-300"> {linkedDocIds.length}</strong> document(s) linked.
        </p>
      </div>

      {/* Collections with expandable doc lists */}
      {collectionGroups.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase">Collections</h3>
          {collectionGroups.map(group => {
            const linkedCount = group.docs.filter(d => linkedDocIds.includes(d.id)).length;
            const allLinked = group.docs.length > 0 && linkedCount === group.docs.length;
            const isExpanded = expandedGroups.has(group.id);
            return (
              <div key={group.id} className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-3 hover:bg-white/[0.03] transition-colors">
                  <button onClick={() => toggleExpand(group.id)} className="flex items-center gap-3 flex-1 text-left">
                    <span className="text-gray-400">{isExpanded ? '▾' : '▸'}</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Layers className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white">{group.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{linkedCount}/{group.docs.length} linked</span>
                    </div>
                  </button>
                  <button
                    onClick={() => toggleAllInCollection(group.id)}
                    className={classNames(
                      "relative inline-flex h-6 w-10 items-center rounded-full transition-colors focus:outline-none",
                      allLinked ? "bg-emerald-500" : "bg-gray-600"
                    )}
                  >
                    <span className={classNames(
                      "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
                      allLinked ? "translate-x-5" : "translate-x-1"
                    )} />
                  </button>
                </div>
                {isExpanded && (
                  <div className="border-t border-white/5 divide-y divide-white/5">
                    {group.docs.map(doc => {
                      const isLinked = linkedDocIds.includes(doc.id);
                      return (
                        <div key={doc.id} onClick={() => toggleDocument(doc.id)}
                          className={classNames("flex items-center gap-3 px-4 py-2.5 pl-14 cursor-pointer transition-colors",
                            isLinked ? "bg-emerald-500/5 hover:bg-emerald-500/10" : "hover:bg-white/5"
                          )}>
                          <div className={classNames("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
                            isLinked ? "bg-emerald-500 border-emerald-500" : "border-gray-600"
                          )}>
                            {isLinked && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <p className="text-sm text-white truncate flex-1">{doc.title}</p>
                          <span className="text-xs text-gray-500 uppercase">{doc.source_type}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Standalone Documents */}
      {standaloneDocs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase">Standalone Documents</h3>
          <div className="bg-zinc-900 border border-white/10 rounded-xl divide-y divide-white/5 overflow-hidden">
            {standaloneDocs.map(doc => {
              const isLinked = linkedDocIds.includes(doc.id);
              return (
                <div key={doc.id} onClick={() => toggleDocument(doc.id)}
                  className={classNames("flex items-center gap-4 p-3 cursor-pointer transition-colors",
                    isLinked ? "bg-emerald-500/5 hover:bg-emerald-500/10" : "hover:bg-white/5"
                  )}>
                  <div className={classNames("w-5 h-5 rounded border-2 flex items-center justify-center shrink-0",
                    isLinked ? "bg-emerald-500 border-emerald-500" : "border-gray-600"
                  )}>
                    {isLinked && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{doc.title}</p>
                    <span className="text-xs text-gray-500 uppercase">{doc.source_type}</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {processedDocs.length === 0 && (
        <div className="p-8 text-center text-gray-500 text-sm bg-zinc-900 border border-white/10 rounded-xl">
          No processed documents. Upload and process documents from the Knowledge Base page first.
        </div>
      )}
    </>
  );
}
