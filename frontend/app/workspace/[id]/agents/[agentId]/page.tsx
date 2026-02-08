'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Agent, getAgent, updateAgent, chatWithAgent } from '@/src/features/agents/agents.service';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, Bot, Save, Code, Settings, MessageSquare, Layout, Palette, Zap } from 'lucide-react';
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
              configuration: updatedConfig
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
    <div className="h-[calc(100vh-80px)] flex flex-col gap-4 overflow-hidden">
        {/* Header */}
         <div className="flex items-center justify-between shrink-0">
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
         <Tab.Group>
            <div className="border-b border-white/10">
                <Tab.List className="flex space-x-6">
                    {['Playground', 'Customization', 'Integration'].map((tab) => (
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

            <Tab.Panels className="flex-1 overflow-hidden">
                {/* 1. Playground Panel */}
                <Tab.Panel className="h-full flex gap-6 pt-2 focus:outline-none">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex-1 flex gap-6 overflow-hidden h-full"
                    >
                         {/* Left Info */}
                         <div className="w-1/3 bg-zinc-900 border border-white/10 rounded-2xl p-6 flex flex-col gap-6 overflow-y-auto">
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
                <Tab.Panel className="h-full pt-4 focus:outline-none overflow-y-auto">
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-6 h-full">
                        {/* Settings Form */}
                        <div className="w-1/3 space-y-6 overflow-y-auto pb-20 pr-2">
                             
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

                {/* 3. Integration Panel */}
                <Tab.Panel className="h-full pt-4 focus:outline-none overflow-y-auto">
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-8 pb-8">
                         <div className="text-center space-y-2">
                             <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <Code className="w-8 h-8 text-red-500" />
                             </div>
                             <h2 className="text-2xl font-bold text-white">Integrate Agent</h2>
                             <p className="text-gray-400">Add this agent to your website in less than 2 minutes.</p>
                         </div>

                         {/* Allowed Domains Info */}
                         <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                             <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                 <Settings className="w-4 h-4" /> Allowed Domains
                             </h3>
                             {agent.allowed_domains && agent.allowed_domains.length > 0 ? (
                                 <div className="space-y-2">
                                     <p className="text-sm text-gray-300 mb-3">This widget will only work on these domains:</p>
                                     <div className="flex flex-wrap gap-2">
                                         {agent.allowed_domains.map((domain, idx) => (
                                             <span key={idx} className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-sm font-mono">
                                                 {domain}
                                             </span>
                                         ))}
                                     </div>
                                 </div>
                             ) : (
                                 <div className="flex items-center gap-3 p-4 bg-yellow-900/10 border border-yellow-900/20 rounded-xl">
                                     <Zap className="w-5 h-5 text-yellow-500 shrink-0" />
                                     <p className="text-sm text-yellow-400">
                                         <strong>Warning:</strong> No domain restrictions set. This widget can be embedded on any website. Configure allowed domains in agent settings for security.
                                     </p>
                                 </div>
                             )}
                         </div>

                         {/* Embed Code */}
                         <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
                             <div className="px-6 py-4 border-b border-white/10 bg-black/20 flex items-center justify-between">
                                 <span className="text-sm font-mono text-gray-400">Step 1: Copy Embed Code</span>
                                 <button 
                                    onClick={() => {
                                        const code = `<script src="http://localhost:5173/widget.js" data-agent-id="${agentId}" data-api-base="http://localhost:8000/api/v1" defer></script>`;
                                        navigator.clipboard.writeText(code);
                                        toast.success("Copied to clipboard");
                                    }}
                                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors"
                                 >
                                     Copy Code
                                 </button>
                             </div>
                             <div className="p-6 bg-black/40">
                                 <pre className="font-mono text-sm text-green-400 whitespace-pre-wrap break-all">
{`<script 
  src="http://localhost:5173/widget.js" 
  data-agent-id="${agentId}" 
  data-api-base="http://localhost:8000/api/v1"
  defer
></script>`}
                                 </pre>
                             </div>
                             <div className="px-6 py-4 bg-yellow-900/10 border-t border-yellow-900/20">
                                 <p className="text-xs text-yellow-500 flex items-center gap-2">
                                     <Zap className="w-4 h-4" />
                                     Paste this code before the closing <code>&lt;/body&gt;</code> tag of your website.
                                 </p>
                             </div>
                         </div>

                         {/* How It Works */}
                         <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                             <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">How It Works</h3>
                             <div className="space-y-4">
                                 {[
                                     { step: '1', title: 'Script Loads', desc: 'Browser loads widget.js from our servers' },
                                     { step: '2', title: 'Initialize', desc: 'Widget sends page URL & agent ID to Insydr' },
                                     { step: '3', title: 'Validate', desc: 'We verify the domain is allowed' },
                                     { step: '4', title: 'Track & Chat', desc: 'Widget renders and tracks analytics' },
                                 ].map((item) => (
                                     <div key={item.step} className="flex items-start gap-4">
                                         <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center text-red-500 font-bold text-sm shrink-0">
                                             {item.step}
                                         </div>
                                         <div>
                                             <p className="text-white font-medium">{item.title}</p>
                                             <p className="text-sm text-gray-400">{item.desc}</p>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     </motion.div>
                </Tab.Panel>
            </Tab.Panels>
         </Tab.Group>
    </div>
  );
}
