'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { registerUser } from '../../store/slices/authSlice';
import { useRouter } from 'next/navigation';
import { Music2 } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Invalid email'),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/i, 'Alphanumeric and _ only'),
  display_name: z.string().min(1).max(100),
  password: z.string().min(8, 'Minimum 8 characters'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading } = useAppSelector((s) => s.auth);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const { confirm_password, ...rest } = data;
    const result = await dispatch(registerUser(rest));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created! Please verify your email.');
      router.push('/');
    } else {
      toast.error(result.payload as string || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Music2 className="h-12 w-12 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-white">Sign up for free</h1>
        </div>

        <div className="bg-[#121212] rounded-2xl p-8">
          {/* Google Sign Up */}
          <button
            onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`; }}
            className="w-full flex items-center justify-center gap-3 border border-[#535353] rounded-full py-3 text-white hover:border-white transition-colors font-medium mb-6"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#535353]" />
            <span className="text-muted-foreground text-sm">or register with email</span>
            <div className="flex-1 h-px bg-[#535353]" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              { key: 'email', label: 'Email address', type: 'email', placeholder: 'name@example.com' },
              { key: 'username', label: 'Username', type: 'text', placeholder: 'cooluser123' },
              { key: 'display_name', label: 'Display name', type: 'text', placeholder: 'Your Name' },
              { key: 'password', label: 'Password', type: 'password', placeholder: 'Min 8 characters' },
              { key: 'confirm_password', label: 'Confirm password', type: 'password', placeholder: 'Re-enter password' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-white text-sm font-medium mb-2">{label}</label>
                <input
                  {...register(key as any)}
                  type={type}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 rounded-md bg-[#2a2a2a] border border-[#535353] text-white placeholder-[#535353] focus:outline-none focus:border-white"
                />
                {(errors as any)[key] && (
                  <p className="text-red-400 text-xs mt-1">{(errors as any)[key]?.message}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-black font-bold py-3 rounded-full hover:scale-105 transition-transform disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Creating account...' : 'Sign Up Free'}
            </button>
          </form>

          <p className="text-muted-foreground text-xs text-center mt-4">
            By registering, you agree to our{' '}
            <Link href="/terms" className="underline text-white">Terms</Link> and{' '}
            <Link href="/privacy" className="underline text-white">Privacy Policy</Link>.
          </p>

          <div className="border-t border-[#535353] pt-6 text-center mt-6">
            <span className="text-muted-foreground text-sm">Already have an account? </span>
            <Link href="/login" className="text-white font-bold underline text-sm hover:text-primary">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
