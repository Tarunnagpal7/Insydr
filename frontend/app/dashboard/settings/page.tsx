'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/src/components/layout/Header';
import { 
    BellIcon, 
    ShieldCheckIcon, 
    CreditCardIcon, 
    GlobeAltIcon,
    MoonIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function AccountSettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const handleSave = () => {
      // TODO: Implement settings save logic
      toast.success('Settings saved successfully');
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
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

            {/* Notifications */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-red-500/10 rounded-xl">
                        <BellIcon className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Notifications</h2>
                        <p className="text-sm text-gray-400">Manage how you receive updates</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                        <div>
                            <p className="font-medium text-white">Email Notifications</p>
                            <p className="text-sm text-gray-400">Receive updates about your account activity</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>
                     <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                        <div>
                            <p className="font-medium text-white">Marketing Emails</p>
                            <p className="text-sm text-gray-400">Receive news, updates, and special offers</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={marketingEmails} onChange={(e) => setMarketingEmails(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>
                </div>
            </motion.div>

            {/* Security */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
                 <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                        <ShieldCheckIcon className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Security</h2>
                        <p className="text-sm text-gray-400">Protect your account</p>
                    </div>
                </div>
                <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                        <div>
                            <p className="font-medium text-white">Password</p>
                            <p className="text-sm text-gray-400">Last changed 3 months ago</p>
                        </div>
                        <button className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all">
                            Change Password
                        </button>
                    </div>
                </div>
            </motion.div>

             {/* Appearance */}
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                        <MoonIcon className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Appearance</h2>
                        <p className="text-sm text-gray-400">Customize your interface experience</p>
                    </div>
                </div>
                 <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                        <div>
                            <p className="font-medium text-white">Dark Mode</p>
                            <p className="text-sm text-gray-400">Use dark theme across the application</p>
                        </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
            </motion.div>

             <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-white text-black hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
                >
                    Save Changes
                </button>
            </div>
        </div>
      </main>
    </div>
  );
}
