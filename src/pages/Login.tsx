import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Lottie from 'lottie-react';
import { useLogin } from '../hooks/useAuth';
import { FolderKanban, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import gradientSphere from '../assets/gradient-sphere.json';
import gradientBlob from '../assets/gradient-blob.json';
import abstract3d from '../assets/abstract-3d.json';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const [error, setError] = useState('');
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    setError('');
    login.mutate(data, {
      onError: (err: Error & { response?: { data?: { message?: string } } }) => {
        setError(err.response?.data?.message || 'Login failed');
      },
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel — dark with Lottie animations */}
      <div className="hidden lg:flex lg:w-1/2 text-white flex-col justify-between p-12 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0f11 0%, #1a1a2e 40%, #16132b 70%, #0f0f11 100%)' }}>
        {/* Lottie animations layer */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Main gradient sphere — center */}
          <div className="absolute inset-0 flex items-center justify-center opacity-70" style={{ animation: 'float-1 8s ease-in-out infinite' }}>
            <Lottie animationData={gradientSphere} loop autoplay style={{ width: '110%', height: '110%' }} />
          </div>
          {/* Gradient blob — top right */}
          <div className="absolute opacity-50" style={{ top: '-5%', right: '-10%', width: '300px', height: '300px', animation: 'drift 10s ease-in-out infinite' }}>
            <Lottie animationData={gradientBlob} loop autoplay />
          </div>
          {/* Gradient blob — bottom left */}
          <div className="absolute opacity-40" style={{ bottom: '-10%', left: '-10%', width: '280px', height: '280px', animation: 'drift 12s ease-in-out infinite -4s' }}>
            <Lottie animationData={gradientBlob} loop autoplay />
          </div>
          {/* Abstract 3D — top left accent */}
          <div className="absolute opacity-60" style={{ top: '5%', left: '5%', width: '120px', height: '120px', animation: 'float-2 6s ease-in-out infinite -2s' }}>
            <Lottie animationData={abstract3d} loop autoplay />
          </div>
          {/* Abstract 3D — bottom right accent */}
          <div className="absolute opacity-40" style={{ bottom: '12%', right: '8%', width: '90px', height: '90px', animation: 'float-3 9s ease-in-out infinite -3s' }}>
            <Lottie animationData={abstract3d} loop autoplay />
          </div>
        </div>

        {/* Dark vignette overlay for text readability */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(15,15,17,0.6) 100%)' }} />

        {/* Content — above animations */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Lead Tracker</span>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Manage your leads<br />with confidence.
          </h2>
          <p className="text-white/50 text-lg max-w-md">
            Track, assign, and convert leads efficiently. Get real-time analytics and team performance insights.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold">10k+</p>
              <p className="text-white/40 text-sm">Leads tracked</p>
            </div>
            <div>
              <p className="text-3xl font-bold">500+</p>
              <p className="text-white/40 text-sm">Teams active</p>
            </div>
            <div>
              <p className="text-3xl font-bold">98%</p>
              <p className="text-white/40 text-sm">Uptime</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-white/20 text-sm">&copy; 2026 Lead Tracker. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-muted/40">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <FolderKanban className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-semibold">Lead Tracker</span>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl">Sign in</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="text-destructive text-xs">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="text-destructive text-xs">{errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={login.isPending}>
                  {login.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {login.isPending ? 'Signing in...' : 'Sign in'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link to="/register" className="text-primary font-medium hover:underline">
                    Sign up
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
