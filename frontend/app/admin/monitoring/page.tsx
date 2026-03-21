'use client';

import { useState, useEffect } from 'react';
import { 
  getAdminHealth, 
  getMonitoringAlerts, 
  resolveMonitoringAlert, 
  SystemHealth, 
  AdminAlert 
} from '@/src/features/admin/admin.service';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ServerIcon,
  CircleStackIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

const HealthStatusIcon = ({ status }: { status: string }) => {
  if (status === 'ok') return <CheckCircleIcon className="w-5 h-5 text-emerald-500" />;
  if (status.startsWith('warning')) return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
  return <XCircleIcon className="w-5 h-5 text-red-500" />;
};

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
};

export default function AdminMonitoringPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError('');
      const [healthData, alertsData] = await Promise.all([
        getAdminHealth(),
        getMonitoringAlerts()
      ]);
      setHealth(healthData);
      setAlerts(alertsData.alerts || []);
    } catch (err: any) {
      console.error('Failed to fetch monitoring data', err);
      setError(err?.response?.data?.detail || 'Failed to load monitoring data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds automatically
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (hash: string) => {
    try {
      await resolveMonitoringAlert(hash);
      setAlerts(alerts.filter(a => a.hash !== hash));
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to resolve alert');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">System Monitoring</h1>
          <p className="text-sm text-zinc-400 mt-1">Real-time health status and error alerts</p>
        </div>
        
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Health Probes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* App Status */}
        <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 flex flex-col justify-between h-[120px]">
          <div className="flex items-start justify-between">
            <div className="p-2 bg-white/5 rounded-lg">
              <ServerIcon className="w-5 h-5 text-zinc-400" />
            </div>
            {health && <HealthStatusIcon status={health.status} />}
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-400">Application API</h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-semibold text-white">
                {health?.status === 'ok' ? 'Healthy' : 'Unhealthy'}
              </span>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 flex flex-col justify-between h-[120px]">
          <div className="flex items-start justify-between">
            <div className="p-2 bg-white/5 rounded-lg">
              <CircleStackIcon className="w-5 h-5 text-zinc-400" />
            </div>
            {health && <HealthStatusIcon status={health.database} />}
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-400">PostgreSQL</h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-semibold text-white truncate max-w-full" title={health?.database}>
                {health?.database === 'ok' ? 'Connected' : health?.database || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Redis */}
        <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 flex flex-col justify-between h-[120px]">
          <div className="flex items-start justify-between">
            <div className="p-2 bg-white/5 rounded-lg">
              <ServerIcon className="w-5 h-5 text-red-400" />
            </div>
            {health && <HealthStatusIcon status={health.redis} />}
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-400">Redis Cache</h3>
            <div className="mt-1 flex items-baseline gap-2">
               <span className="text-xl font-semibold text-white truncate max-w-full" title={health?.redis}>
                {health?.redis === 'ok' ? 'Connected' : health?.redis || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 flex flex-col justify-between h-[120px]">
          <div className="flex items-start justify-between">
            <div className="p-2 bg-white/5 rounded-lg">
              <HeartIcon className="w-5 h-5 text-zinc-400" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-400">Server Uptime</h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-semibold text-white">
                {health?.uptime_seconds ? formatUptime(health.uptime_seconds) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-white">Critical System Errors</h3>
            <p className="text-xs text-zinc-400 mt-1">Deduplicated exceptions requiring attention</p>
          </div>
          <div className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
            <span className="text-xs font-medium text-red-400">{alerts.length} Active</span>
          </div>
        </div>
        
        <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 flex flex-col items-center">
              <CheckCircleIcon className="w-10 h-10 text-zinc-700 mb-3" />
              <p>No active alerts! The system is running smoothly.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.hash} className="p-6 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-xs font-bold rounded">
                          {alert.type}
                        </span>
                        <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md">
                           Occurred {alert.count} time{alert.count > 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-zinc-500">
                           Last seen: {new Date(alert.last_seen * 1000).toLocaleString()}
                        </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-2">{alert.message}</h4>
                    
                    <div className="mt-3 relative rounded-lg bg-zinc-950 border border-white/5 p-4 overflow-x-auto">
                      <pre className="text-xs text-zinc-400 font-mono leading-relaxed">
                        {alert.stack_trace}
                      </pre>
                    </div>

                    {alert.context && Object.keys(alert.context).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                         {Object.entries(alert.context).map(([k, v]) => (
                            <span key={k} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-300 border border-white/5">
                              <span className="text-zinc-500 mr-1">{k}:</span> {String(v)}
                            </span>
                         ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleResolve(alert.hash)}
                    className="shrink-0 inline-flex items-center px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-white/10 rounded-lg transition-colors"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
