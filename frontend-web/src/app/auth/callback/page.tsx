'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppDispatch } from '../../../hooks/useRedux';
import { setTokens, fetchMe } from '../../../store/slices/authSlice';
import { Music2 } from 'lucide-react';

function CallbackHandler() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      dispatch(setTokens({ accessToken, refreshToken }));
      dispatch(fetchMe()).then(() => {
        router.replace('/');
      });
    } else {
      router.replace('/login');
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-white text-sm">Completing sign-in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-6">
      <Music2 className="h-12 w-12 text-primary" />
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-sm">Loading…</p>
        </div>
      }>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
