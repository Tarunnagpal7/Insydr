'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { invitationApi, InvitationDetails } from '@/src/lib/invitation';
import { useAppSelector, useAppDispatch } from '@/src/store/hooks';
import { initializeAuth } from '@/src/store/auth.store';
import { motion } from 'framer-motion';
import Loading from '@/src/components/ui/Loading';
import { UserGroupIcon,  CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);
  
  const token = params.token as string;
  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
        dispatch(initializeAuth());
    }
  }, [isInitialized, dispatch]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await invitationApi.getDetails(token);
        setDetails(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Invalid or expired invitation');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDetails();
    }
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
        // Redirect to login with return url
        router.push(`/login?redirect=/invitation/${token}`);
        return;
    }

    setAccepting(true);
    try {
        await invitationApi.accept(token);
        toast.success('Successfully joined workspace!');
        router.push(`/workspace/${details?.invitation.workspace_id}`);
    } catch (err: any) {
        toast.error(err.response?.data?.detail || 'Failed to accept invitation');
        setAccepting(false);
    }
  };

  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircleIcon className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Invitation Error</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <Link 
                href="/dashboard"
                className="inline-block px-6 py-2.5 bg-white text-black font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
                Go to Dashboard
            </Link>
        </div>
      </div>
    );
  }

  if (!details) return null;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3" />
        </div>

        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 max-w-md w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-900/20">
                    <span className="text-3xl font-bold text-white">{details.workspace_name[0].toUpperCase()}</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Join {details.workspace_name}</h1>
                <p className="text-gray-400">
                    <span className="text-white font-medium">{details.inviter_name}</span> has invited you to join their workspace on Insydr.
                </p>
            </div>

            <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <UserGroupIcon className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">Collaborate</p>
                        <p className="text-xs text-gray-400">Build agents together with your team</p>
                    </div>
                </div>

                <div className="pt-4">
                    {!isAuthenticated ? (
                        <div className="space-y-3">
                            <button
                                onClick={handleAccept}
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                            >
                                Log in to Accept Invitation
                            </button>
                            <p className="text-xs text-center text-gray-500">
                                You need an Insydr account to join this workspace.
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={handleAccept}
                            disabled={accepting}
                            className="w-full py-3 bg-white hover:bg-gray-100 text-black rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {accepting ? (
                                'Joining...'
                            ) : (
                                <>
                                    <CheckCircleIcon className="w-5 h-5" />
                                    Accept Invitation
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    </div>
  );
}
