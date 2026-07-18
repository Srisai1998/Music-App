'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authAPI } from '../../services/api';
import { Music2, Mail, ArrowLeft, CheckCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: FormData) => {
    try {
      const { data } = await authAPI.forgotPassword(email);
      setSubmittedEmail(email);
      // In dev mode the API returns the reset URL directly
      if (data?.dev_reset_url) {
        setDevResetUrl(data.dev_reset_url);
      }
      setSubmitted(true);
    } catch {
      // Always show success to prevent email enumeration
      setSubmittedEmail(email);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Music2 className="h-12 w-12 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-white">
            {submitted ? 'Check your email' : 'Reset your password'}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {submitted
              ? `We sent a reset link to ${submittedEmail}`
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        <div className="bg-[#121212] rounded-2xl p-8">
          {/* ── Success state ── */}
          {submitted ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-white text-sm">
                  If an account exists for{' '}
                  <span className="font-semibold text-primary">{submittedEmail}</span>,
                  you will receive a password reset email shortly.
                </p>
                <p className="text-muted-foreground text-xs">
                  Check your spam folder if you don&apos;t see it in a few minutes.
                </p>
              </div>

              {/* ── Dev mode: show direct reset link ── */}
              {devResetUrl && (
                <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/5 p-4 text-left space-y-3">
                  <p className="text-yellow-400 text-xs font-bold uppercase tracking-wide">
                    🛠 Dev Mode — Direct Reset Link
                  </p>
                  <p className="text-yellow-200 text-xs">
                    No email configured. Click below to reset your password directly:
                  </p>
                  <a
                    href={devResetUrl}
                    className="flex items-center gap-2 w-full justify-center bg-yellow-500 text-black font-bold py-2.5 rounded-full text-sm hover:bg-yellow-400 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Reset Password Page
                  </a>
                  <p className="text-yellow-600 text-xs break-all font-mono">{devResetUrl}</p>
                </div>
              )}

              {/* Resend */}
              <button
                onClick={() => { setSubmitted(false); setSubmittedEmail(''); setDevResetUrl(null); }}
                className="text-primary text-sm hover:underline"
              >
                Try a different email address
              </button>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full border border-[#535353] rounded-full py-3 text-white hover:border-white transition-colors text-sm font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            /* ── Form state ── */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    {...register('email')}
                    type="email"
                    autoFocus
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-md bg-[#2a2a2a] border border-[#535353] text-white placeholder-[#535353] focus:outline-none focus:border-white transition-colors"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-black font-bold py-3 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-muted-foreground hover:text-white text-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
