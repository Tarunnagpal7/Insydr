'use client';

import { Fragment, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { logoutUser } from '@/src/store/auth.store';
import { Menu, Transition } from '@headlessui/react';
import Logo from '@/src/components/ui/Logo';
import {
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Squares2X2Icon,
  HomeIcon,
} from '@heroicons/react/24/outline';

interface HeaderProps {
  showNav?: boolean;
  className?: string;
  children?: ReactNode; // For custom action buttons
}

export default function Header({ showNav = true, className = '', children }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Workspaces', href: '/workspaces', icon: Squares2X2Icon },
  ];

  return (
    <header className={`relative z-30 border-b border-white/10 bg-black/40 backdrop-blur-xl ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Logo size="md" variant="light" href="/dashboard" />
        
        {/* Right Side */}
        <div className="flex items-center gap-6">
          {/* Navigation Links */}
          {showNav && (
            <>
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive 
                          ? 'text-white bg-white/10' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Divider */}
              <div className="hidden md:block h-6 w-px bg-white/10" />
            </>
          )}

          {/* Custom Actions (children) */}
          {children}

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
      </div>
    </header>
  );
}
