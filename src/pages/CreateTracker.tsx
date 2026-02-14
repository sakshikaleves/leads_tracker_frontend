import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft } from 'lucide-react';
import { trackerApi } from '../api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';

const trackerSchema = z.object({
  trackerName: z.string().min(1, 'Tracker name is required'),
  businessName: z.string().min(1, 'Business name is required'),
  trackerMode: z.enum(['SINGULAR', 'MULTI']),
});

type TrackerForm = z.infer<typeof trackerSchema>;

export function CreateTracker() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: TrackerForm) => trackerApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['trackers'] });
      navigate(`/trackers/${response.data.trackerId}`);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Failed to create tracker');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrackerForm>({
    resolver: zodResolver(trackerSchema),
    defaultValues: {
      trackerMode: 'MULTI',
    },
  });

  return (
    <div className="max-w-lg mx-auto">
      <Link to="/trackers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="w-4 h-4" />
        Back to Trackers
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create New Tracker</CardTitle>
          <CardDescription>Set up a new lead tracker for your business</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="trackerName">
                Tracker Name
              </Label>
              <Input
                id="trackerName"
                {...register('trackerName')}
                placeholder="e.g., Q1 2024 Leads"
              />
              {errors.trackerName && (
                <p className="text-destructive text-sm mt-1">{errors.trackerName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="businessName">
                Business Name
              </Label>
              <Input
                id="businessName"
                {...register('businessName')}
                placeholder="e.g., Acme Corp"
              />
              {errors.businessName && (
                <p className="text-destructive text-sm mt-1">{errors.businessName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="trackerMode">
                Tracker Mode
              </Label>
              <select
                id="trackerMode"
                {...register('trackerMode')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="MULTI">Multi (Multiple members can add leads)</option>
                <option value="SINGULAR">Singular (Only owner can add leads)</option>
              </select>
              <p className="text-muted-foreground text-sm mt-1">
                Singular mode: Only you can add leads. Others can only view.
              </p>
            </div>

            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Tracker'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
