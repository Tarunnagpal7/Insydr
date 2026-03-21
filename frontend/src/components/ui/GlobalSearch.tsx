'use client';

import { useState, useEffect, useRef, Fragment, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Dialog, Transition, Combobox } from '@headlessui/react';
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  HomeIcon,
  KeyIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector } from '@/src/store/hooks';

interface SearchResult {
  id: string;
  type: 'agent' | 'document' | 'page' | 'action';
  title: string;
  subtitle?: string;
  href: string;
  icon?: any;
}

const PAGE_RESULTS: Omit<SearchResult, 'href'>[] = [
  { id: 'nav-overview', type: 'page', title: 'Dashboard Overview', subtitle: 'View workspace stats', icon: HomeIcon },
  { id: 'nav-agents', type: 'page', title: 'Agents', subtitle: 'Manage AI agents', icon: ChatBubbleLeftRightIcon },
  { id: 'nav-knowledge', type: 'page', title: 'Knowledge Base', subtitle: 'Manage documents', icon: DocumentTextIcon },
  { id: 'nav-analytics', type: 'page', title: 'Analytics', subtitle: 'View insights', icon: ChartBarIcon },
  { id: 'nav-settings', type: 'page', title: 'Settings', subtitle: 'Workspace settings', icon: Cog6ToothIcon },
  { id: 'nav-api-keys', type: 'page', title: 'API Keys', subtitle: 'Manage API keys', icon: KeyIcon },
];

const PAGE_ROUTES: Record<string, string> = {
  'nav-overview': '',
  'nav-agents': '/agents',
  'nav-knowledge': '/knowledge',
  'nav-analytics': '/analytics',
  'nav-settings': '/settings',
  'nav-api-keys': '/settings/api-keys',
};

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  const basePath = `/workspace/${workspaceId}`;

  const { agents } = useAppSelector((state) => state.agent);

  // Keyboard shortcut: CMD+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Build search results
  const results: SearchResult[] = [];

  // Add page results
  const filteredPages = PAGE_RESULTS
    .filter(p => {
      if (!query) return true;
      const q = query.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.subtitle?.toLowerCase().includes(q);
    })
    .map(p => ({ ...p, href: `${basePath}${PAGE_ROUTES[p.id]}` }));
  results.push(...filteredPages);

  // Add agent results
  const filteredAgents: SearchResult[] = agents
    .filter(a => {
      if (!query) return true;
      const q = query.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q);
    })
    .map(a => ({
      id: `agent-${a.id}`,
      type: 'agent' as const,
      title: a.name,
      subtitle: a.agent_type?.replace(/_/g, ' ') || 'Agent',
      href: `${basePath}/agents/${a.id}`,
      icon: ChatBubbleLeftRightIcon,
    }));
  results.push(...filteredAgents);

  const handleSelect = useCallback((result: SearchResult | null) => {
    if (!result) return;
    router.push(result.href);
    setIsOpen(false);
    setQuery('');
  }, [router]);

  // Group results by type
  const pageGroup = results.filter(r => r.type === 'page');
  const agentGroup = results.filter(r => r.type === 'agent');

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-all group min-w-[200px]"
      >
        <MagnifyingGlassIcon className="w-4 h-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-gray-500 font-mono group-hover:text-gray-400">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[200]" onClose={() => { setIsOpen(false); setQuery(''); }}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start justify-center pt-[15vh] px-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl transition-all">
                  <Combobox onChange={handleSelect}>
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                      <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 shrink-0" />
                      <Combobox.Input
                        autoFocus
                        className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-500 focus:outline-none"
                        placeholder="Search agents, pages, documents..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                      <kbd className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-gray-500 font-mono">
                        ESC
                      </kbd>
                    </div>

                    {/* Results */}
                    <Combobox.Options static className="max-h-[50vh] overflow-y-auto p-2">
                      {results.length === 0 ? (
                        <div className="py-10 text-center">
                          <MagnifyingGlassIcon className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                          <p className="text-sm text-gray-400">No results found for &ldquo;{query}&rdquo;</p>
                          <p className="text-xs text-gray-500 mt-1">Try searching for agents, pages, or documents</p>
                        </div>
                      ) : (
                        <>
                          {/* Pages */}
                          {pageGroup.length > 0 && (
                            <div className="mb-2">
                              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                Pages
                              </div>
                              {pageGroup.map((result) => {
                                const Icon = result.icon || HomeIcon;
                                return (
                                  <Combobox.Option
                                    key={result.id}
                                    value={result}
                                    className={({ active }) =>
                                      `flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                                        active ? 'bg-white/10 text-white' : 'text-gray-300'
                                      }`
                                    }
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                      <Icon className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{result.title}</p>
                                      {result.subtitle && (
                                        <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-gray-600 shrink-0 bg-white/5 px-2 py-0.5 rounded">
                                      Navigate
                                    </span>
                                  </Combobox.Option>
                                );
                              })}
                            </div>
                          )}

                          {/* Agents */}
                          {agentGroup.length > 0 && (
                            <div className="mb-2">
                              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                Agents
                              </div>
                              {agentGroup.map((result) => (
                                <Combobox.Option
                                  key={result.id}
                                  value={result}
                                  className={({ active }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                                      active ? 'bg-white/10 text-white' : 'text-gray-300'
                                    }`
                                  }
                                >
                                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                                    <ChatBubbleLeftRightIcon className="w-4 h-4 text-red-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{result.title}</p>
                                    {result.subtitle && (
                                      <p className="text-xs text-gray-500 truncate capitalize">{result.subtitle}</p>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-gray-600 shrink-0 bg-white/5 px-2 py-0.5 rounded">
                                    Open
                                  </span>
                                </Combobox.Option>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </Combobox.Options>

                    {/* Footer */}
                    <div className="border-t border-white/10 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded font-mono">↑↓</kbd>
                        Navigate
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded font-mono">↵</kbd>
                        Open
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded font-mono">esc</kbd>
                        Close
                      </span>
                    </div>
                  </Combobox>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
