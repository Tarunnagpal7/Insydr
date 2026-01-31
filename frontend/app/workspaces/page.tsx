'use client';

import { useEffect, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { fetchWorkspaces, createWorkspace, clearError } from '@/src/store/workspace.store';
import { 
  PlusIcon, 
  UserGroupIcon, 
  ClockIcon, 
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Header from '@/src/components/layout/Header';
import Spinner from '@/src/components/ui/Spinner';
import { Dialog, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
];

export default function WorkspacesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { workspaces, isLoading, isCreating, error } = useAppSelector((state) => state.workspace);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', timezone: 'UTC' });
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  const handleSelectWorkspace = (workspaceId: string) => {
    router.push(`/workspace/${workspaceId}`);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setFormErrors({ name: 'Workspace name is required' });
      return;
    }
    if (formData.name.trim().length < 2) {
      setFormErrors({ name: 'Name must be at least 2 characters' });
      return;
    }

    try {
      const result = await dispatch(createWorkspace({
        name: formData.name.trim(),
        timezone: formData.timezone,
      })).unwrap();
      
      toast.success('Workspace created!');
      setShowCreateModal(false);
      setFormData({ name: '', timezone: 'UTC' });
      router.push(`/workspace/${result.id}`);
    } catch (err: any) {
      toast.error(err || 'Failed to create workspace');
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setFormData({ name: '', timezone: 'UTC' });
    setFormErrors({});
    dispatch(clearError());
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Fluid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Header */}
      <Header />

      {/* Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Workspaces</h1>
          <p className="text-gray-400">Select a workspace to manage agents, knowledge base, and analytics</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" className="text-red-500" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
              <UserGroupIcon className="h-10 w-10 text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No workspaces yet</h2>
            <p className="text-gray-400 mb-6">Create your first workspace to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-red-900/20"
            >
              <PlusIcon className="h-5 w-5" />
              Create Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleSelectWorkspace(workspace.id)}
                className="group text-left bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-red-500/50 hover:bg-black/60 transition-all duration-300 hover:shadow-2xl hover:shadow-red-900/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-900/20 group-hover:scale-110 transition-transform">
                    {workspace.name[0].toUpperCase()}
                  </div>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/5 border border-white/5 text-gray-300">
                    {workspace.role}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-red-400 transition-colors">
                  {workspace.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{workspace.timezone}</p>

                <div className="pt-4 border-t border-white/5 flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <UserGroupIcon className="h-4 w-4" />
                    <span>{workspace.stats?.total_agents || 0} Agents</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>{new Date(workspace.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </button>
            ))}

            {/* Create New Card */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-red-500/50 hover:bg-white/5 transition-all duration-300 min-h-[200px] group"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-red-600/20 transition-colors">
                <PlusIcon className="h-6 w-6 text-gray-400 group-hover:text-red-500" />
              </div>
              <span className="font-medium text-gray-400 group-hover:text-white transition-colors">
                Create New Workspace
              </span>
            </button>
          </div>
        )}
      </main>

      {/* Create Modal */}
      <Transition appear show={showCreateModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-white">
                        Create Workspace
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-gray-400">
                        Set up a new workspace for your team
                      </p>
                    </div>
                    <button
                      onClick={closeModal}
                      className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Workspace Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          setFormErrors({});
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                        placeholder="e.g., My Company"
                        autoFocus
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-sm text-red-400">{formErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Timezone
                      </label>
                      <select
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                      >
                        {timezones.map((tz) => (
                          <option key={tz.value} value={tz.value} className="bg-zinc-900">
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        disabled={isCreating}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-900/20 disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        {isCreating && <Spinner size="sm" className="text-white" />}
                        {isCreating ? 'Creating...' : 'Create Workspace'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
