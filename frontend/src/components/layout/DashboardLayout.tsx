'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { fetchWorkspaces } from '@/src/store/workspace.store';
import { 
  HomeIcon, 
  Cog6ToothIcon, 
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  PlusIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import Logo from '@/src/components/ui/Logo';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: HomeIcon },
  { name: 'Agents', href: '/dashboard/agents', icon: ChatBubbleLeftRightIcon },
  { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: DocumentTextIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentWorkspace, workspaces, isLoading } = useAppSelector((state) => state.workspace);
  const { user } = useAppSelector((state) => state.auth);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  // Redirect to workspace setup if no workspaces
  useEffect(() => {
    if (!isLoading && workspaces.length === 0) {
      setShowCreateModal(true);
    }
  }, [isLoading, workspaces]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Fluid Background Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" />
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-milano-600/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3" />
         <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`relative z-50 flex flex-col border-r border-white/10 bg-black/40 backdrop-blur-xl transition-all duration-300 ${
            sidebarExpanded ? 'w-64' : 'w-20'
          }`}
        >
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
            {sidebarExpanded ? (
              <Logo size="md" variant="light" href="/dashboard" />
            ) : (
              <button
                onClick={() => setSidebarExpanded(true)}
                className="text-red-500 hover:text-red-400 mx-auto"
              >
                <Squares2X2Icon className="h-6 w-6" />
              </button>
            )}
            
            {sidebarExpanded && (
              <button
                onClick={() => setSidebarExpanded(false)}
                className="text-gray-500 hover:text-gray-300"
              >
                <ChevronDownIcon className="h-5 w-5 rotate-90" />
              </button>
            )}
          </div>

          {/* Workspace Switcher */}
          <div className="p-3 border-b border-white/10">
            {sidebarExpanded ? (
              <WorkspaceSwitcher />
            ) : (
              <button
                onClick={() => setSidebarExpanded(true)}
                className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-white/5 transition-colors"
                title={currentWorkspace?.name || 'Select Workspace'}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-red-900/20">
                  {currentWorkspace?.name?.[0]?.toUpperCase() || 'W'}
                </div>
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3 overflow-y-auto custom-scrollbar">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl
                    text-gray-400 hover:text-white
                    hover:bg-white/5 transition-all duration-200"
                  title={!sidebarExpanded ? item.name : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0 group-hover:text-red-500 transition-colors" />
                  {sidebarExpanded && (
                    <span className="ml-3">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="p-3 border-t border-white/10 bg-black/20">
            {sidebarExpanded ? (
              <div className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSidebarExpanded(true)}
                className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-white/5"
                title={user?.email}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              </button>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-white/10 bg-black/40 backdrop-blur-md">
            <div className="flex items-center">
               <div>
                  <h1 className="text-lg font-bold text-white tracking-wide">
                    {currentWorkspace?.name || 'Dashboard'}
                  </h1>
                   <div className="flex items-center gap-2">
                     <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                     <p className="text-xs text-gray-500 font-medium">
                       {currentWorkspace?.subscription_tier || 'Free Plan'}
                     </p>
                   </div>
               </div>
            </div>

            <div className="flex items-center space-x-6">
                 {/* Navigation Links */}
                 <nav className="flex items-center space-x-6">
                   <Link 
                     href="/dashboard/workspaces" 
                     className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative group"
                   >
                     Workspaces
                     <span className="absolute -bottom-5 left-0 w-0 h-0.5 bg-red-500 transition-all group-hover:w-full"></span>
                   </Link>
                 </nav>

                <div className="bg-white/10 h-6 w-px mx-2"></div>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all shadow-lg shadow-red-900/20 hover:shadow-red-900/40"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>New Workspace</span>
                </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
            {children}
          </main>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <CreateWorkspaceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
