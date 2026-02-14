import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft } from 'lucide-react';
import { leadApi, trackerApi } from '../api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';

const leadSchema = z.object({
  leadType: z.enum(['NEW', 'YELLOW']),
  leadName: z.string().optional(),
  leadEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  leadContact: z.string().optional(),
  signupDate: z.string().optional(),
  sourceChannel: z.enum(['LinkedIn', 'Website', 'Referral', 'Cold Call', 'Event', 'Other', '']).optional(),
  sourceBdaId: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  city: z.string().optional(),
  leadWants: z.string().min(1, 'Lead wants is required'),
  description: z.string().min(1, 'Description is required'),
  notesForTeam: z.string().optional(),
  additionalDetails: z.string().optional(),
});

type LeadForm = z.infer<typeof leadSchema>;

export function EditLead() {
  const { id, leadId } = useParams<{ id: string; leadId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: leadResponse, isLoading } = useQuery({
    queryKey: ['lead', id, leadId],
    queryFn: () => leadApi.get(id!, leadId!),
    enabled: !!id && !!leadId,
  });

  const { data: membersResponse } = useQuery({
    queryKey: ['members', id],
    queryFn: () => trackerApi.getMembers(id!),
    enabled: !!id,
  });
  const members = membersResponse?.data || [];

  const updateMutation = useMutation({
    mutationFn: (data: LeadForm) => leadApi.update(id!, leadId!, {
      ...data,
      sourceChannel: data.sourceChannel || undefined,
      sourceBdaId: data.sourceBdaId || undefined,
    } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', id] });
      queryClient.invalidateQueries({ queryKey: ['lead', id, leadId] });
      navigate(`/trackers/${id}`);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Failed to update lead');
    },
  });

  const lead = leadResponse?.data;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    values: lead
      ? {
          leadType: lead.leadType,
          leadName: lead.leadName || '',
          leadEmail: lead.leadEmail || '',
          leadContact: lead.leadContact || '',
          signupDate: lead.signupDate ? lead.signupDate.split('T')[0] : '',
          sourceChannel: (lead.sourceChannel as any) || '',
          sourceBdaId: lead.sourceBdaId || '',
          country: lead.country,
          city: lead.city || '',
          leadWants: lead.leadWants,
          description: lead.description,
          notesForTeam: lead.notesForTeam || '',
          additionalDetails: lead.additionalDetails || '',
        }
      : undefined,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-4 w-32 mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Skeleton className="h-4 w-28 mb-3" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-36 mb-3" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!lead) {
    return <div className="text-center py-8 text-muted-foreground">Lead not found</div>;
  }

  const selectClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to={`/trackers/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Tracker
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Lead {lead.serialNumber ? `#${lead.serialNumber}` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Lead Information */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Lead Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Lead Name</Label>
                  <Input {...register('leadName')} placeholder="John Doe" />
                </div>
                <div>
                  <Label>Lead Email</Label>
                  <Input {...register('leadEmail')} type="email" placeholder="john@example.com" />
                  {errors.leadEmail && <p className="text-destructive text-sm mt-1">{errors.leadEmail.message}</p>}
                </div>
                <div>
                  <Label>Lead Contact</Label>
                  <Input {...register('leadContact')} placeholder="+1 234 567 8900" />
                </div>
                <div>
                  <Label>Signup Date</Label>
                  <Input {...register('signupDate')} type="date" />
                </div>
              </div>
            </div>

            {/* Source & Classification */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Source & Classification</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Lead Type *</Label>
                  <select {...register('leadType')} className={selectClassName}>
                    <option value="NEW">New</option>
                    <option value="YELLOW">Yellow</option>
                  </select>
                </div>
                <div>
                  <Label>Lead Wants *</Label>
                  <select {...register('leadWants')} className={selectClassName}>
                    <option value="">Select...</option>
                    <option value="Website">Website</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Web App">Web App</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="CRM">CRM</option>
                    <option value="ERP">ERP</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.leadWants && <p className="text-destructive text-sm mt-1">{errors.leadWants.message}</p>}
                </div>
                <div>
                  <Label>Source Channel</Label>
                  <select {...register('sourceChannel')} className={selectClassName}>
                    <option value="">Select...</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Event">Event</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Sourced By</Label>
                  <select {...register('sourceBdaId')} className={selectClassName}>
                    <option value="">Select team member...</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>{m.name || m.email}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Location</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Country *</Label>
                  <select {...register('country')} className={selectClassName}>
                    <option value="">Select country...</option>
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="UAE">UAE</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Japan">Japan</option>
                    <option value="South Korea">South Korea</option>
                    <option value="Brazil">Brazil</option>
                    <option value="Mexico">Mexico</option>
                    <option value="South Africa">South Africa</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Kenya">Kenya</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="Philippines">Philippines</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.country && <p className="text-destructive text-sm mt-1">{errors.country.message}</p>}
                </div>
                <div>
                  <Label>City</Label>
                  <Input {...register('city')} placeholder="e.g., Mumbai, New York" />
                </div>
              </div>
            </div>

            {/* Details */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Details</h3>
              <div className="space-y-4">
                <div>
                  <Label>Description *</Label>
                  <Textarea {...register('description')} className="min-h-24" placeholder="What exactly does the lead want?" />
                  {errors.description && <p className="text-destructive text-sm mt-1">{errors.description.message}</p>}
                </div>
                <div>
                  <Label>Notes for BD/Tech Team</Label>
                  <Textarea {...register('notesForTeam')} className="min-h-20" placeholder="Important notes before reaching out..." />
                </div>
                <div>
                  <Label>Additional Details</Label>
                  <Textarea {...register('additionalDetails')} className="min-h-20" placeholder="Any other relevant information..." />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" asChild>
                <Link to={`/trackers/${id}`}>
                  Cancel
                </Link>
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
