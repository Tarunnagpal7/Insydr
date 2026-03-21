'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/src/store/hooks';
import { initializeAuth, logoutUser } from '@/src/store/auth.store';
import {
  HomeIcon,
  UsersIcon,
  Squares2X2Icon,
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowLeftOnRectangleIcon,
  ShieldCheckIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  KeyIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

const ADMIN_EMAIL = 'admin@gmail.com';

const adminNav = [
  { name: 'Overview', href: '/admin', icon: HomeIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Workspaces', href: '/admin/workspaces', icon: Squares2X2Icon },
  { name: 'Agents', href: '/admin/agents', icon: CpuChipIcon },
  { name: 'Conversations', href: '/admin/conversations', icon: ChatBubbleLeftRightIcon },
  { name: 'Documents', href: '/admin/documents', icon: DocumentTextIcon },
  { name: 'API Keys', href: '/admin/api-keys', icon: KeyIcon },
  { name: 'Monitoring', href: '/admin/monitoring', icon: HeartIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isInitialized, isAuthenticated, router]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user?.email !== ADMIN_EMAIL) {
      router.push('/dashboard');
    }
  }, [isInitialized, isAuthenticated, user, router]);

  if (!isInitialized || !isAuthenticated || user?.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/login');
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/30">
            <ShieldCheckIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">Insydr Admin</h1>
            <p className="text-[10px] text-gray-500">Platform Control Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {adminNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-red-400' : ''}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/[0.06] space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <ArrowLeftOnRectangleIcon className="w-4 h-4" />
          Sign Out
        </button>
        <div className="px-3 pt-2">
          <p className="text-[10px] text-gray-600 truncate">{user?.email}</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-60 xl:w-64 shrink-0 flex-col border-r border-white/[0.06] bg-zinc-950/95 backdrop-blur-xl fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-zinc-950 border-r border-white/[0.06] flex flex-col z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-60 xl:ml-64">
        {/* Top bar (mobile only) */}
        <header className="lg:hidden sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-gray-400 hover:text-white rounded-lg">
            <Bars3Icon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
              <ShieldCheckIcon className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Admin</span>
          </div>
          <div className="w-9" />
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
