'use client';

import { useState, useEffect, Fragment } from 'react';
import { motion } from 'framer-motion';
import { 
  CubeTransparentIcon, 
  TrashIcon, 
  UserGroupIcon, 
  ShieldCheckIcon,
  CodeBracketIcon,
  ChevronRightIcon,
  XMarkIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/src/store/hooks';
import { updateWorkspace, deleteWorkspace, fetchMembers, inviteMember, removeMember, fetchInvitations } from '@/src/store/workspace.store';
import { Dialog, Transition } from '@headlessui/react';

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentWorkspace, members, invitations } = useAppSelector((state) => state.workspace);
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Invite State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
        setWorkspaceName(currentWorkspace.name);
        dispatch(fetchMembers(currentWorkspace.id));
        
        // Fetch invitations if admin
        const isAdmin = currentWorkspace.role === 'OWNER' || currentWorkspace.role === 'ADMIN';
        if (isAdmin) {
            dispatch(fetchInvitations(currentWorkspace.id));
        }
    }
  }, [currentWorkspace, dispatch]);



  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;
    
    setIsSaving(true);
    try {
      await dispatch(updateWorkspace({ 
        id: currentWorkspace.id, 
        data: { name: workspaceName } 
      })).unwrap();
      toast.success('Workspace updated successfully');
    } catch (error) {
      toast.error('Failed to update workspace');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentWorkspace) return;
    
    if (confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
        try {
            await dispatch(deleteWorkspace(currentWorkspace.id)).unwrap();
            toast.success('Workspace deleted');
            router.push('/workspaces');
        } catch (error) {
            toast.error('Failed to delete workspace');
            console.error(error);
        }
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentWorkspace) return;

      setIsInviting(true);
      try {
          await dispatch(inviteMember({
              workspaceId: currentWorkspace.id,
              data: { email: inviteEmail, role: 'MEMBER' }
          })).unwrap();
          toast.success('Invitation sent successfully');
          setIsInviteModalOpen(false);
          setInviteEmail('');
          // Refresh members? Or just wait for them to accept?
          // Usually invites are separate from members until accepted, 
          // but for now we might want to show pending invites if API returned them
          // Currently getMembers only returns users.
          // TODO: Fetch pending invites separately or include in getMembers
      } catch (error: any) {
          const errorMessage = typeof error === 'string' 
              ? error 
              : error?.message || 'Failed to send invitation';
          toast.error(errorMessage);
      } finally {
          setIsInviting(false);
      }
  };

  const handleRemoveMember = async (memberId: string) => {
      if (!currentWorkspace) return;
      if (!confirm('Are you sure you want to remove this member?')) return;

      try {
          await dispatch(removeMember({ workspaceId: currentWorkspace.id, memberId })).unwrap();
          toast.success('Member removed');
      } catch (error) {
          toast.error('Failed to remove member');
      }
  };

  if (!currentWorkspace) return null;

  const isAdmin = currentWorkspace.role === 'OWNER' || currentWorkspace.role === 'ADMIN';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white">Workspace Settings</h1>
        <p className="text-gray-400 mt-2">Manage your workspace configuration and team members.</p>
      </motion.div>

      {/* General Settings */}
      {isAdmin && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <CubeTransparentIcon className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">General Settings</h2>
            <p className="text-sm text-gray-400">Basic information about your workspace</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Workspace Name</label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder-gray-600"
              placeholder="e.g. Acme Corp"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Workspace ID</label>
            <div className="flex items-center gap-3">
              <code className="bg-black/50 px-3 py-2 rounded-lg text-gray-400 font-mono text-sm border border-white/5 w-full">
                {currentWorkspace.id}
              </code>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
      )}

      {/* Team Members */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <UserGroupIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Team Members</h2>
              <p className="text-sm text-gray-400">
                  {isAdmin ? 'Manage who has access to this workspace' : 'People in this workspace'}
              </p>
            </div>
          </div>
          {isAdmin && (
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all"
          >
            Invite Member
          </button>
          )}
        </div>

        <div className="space-y-4">
            {members.map((member) => (
                <div key={member.id || member.user_id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold">
                            {member.user_name ? member.user_name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{member.user_name || member.user_email}</p>
                            <p className="text-xs text-gray-400">{member.role}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Active</span>
                        {isAdmin && member.role !== 'OWNER' && (
                            <button 
                                onClick={() => handleRemoveMember(member.id)}
                                className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-500 transition-colors"
                                title="Remove member"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            ))}
            
            {members.length === 0 && (
                 <p className="text-center text-sm text-gray-500 py-4">No members found.</p>
            )}

            {/* Pending Invitations */}
            {isAdmin && invitations.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/10">
                    <h3 className="text-sm font-semibold text-white mb-4">Pending Invitations</h3>
                    <div className="space-y-3">
                        {invitations.map((invitation) => (
                            <div key={invitation.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/10 rounded-lg">
                                        <EnvelopeIcon className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{invitation.email}</p>
                                        <p className="text-xs text-gray-400">Invited on {new Date(invitation.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded">Pending</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </motion.div>

      {/* API & Integrations */}
      {isAdmin && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-white/20 transition-all group"
        onClick={() => window.location.href = `/workspace/${currentWorkspace.id}/settings/api-keys`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
              <CodeBracketIcon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">API Keys & Integrations</h2>
              <p className="text-sm text-gray-400">Manage API keys and access controls for your applications</p>
            </div>
          </div>
          <ChevronRightIcon className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
        </div>
      </motion.div>
      )}

      {/* Danger Zone */}
      {isAdmin && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl max-h-min">
              <ShieldCheckIcon className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Danger Zone</h2>
              <p className="text-sm text-gray-400 mt-1">
                Irreversible actions for your workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between p-4 bg-black/40 rounded-xl border border-red-500/10">
            <div>
                <p className="font-medium text-white">Delete Workspace</p>
                <p className="text-sm text-gray-400">Once deleted, it will be gone forever. Please be certain.</p>
            </div>
            <button 
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20 transition-all"
            >
                Delete Workspace
            </button>
        </div>
      </motion.div>
      )}

      {/* Invite Modal - Only render if isAdmin, or rely on button visibility */}
      <Transition appear show={isInviteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsInviteModalOpen(false)}>
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
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-bold leading-6 text-white"
                    >
                      Invite Member
                    </Dialog.Title>
                    <button
                      onClick={() => setIsInviteModalOpen(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleInvite} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Email Address</label>
                        <div className="relative">
                            <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="email"
                                required
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder-gray-600"
                                placeholder="colleague@company.com"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsInviteModalOpen(false)}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isInviting}
                            className="px-6 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50"
                        >
                            {isInviting ? 'Sending...' : 'Send Invitation'}
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
