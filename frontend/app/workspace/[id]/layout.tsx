'use client';

import { useEffect, useState, Fragment } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { initializeAuth, logoutUser } from '@/src/store/auth.store';
import { fetchWorkspaceById, setCurrentWorkspace } from '@/src/store/workspace.store';
import Loading from '@/src/components/ui/Loading';
import Logo from '@/src/components/ui/Logo';
import { Menu, Transition } from '@headlessui/react';
import { 
  HomeIcon, 
  Cog6ToothIcon, 
  ChartBarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  KeyIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Overview', href: '', icon: HomeIcon },
  { name: 'Agents', href: '/agents', icon: ChatBubbleLeftRightIcon },
  { name: 'Knowledge Base', href: '/knowledge', icon: DocumentTextIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'API Keys', href: '/settings/api-keys', icon: KeyIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  
  const workspaceId = params.id as string;
  
  const { isAuthenticated, isInitialized, isLoading: authLoading, user } = useAppSelector((state) => state.auth);
  const { currentWorkspace, isLoading: workspaceLoading } = useAppSelector((state) => state.workspace);
  
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Initialize auth
  useEffect(() => {
    if (!isInitialized) {
      dispatch(initializeAuth());
    }
  }, [dispatch, isInitialized]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated && !authLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, isInitialized, authLoading, router]);

  // Fetch workspace by ID
  useEffect(() => {
    if (isAuthenticated && workspaceId) {
      dispatch(fetchWorkspaceById(workspaceId));
    }
  }, [dispatch, isAuthenticated, workspaceId]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/login');
  };

  if (!isInitialized || authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (workspaceLoading || !currentWorkspace) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  const basePath = `/workspace/${workspaceId}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Fluid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3" />
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
              <Logo size="md" variant="light" href="/workspaces" />
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

          {/* Workspace Info */}
          <div className="p-3 border-b border-white/10">
            {sidebarExpanded ? (
              <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold shadow-lg shadow-red-900/20">
                  {currentWorkspace.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{currentWorkspace.name}</p>
                  <p className="text-xs text-gray-500">{currentWorkspace.subscription_tier || 'Free Plan'}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold shadow-lg shadow-red-900/20">
                  {currentWorkspace.name[0].toUpperCase()}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
            {navigation.filter(item => {
                if (item.name === 'Settings' || item.name === 'API Keys') {
                    return currentWorkspace?.role === 'OWNER' || currentWorkspace?.role === 'ADMIN';
                }
                return true;
            }).map((item) => {
              const Icon = item.icon;
              const fullPath = `${basePath}${item.href}`;
              const isActive = pathname === fullPath || (item.href === '' && pathname === basePath);
              
              return (
                <Link
                  key={item.name}
                  href={fullPath}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-red-600/20 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={!sidebarExpanded ? item.name : undefined}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-red-500' : 'group-hover:text-red-500'} transition-colors`} />
                  {sidebarExpanded && (
                    <span className="ml-3">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Back to Workspaces */}
          <div className="p-3 border-t border-white/10">
            <Link
              href="/workspaces"
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              {sidebarExpanded && <span>All Workspaces</span>}
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-white/10 bg-black/40 backdrop-blur-md">
            {/* Left: Workspace Name */}
            <div>
              <h1 className="text-lg font-bold text-white">{currentWorkspace.name}</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-xs text-gray-500">{currentWorkspace.subscription_tier || 'Free Plan'}</span>
              </div>
            </div>

            {/* Right: Nav + Avatar Dropdown */}
            <div className="flex items-center gap-6">
              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-4">
                <Link 
                  href="/workspaces" 
                  className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Workspaces
                </Link>
                <Link 
                  href="/dashboard" 
                  className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              </nav>

              {/* Divider */}
              <div className="hidden md:block h-6 w-px bg-white/10" />

              {/* Avatar Dropdown */}
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-red-900/20">
                    {user?.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white">{user?.full_name || 'User'}</p>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </Menu.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-white/10 shadow-2xl focus:outline-none overflow-hidden">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white">{user?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/dashboard/profile"
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                              active ? 'bg-white/5 text-white' : 'text-gray-300'
                            }`}
                          >
                            <UserCircleIcon className="h-5 w-5" />
                            Profile
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/dashboard/settings"
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                              active ? 'bg-white/5 text-white' : 'text-gray-300'
                            }`}
                          >
                            <Cog6ToothIcon className="h-5 w-5" />
                            Settings
                          </Link>
                        )}
                      </Menu.Item>
                    </div>

                    <div className="border-t border-white/10 py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left ${
                              active ? 'bg-red-500/10 text-red-400' : 'text-gray-300'
                            }`}
                          >
                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                            Logout
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

