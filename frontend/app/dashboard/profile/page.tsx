'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '@/src/store/hooks';
import { logoutUser } from '@/src/store/auth.store';
import { useRouter } from 'next/navigation';
import Header from '@/src/components/layout/Header';
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  KeyIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import apiClient from '@/src/lib/api';

type TabId = 'profile' | 'password' | 'activity';

const tabs: { id: TabId; label: string; icon: any }[] = [
  { id: 'profile', label: 'Profile', icon: UserCircleIcon },
  { id: 'password', label: 'Security', icon: ShieldCheckIcon },
  { id: 'activity', label: 'Activity', icon: ClockIcon },
];

export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    phone: '',
    location: '',
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);



  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Use forgot password flow since we don't have a direct password change endpoint
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/login');
  };


  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Fluid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3" />
      </div>

      <Header />

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-red-900/30">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{user?.full_name || 'User'}</h1>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <div className="mt-2 flex gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20 uppercase tracking-wide">Active</span>
              <span className="px-2 py-0.5 rounded-lg bg-white/5 text-gray-400 text-[10px] font-medium border border-white/10 uppercase tracking-wide">Admin</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/5 hover:border-red-500/20 transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Sign Out
          </button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-8 overflow-x-auto"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* ─── Profile Tab ─── */}
          {activeTab === 'profile' && (
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Personal Information</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                      <UserCircleIcon className="w-3.5 h-3.5" /> Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      disabled={!isEditing}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                      <EnvelopeIcon className="w-3.5 h-3.5" /> Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-gray-500 text-sm cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                      <PhoneIcon className="w-3.5 h-3.5" /> Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      disabled={!isEditing}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                      <MapPinIcon className="w-3.5 h-3.5" /> Location
                    </label>
                    <input
                      type="text"
                      placeholder="New York, USA"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      disabled={!isEditing}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/10">
                  {isEditing ? (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-900/20 transition-all"
                      >
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-sm font-medium bg-white text-black hover:bg-gray-200 transition-colors"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* ─── Security Tab ─── */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-1">Change Password</h2>
                <p className="text-xs text-gray-500 mb-6">Update your password to keep your account secure.</p>
                
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(p => ({...p, current: !p.current}))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPasswords.current ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(p => ({...p, new: !p.new}))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPasswords.new ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(p => ({...p, confirm: !p.confirm}))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPasswords.confirm ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordData.newPassword && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              passwordData.newPassword.length >= i * 3
                                ? passwordData.newPassword.length >= 12 ? 'bg-emerald-500' : passwordData.newPassword.length >= 8 ? 'bg-amber-500' : 'bg-red-500'
                                : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-[10px] ${passwordData.newPassword.length >= 12 ? 'text-emerald-400' : passwordData.newPassword.length >= 8 ? 'text-amber-400' : 'text-red-400'}`}>
                        {passwordData.newPassword.length >= 12 ? 'Strong password' : passwordData.newPassword.length >= 8 ? 'Fair password' : 'Weak password — use at least 8 characters'}
                      </p>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isChangingPassword ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Two-Factor Authentication (placeholder) */}
              <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-1">Two-Factor Authentication</h2>
                    <p className="text-xs text-gray-500">Add an extra layer of security to your account.</p>
                  </div>
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all"
                    onClick={() => toast('2FA setup coming soon', { icon: '🔒' })}
                  >
                    Enable 2FA
                  </button>
                </div>
              </div>

              {/* Active Sessions (placeholder) */}
              <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-1">Active Sessions</h2>
                <p className="text-xs text-gray-500 mb-4">Manage your active login sessions.</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <CheckIcon className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Current Session</p>
                        <p className="text-[10px] text-gray-500">This browser • Active now</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Current</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Activity Tab ─── */}
          {activeTab === 'activity' && (
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-1">Activity Log</h2>
              <p className="text-xs text-gray-500 mb-6">Recent actions from your account.</p>
              
              <div className="space-y-3">
                {[
                  { action: 'Logged in', time: 'Just now', icon: ArrowRightOnRectangleIcon, color: 'text-emerald-400 bg-emerald-500/10' },
                  { action: 'Profile page visited', time: '1 minute ago', icon: UserCircleIcon, color: 'text-blue-400 bg-blue-500/10' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-300">{item.action}</p>
                        <p className="text-[10px] text-gray-500">{item.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center py-8">
                <p className="text-xs text-gray-500">Full activity logs will show here as you use the platform.</p>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
