'use client';

import { useState, useEffect, Fragment } from 'react';
import { useParams } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { 
  KeyIcon, 
  PlusIcon, 
  TrashIcon, 
  ClipboardIcon, 
  CheckIcon,
  GlobeAltIcon,
  NoSymbolIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { apiKeyApi, ApiKey, ApiKeyGenerated } from '@/src/lib/api-key';
import Loading from '@/src/components/ui/Loading';

export default function ApiKeysPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState<ApiKeyGenerated | null>(null);

  // Form State
  const [keyName, setKeyName] = useState('');
  const [domains, setDomains] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, [workspaceId]);

  const fetchKeys = async () => {
    try {
      setIsLoading(true);
      const response = await apiKeyApi.getAll(workspaceId);
      setKeys(response.data);
    } catch (error) {
      toast.error('Failed to load API keys');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    try {
      setIsSubmitting(true);
      const domainList = domains
        .split(',')
        .map(d => d.trim())
        .filter(d => d.length > 0);

      const response = await apiKeyApi.create(workspaceId, {
        name: keyName,
        allowed_domains: domainList.length > 0 ? domainList : undefined,
      });

      setNewKeyData(response.data);
      setIsCreateModalOpen(false);
      setIsSuccessModalOpen(true);
      setKeyName('');
      setDomains('');
      fetchKeys();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to create API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;

    try {
      await apiKeyApi.revoke(workspaceId, keyId);
      toast.success('API key revoked');
      fetchKeys();
    } catch (error) {
      toast.error('Failed to revoke API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">API Keys</h2>
          <p className="text-gray-400 mt-1">Manage API keys for accessing the Insydr SDK and API.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl hover:from-red-500 hover:to-red-700 transition-all shadow-lg shadow-red-900/20"
        >
          <PlusIcon className="w-5 h-5" />
          Generate New Key
        </button>
      </div>

      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
        {keys.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <KeyIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No API keys found</p>
            <p className="text-sm">Generate a key to integrate Insydr into your application.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-sm font-medium text-gray-400">Name</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-400">Key Prefix</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-400">Allowed Domains</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-400">Created</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-400">Requests</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-400">Last Used</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{key.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        {key.is_active ? (
                          <span className="flex items-center gap-1 text-emerald-500">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500">
                             <NoSymbolIcon className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-300">
                      {key.key_prefix}...
                    </td>
                    <td className="px-6 py-4">
                      {key.allowed_domains && key.allowed_domains.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {key.allowed_domains.map((domain, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {domain}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">All Domains</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(key.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {key.requests_count || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleRevoke(key.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-white/5"
                        title="Revoke Key"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Transition appear show={isCreateModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={() => setIsCreateModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 p-6 text-left align-middle shadow-2xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white flex items-center gap-2">
                    <KeyIcon className="w-5 h-5 text-red-500" />
                    Create API Key
                  </Dialog.Title>
                  
                  <form onSubmit={handleCreate} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Key Name</label>
                      <input 
                        type="text" 
                        required
                        className="block w-full rounded-xl bg-black/50 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        placeholder="e.g. Website Widget Production"
                        value={keyName}
                        onChange={(e) => setKeyName(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Allowed Domains <span className="text-xs text-gray-500">(Optional)</span>
                      </label>
                      <div className="relative">
                        <GlobeAltIcon className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                        <input 
                          type="text" 
                          className="block w-full rounded-xl bg-black/50 border border-white/10 pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          placeholder="example.com, localhost"
                          value={domains}
                          onChange={(e) => setDomains(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Comma separated list of domains. Leave empty to allow all.</p>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setIsCreateModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Creating...' : 'Create Key'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Success Modal */}
      <Transition appear show={isSuccessModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={() => setIsSuccessModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 p-6 text-left align-middle shadow-2xl transition-all">
                  <div className="flex items-center gap-2 mb-4">
                     <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckIcon className="w-6 h-6 text-green-500" />
                     </div>
                     <Dialog.Title as="h3" className="text-xl font-bold text-white">
                        API Key Created
                     </Dialog.Title>
                  </div>

                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
                    <p className="text-sm text-orange-400">
                      Please copy your API key now. For security reasons, <strong>it will not be shown again.</strong>
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-uppercase text-gray-500 font-bold mb-2">YOUR SECRET KEY</label>
                    <div className="flex items-center gap-2 bg-black border border-white/20 rounded-xl p-1 pr-1">
                      <code className="flex-1 px-3 py-2 text-sm font-mono text-white overflow-x-auto">
                        {newKeyData?.full_key}
                      </code>
                      <button
                        onClick={() => newKeyData && copyToClipboard(newKeyData.full_key)}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Copy to clipboard"
                      >
                        <ClipboardIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="px-6 py-2.5 rounded-xl text-sm font-medium bg-white text-black hover:bg-gray-200 transition-colors"
                      onClick={() => setIsSuccessModalOpen(false)}
                    >
                      Done
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
