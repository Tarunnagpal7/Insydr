'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Agent, getAgent, chatWithAgent } from '@/src/features/agents/agents.service';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, Bot, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AgentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;
  const workspaceId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  
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
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAgent = async () => {
    try {
      setLoading(true);
      const data = await getAgent(agentId);
      setAgent(data);
    } catch (error) {
      toast.error('Failed to load agent details');
      router.push(`/workspace/${workspaceId}/agents`);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Sparkles className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!agent) return null;

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 overflow-hidden">
      {/* Left: Agent Info */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-1/3 bg-zinc-900 border border-white/10 rounded-2xl p-6 flex flex-col gap-6 overflow-y-auto"
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-white">
            Agent Details
          </h1>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
             </div>
             <div>
                <h2 className="text-lg font-semibold text-white">{agent.name}</h2>
                <div className="flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
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
            <code className="block bg-black/50 p-2 rounded text-xs text-gray-300 font-mono select-all border border-red-500/10">
                {agent.id}
            </code>
        </div>
      </motion.div>

      {/* Right: Chat Interface */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl flex flex-col overflow-hidden"
      >
        {/* Chat Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-500" />
                <span className="font-medium text-gray-200">Test Playground</span>
            </div>
            <span className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 px-2 py-1 rounded-full">
                Gemini Powered
            </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <Bot className="w-12 h-12 mb-2 text-gray-600" />
                    <p className="text-gray-500 text-sm">Start a conversation with {agent.name}</p>
                </div>
             )}
             
             {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div 
                        className={`
                            max-w-[80%] rounded-2xl px-4 py-3 text-sm
                            ${msg.role === 'user' 
                                ? 'bg-red-600 text-white rounded-br-none' 
                                : 'bg-zinc-800 text-gray-200 rounded-bl-none border border-white/5'
                            }
                        `}
                    >
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

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/40">
            <div className="flex items-center gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-light"
                />
                <button 
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors shadow-lg shadow-red-900/20"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </form>
      </motion.div>
    </div>
  );
}
