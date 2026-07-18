'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { loginUser } from '../../store/slices/authSlice';
import { useRouter } from 'next/navigation';
import { Music2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading } = useAppSelector((s) => s.auth);
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const result = await dispatch(loginUser(data as { email: string; password: string }));
    if (loginUser.fulfilled.match(result)) {
      toast.success('Welcome back!');
      router.push('/');
    } else {
      toast.error(result.payload as string || 'Login failed');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Music2 className="h-12 w-12 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-white">Log in to Music App</h1>
        </div>

        <div className="bg-[#121212] rounded-2xl p-8 space-y-4">
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border border-[#535353] rounded-full py-3 text-white hover:border-white transition-colors font-medium"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#535353]" />
            <span className="text-muted-foreground text-sm">or</span>
            <div className="flex-1 h-px bg-[#535353]" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Email address</label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-4 py-3 rounded-md bg-[#2a2a2a] border border-[#535353] text-white placeholder-[#535353] focus:outline-none focus:border-white"
                placeholder="name@example.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  className="w-full px-4 py-3 rounded-md bg-[#2a2a2a] border border-[#535353] text-white placeholder-[#535353] focus:outline-none focus:border-white pr-10"
                  placeholder="Password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-black font-bold py-3 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="text-center">
            <Link href="/forgot-password" className="text-muted-foreground hover:text-white text-sm underline">
              Forgot your password?
            </Link>
          </div>

          <div className="border-t border-[#535353] pt-6 text-center">
            <span className="text-muted-foreground text-sm">Don't have an account? </span>
            <Link href="/register" className="text-white font-bold underline text-sm hover:text-primary transition-colors">
              Sign up for Music App
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
