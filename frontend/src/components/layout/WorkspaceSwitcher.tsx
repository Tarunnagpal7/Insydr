'use client';

import { Fragment, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { setCurrentWorkspace } from '@/src/store/workspace.store';
import { Workspace } from '@/src/lib/workspace';
import { CheckIcon, ChevronUpDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Listbox, Transition } from '@headlessui/react';

interface WorkspaceSwitcherProps {
  onCreateNew?: () => void;
}

export default function WorkspaceSwitcher({ onCreateNew }: WorkspaceSwitcherProps) {
  const dispatch = useAppDispatch();
  const { workspaces, currentWorkspace } = useAppSelector((state) => state.workspace);

  const handleChange = (workspace: Workspace) => {
    dispatch(setCurrentWorkspace(workspace));
  };

  return (
    <Listbox value={currentWorkspace || undefined} onChange={handleChange}>
      {({ open }) => (
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-white/5 py-2.5 pl-3 pr-10 text-left hover:bg-white/10 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500/50">
            <span className="flex items-center space-x-3">
              {currentWorkspace ? (
                <>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg shadow-red-900/20">
                    {currentWorkspace.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block truncate text-sm font-medium text-white">
                      {currentWorkspace.name}
                    </span>
                    <span className="block truncate text-xs text-gray-500 group-hover:text-gray-400">
                      {currentWorkspace.role}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-sm text-gray-400">
                  Select workspace
                </span>
              )}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
            </span>
          </Listbox.Button>

          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-zinc-900/90 backdrop-blur-xl border border-white/10 py-1 shadow-2xl focus:outline-none custom-scrollbar">
              {workspaces.map((workspace) => (
                <Listbox.Option
                  key={workspace.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2.5 pl-3 pr-9 transition-colors ${
                      active
                        ? 'bg-red-600/10 text-white'
                        : 'text-gray-300'
                    }`
                  }
                  value={workspace}
                >
                  {({ selected }) => (
                    <>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md shadow-red-900/20">
                          {workspace.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`block truncate text-sm ${selected ? 'font-semibold text-white' : 'font-medium'}`}>
                            {workspace.name}
                          </span>
                          <span className="block truncate text-xs text-gray-500">
                            {workspace.stats?.total_agents || 0} agents · {workspace.role}
                          </span>
                        </div>
                      </div>

                      {selected && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-500">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}

              {/* Create New Workspace */}
              <button
                onClick={onCreateNew}
                className="relative w-full cursor-pointer select-none py-2.5 pl-3 pr-9 text-left hover:bg-white/5 border-t border-white/10 mt-1 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg border border-dashed border-gray-600 flex items-center justify-center flex-shrink-0">
                    <PlusIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <span className="block text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    Create new workspace
                  </span>
                </div>
              </button>
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
}
