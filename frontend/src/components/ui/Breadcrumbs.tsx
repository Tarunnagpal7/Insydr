'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useAppSelector } from '@/src/store/hooks';

const ROUTE_LABELS: Record<string, string> = {
  workspace: 'Workspace',
  agents: 'Agents',
  knowledge: 'Knowledge Base',
  analytics: 'Analytics',
  settings: 'Settings',
  'api-keys': 'API Keys',
  new: 'Create New',
  profile: 'Profile',
  billing: 'Billing',
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const params = useParams();
  const workspaceId = params.id as string;
  const { currentWorkspace } = useAppSelector((state) => state.workspace);
  const { agents } = useAppSelector((state) => state.agent);

  if (!pathname || !workspaceId) return null;

  // Build breadcrumb segments
  const basePath = `/workspace/${workspaceId}`;
  const relativePath = pathname.replace(basePath, '');
  const segments = relativePath.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: { label: string; href: string }[] = [];

  let currentPath = basePath;
  for (const segment of segments) {
    currentPath += `/${segment}`;

    // Try to resolve dynamic segment labels
    let label = ROUTE_LABELS[segment] || segment;

    // Check if this is an agent ID
    if (params.agentId && segment === params.agentId) {
      const agent = agents.find((a) => a.id === segment);
      label = agent?.name || 'Agent';
    }

    // Check if this is a UUID (generic)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
      if (!label || label === segment) {
        label = 'Details';
      }
    }

    crumbs.push({ label, href: currentPath });
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm mb-4" aria-label="Breadcrumb">
      <Link
        href={basePath}
        className="flex items-center gap-1 text-gray-500 hover:text-white transition-colors"
      >
        <HomeIcon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{currentWorkspace?.name || 'Home'}</span>
      </Link>

      {crumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRightIcon className="w-3 h-3 text-gray-600" />
          {index === crumbs.length - 1 ? (
            <span className="text-white font-medium truncate max-w-[200px]">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="text-gray-400 hover:text-white transition-colors truncate max-w-[150px]"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
