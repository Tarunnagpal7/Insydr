'use client';

import { Fragment, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { createWorkspace, clearError } from '@/src/store/workspace.store';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Spinner from '@/src/components/ui/Spinner';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const timezones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time' },
  { value: 'Asia/Kolkata', label: 'India Standard Time' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
  { value: 'Asia/Shanghai', label: 'China Standard Time' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time' },
];

export default function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
  const dispatch = useAppDispatch();
  const { isCreating, error } = useAppSelector((state) => state.workspace);

  const [formData, setFormData] = useState({
    name: '',
    timezone: 'UTC',
  });

  const [errors, setErrors] = useState<{ name?: string }>({});

  const validateForm = () => {
    const newErrors: { name?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Workspace name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Workspace name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Workspace name must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(createWorkspace({
        name: formData.name.trim(),
        timezone: formData.timezone,
      })).unwrap();

      toast.success('Workspace created successfully!');
      handleClose();
    } catch (err: any) {
      toast.error(err || 'Failed to create workspace');
    }
  };

  const handleClose = () => {
    setFormData({ name: '', timezone: 'UTC' });
    setErrors({});
    dispatch(clearError());
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-6 shadow-2xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Dialog.Title className="text-2xl font-bold text-white">
                      Create Workspace
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-400">
                      Set up a new workspace for your team
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Workspace Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                      Workspace Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        setErrors({ ...errors, name: undefined });
                      }}
                      className={`input bg-black/50 border-white/10 text-white placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="e.g., My Company, Acme Corp"
                      autoFocus
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Timezone */}
                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-300 mb-1">
                      Timezone
                    </label>
                    <div className="relative">
                      <select
                        id="timezone"
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        className="input bg-black/50 border-white/10 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 appearance-none"
                      >
                        {timezones.map((tz) => (
                          <option key={tz.value} value={tz.value} className="bg-zinc-900 text-white">
                            {tz.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      disabled={isCreating}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <div className="flex items-center">
                          <Spinner size="sm" className="mr-2 text-white" />
                          Creating...
                        </div>
                      ) : (
                        'Create Workspace'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
