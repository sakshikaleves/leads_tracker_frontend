import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Lottie from 'lottie-react';
import { useRegister } from '../hooks/useAuth';
import { FolderKanban, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import gradientSphere from '../assets/gradient-sphere.json';
import gradientBlob from '../assets/gradient-blob.json';
import abstract3d from '../assets/abstract-3d.json';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  phoneNumber: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const [error, setError] = useState('');
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterForm) => {
    setError('');
    registerMutation.mutate(
      { name: data.name, email: data.email, password: data.password, phoneNumber: data.phoneNumber },
      {
        onError: (err: Error & { response?: { data?: { message?: string } } }) => {
          setError(err.response?.data?.message || 'Registration failed');
        },
      }
    );
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
            Start tracking<br />leads today.
          </h2>
          <p className="text-white/50 text-lg max-w-md">
            Create your free account and set up your first tracker in minutes. Invite your team and start converting.
          </p>
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
              <CardTitle className="text-xl">Create account</CardTitle>
              <CardDescription>Fill in your details to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    {...register('name')}
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="text-destructive text-xs">{errors.name.message}</p>
                  )}
                </div>

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
                  <Label htmlFor="phoneNumber">Phone Number <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    {...register('phoneNumber')}
                    placeholder="+1234567890"
                  />
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                  {registerMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {registerMutation.isPending ? 'Creating account...' : 'Create account'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Sign in
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
