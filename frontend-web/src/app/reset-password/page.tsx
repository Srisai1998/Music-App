'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authAPI } from '../../services/api';
import { Music2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Minimum 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type FormData = z.infer<typeof schema>;

/* Password strength indicator */
function StrengthBar({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special character', pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const color = score <= 1 ? '#ef4444' : score === 2 ? '#f59e0b' : score === 3 ? '#3b82f6' : '#1db954';
  const label = ['', 'Weak', 'Fair', 'Good', 'Strong'][score];

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      {/* Bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: n <= score ? color : '#535353' }}
          />
        ))}
        <span className="text-xs ml-2 font-medium" style={{ color }}>{label}</span>
      </div>
      {/* Checklist */}
      <ul className="space-y-1">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2 text-xs">
            {c.pass
              ? <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
              : <XCircle className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
            <span className={c.pass ? 'text-white' : 'text-muted-foreground'}>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const password = watch('password', '');

  const onSubmit = async ({ password }: FormData) => {
    if (!token) {
      toast.error('Reset token is missing. Please request a new link.');
      return;
    }
    try {
      await authAPI.resetPassword(token, password);
      setDone(true);
      toast.success('Password reset successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reset link has expired. Please request a new one.');
    }
  };

  /* ── Invalid / missing token ── */
  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <XCircle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-white font-bold text-lg">Invalid reset link</h2>
        <p className="text-muted-foreground text-sm">
          This link is invalid or has expired. Please request a new one.
        </p>
        <Link href="/forgot-password" className="inline-block bg-primary text-black font-bold px-6 py-2 rounded-full text-sm hover:scale-105 transition-transform">
          Request new link
        </Link>
      </div>
    );
  }

  /* ── Success state ── */
  if (done) {
    return (
      <div className="text-center space-y-5">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg">Password changed!</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Your password has been reset successfully.
          </p>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="w-full bg-primary text-black font-bold py-3 rounded-full hover:scale-105 transition-transform"
        >
          Log in with new password
        </button>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* New password */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">New password</label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPass ? 'text' : 'password'}
            autoFocus
            autoComplete="new-password"
            placeholder="Enter new password"
            className="w-full px-4 py-3 pr-10 rounded-md bg-[#2a2a2a] border border-[#535353] text-white placeholder-[#535353] focus:outline-none focus:border-white transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
          >
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
        )}
        <StrengthBar password={password} />
      </div>

      {/* Confirm password */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">Confirm password</label>
        <div className="relative">
          <input
            {...register('confirm_password')}
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Re-enter new password"
            className="w-full px-4 py-3 pr-10 rounded-md bg-[#2a2a2a] border border-[#535353] text-white placeholder-[#535353] focus:outline-none focus:border-white transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirm_password && (
          <p className="text-red-400 text-xs mt-1">{errors.confirm_password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-black font-bold py-3 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
      >
        {isSubmitting ? 'Resetting…' : 'Reset password'}
      </button>

      <Link href="/login" className="block text-center text-muted-foreground hover:text-white text-sm transition-colors">
        Back to login
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Music2 className="h-12 w-12 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-white">Set new password</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Choose a strong password you haven't used before
          </p>
        </div>
        <div className="bg-[#121212] rounded-2xl p-8">
          <Suspense fallback={<div className="text-muted-foreground text-center py-4">Loading…</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
