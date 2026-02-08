'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Agent, getAgent, updateAgent, chatWithAgent, deleteAgent } from '@/src/features/agents/agents.service';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, Bot, Save, Code, Settings, MessageSquare, Layout, Palette, Zap, Copy, Globe, Shield, CheckCircle, Terminal, ExternalLink, Layers, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Tab } from '@headlessui/react';
import classNames from 'classnames';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface WidgetSettings {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  welcomeMessage: string;
  agentName: string;
  showPoweredBy: boolean;
}

const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
  theme: 'auto',
  primaryColor: '#EF4444', // Red-500
  position: 'bottom-right',
  welcomeMessage: 'Hello! How can I help you today?',
  agentName: 'Support Agent',
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
        setWidgetSettings({ ...DEFAULT_WIDGET_SETTINGS, agentName: data.name });
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
      const toastId = toast.loading("Saving changes...");
      try {
          const updatedConfig = {
              ...agent.configuration,
              widget_settings: widgetSettings
          };
          
          await updateAgent(agent.id, {
              name: agent.name,
              configuration: updatedConfig,
              allowed_domains: agent.allowed_domains
          });
          
          setHasUnsavedChanges(false);
          toast.success("Settings saved", { id: toastId });
      } catch (e) {
          toast.error("Failed to save settings", { id: toastId });
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
              "absolute flex flex-col items-end gap-4 transition-all duration-500",
              {
                  'bottom-6 right-6': widgetSettings.position === 'bottom-right',
                  'bottom-6 left-6': widgetSettings.position === 'bottom-left',
                  'top-6 right-6': widgetSettings.position === 'top-right',
                  'top-6 left-6': widgetSettings.position === 'top-left',
              }
          )}>
              {/* Chat Window (Open State Simulation) */}
              <div className="w-[320px] h-[400px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 origin-bottom-right border border-gray-200">
                  {/* Header */}
                  <div className="p-4 text-white flex items-center gap-3" style={{ backgroundColor: widgetSettings.primaryColor }}>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div>
                          <p className="font-semibold text-sm">{widgetSettings.agentName}</p>
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
    <div className="h-full flex flex-col -m-8">
        <Tab.Group>
            {/* Fixed Header with Tabs */}
            <div className=" sticky -top-10 z-50 w-full shrink-0 bg-zinc-950/95 backdrop-blur-md border-b border-white/5 px-6 pt-6 pb-0">
                <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.back()}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                {agent.name}
                                <span className={classNames(
                                    "px-2 py-0.5 rounded-full text-xs border uppercase",
                                    agent.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-gray-500/10 border-gray-500/20 text-gray-500' 
                                )}>{agent.status}</span>
                            </h1>
                            <p className="text-xs text-gray-400 mt-0.5">Edit, customize, and integrate your agent.</p>
                        </div>
                    </div>
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

                {/* Tabs */}
                <div className="border-b border-white/10">
                    <Tab.List className="flex space-x-6">
                        {['Playground', 'Customization', 'Integration', 'Settings'].map((tab) => (
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

            {/* Tab Content - Full height scrollable area */}
            <div className="h-full  flex-1 min-h-0 ">
                <Tab.Panels className="h-full">
                    {/* 1. Playground Panel */}
                    <Tab.Panel className="h-full flex gap-6 p-6 focus:outline-none">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex-1 flex gap-6 h-full"
                        >
                         {/* Left Info */}
                         <div className="w-1/3 bg-zinc-900 border border-white/10 rounded-2xl p-6 flex flex-col  gap-6 overflow-y-auto">
                            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                                        <Bot className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg font-semibold text-white truncate">{agent.name}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                           <span className={classNames("w-2 h-2 rounded-full", agent.status === 'active' ? 'bg-emerald-500' : 'bg-gray-500')}></span>
                                           <span className="text-xs text-gray-400 capitalize">{agent.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase font-medium">Description</label>
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                    {agent.description || "No description provided."}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase font-medium">Model</label>
                                    <div className="text-sm text-gray-300 font-mono bg-black/50 px-2 py-1 rounded inline-block border border-white/10">
                                      {agent.configuration?.model || "Standard"}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                     <label className="text-xs text-gray-500 uppercase font-medium">Agent Type</label>
                                     <div className="text-sm text-gray-300 capitalize">
                                       {agent.configuration?.agent_type || "Custom"}
                                     </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-red-900/10 border border-red-500/20 mt-auto">
                                <h3 className="text-sm font-semibold text-red-500 mb-2">Integration</h3>
                                <p className="text-xs text-gray-400 mb-2">Use this Agent ID to query via API:</p>
                                <code className="block bg-black/50 p-2 rounded text-xs text-gray-300 font-mono select-all border border-red-500/10 overflow-hidden text-ellipsis">
                                    {agent.id}
                                </code>
                            </div>
                         </div>
                         
                         {/* Chat Interface */}
                         <div className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-red-500" />
                                    <span className="font-medium text-gray-200">Test Playground</span>
                                </div>
                                <span className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 px-2 py-1 rounded-full">
                                    Gemini Powered
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                        <Bot className="w-12 h-12 mb-2 text-gray-600" />
                                        <p className="text-gray-500 text-sm">Start a conversation with {agent.name}</p>
                                    </div>
                                )}
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-red-600 text-white rounded-br-none' : 'bg-zinc-800 text-gray-200 rounded-bl-none border border-white/5'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {sending && (
                                     <div className="flex justify-start">
                                         <div className="bg-zinc-800 border border-white/5 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                                             <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                             <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                             <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                         </div>
                                     </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/40">
                                <div className="flex items-center gap-2">
                                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-light" />
                                    <button type="submit" disabled={!input.trim() || sending} className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors shadow-lg shadow-red-900/20"><Send className="w-4 h-4" /></button>
                                </div>
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
                                         <label className="block text-sm text-gray-300 mb-1">Agent Name</label>
                                         <input 
                                            type="text" 
                                            value={widgetSettings.agentName}
                                            onChange={(e) => {
                                                setWidgetSettings(p => ({ ...p, agentName: e.target.value }));
                                                setHasUnsavedChanges(true);
                                            }}
                                            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-red-500 outline-none" 
                                         />
                                     </div>
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
                                     {['bottom-right', 'bottom-left', 'top-right', 'top-left'].map((pos) => (
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

                             {/* Section: Behavior */}
                             <div className="space-y-4 pt-4 border-t border-white/5">
                                 <h3 className="text-sm font-semibold text-gray-400 uppercase flex items-center gap-2">
                                     <Zap className="w-4 h-4" /> Behavior
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
                        <div className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl p-6 flex flex-col">
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
                                             <span className={classNames("w-2 h-2 rounded-full", agent.status === 'active' ? 'bg-emerald-500' : 'bg-gray-500')} />
                                             <span className="text-xs text-gray-300 capitalize">{agent.status}</span>
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

                {/* 4. Settings Panel */}
                <Tab.Panel className="h-full p-6 focus:outline-none overflow-y-auto pb-32">
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl space-y-8">
                         
                         {/* General Settings */}
                         <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-gray-400" />
                                General Settings
                            </h2>
                            <div className="space-y-4 max-w-xl">
                                <div>
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
