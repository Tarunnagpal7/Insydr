'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppSelector } from '@/src/store/hooks';
import Header from '@/src/components/layout/Header';
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    phone: '',
    location: '',
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
        // TODO: Dispatch update profile action
        toast.success('Profile updated successfully');
        setIsEditing(false);
    } else {
        setIsEditing(true);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Fluid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3" />
      </div>

      <Header />

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
        >
          <div className="flex items-center gap-6 mb-8 border-b border-white/10 pb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-red-900/20">
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
                <h1 className="text-2xl font-bold text-white">{user?.full_name || 'User'}</h1>
                <p className="text-gray-400">{user?.email}</p>
                <div className="mt-2 flex gap-2">
                    <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">Pro Plan</span>
                    <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">Active</span>
                </div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <UserCircleIcon className="w-4 h-4" /> Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  disabled={!isEditing}
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <EnvelopeIcon className="w-4 h-4" /> Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-gray-400 cursor-not-allowed"
                />
              </div>
               <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <PhoneIcon className="w-4 h-4" /> Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={!isEditing}
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
               <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4" /> Location
                </label>
                <input
                  type="text"
                  placeholder="New York, USA"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  disabled={!isEditing}
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-white/10">
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
                            className="px-6 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20 transition-all"
                        >
                            Save Changes
                        </button>
                    </div>
                ) : (
                    <button
                        type="submit"
                        className="px-6 py-2 rounded-xl text-sm font-medium bg-white text-black hover:bg-gray-200 transition-colors"
                    >
                        Edit Profile
                    </button>
                )}
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
