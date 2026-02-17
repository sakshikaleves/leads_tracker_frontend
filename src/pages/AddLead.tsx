import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { leadApi, trackerApi } from '../api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';

const countryCodes = [
  { code: '+91', label: 'IN +91' },
  { code: '+1', label: 'US +1' },
  { code: '+44', label: 'UK +44' },
  { code: '+1', label: 'CA +1' },
  { code: '+61', label: 'AU +61' },
  { code: '+49', label: 'DE +49' },
  { code: '+33', label: 'FR +33' },
  { code: '+971', label: 'AE +971' },
  { code: '+966', label: 'SA +966' },
  { code: '+65', label: 'SG +65' },
  { code: '+81', label: 'JP +81' },
  { code: '+82', label: 'KR +82' },
  { code: '+55', label: 'BR +55' },
  { code: '+52', label: 'MX +52' },
  { code: '+27', label: 'ZA +27' },
  { code: '+234', label: 'NG +234' },
  { code: '+254', label: 'KE +254' },
  { code: '+60', label: 'MY +60' },
  { code: '+62', label: 'ID +62' },
  { code: '+63', label: 'PH +63' },
];

const leadSchema = z.object({
  leadType: z.enum(['NEW', 'YELLOW']),
  leadName: z.string().optional(),
  leadEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  countryCode: z.string().optional(),
  phoneNumber: z.string().optional(),
  socialLink: z.string().url('Invalid URL').optional().or(z.literal('')),
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

export function AddLead() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<{ isDuplicate: boolean; duplicates: any[] } | null>(null);

  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ['members', id],
    queryFn: () => trackerApi.getMembers(id!),
    enabled: !!id,
  });
  const members = membersResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: LeadForm) => {
      const leadContact = data.phoneNumber
        ? `${data.countryCode || '+91'} ${data.phoneNumber}`
        : undefined;
      const { countryCode, phoneNumber, ...rest } = data;
      return leadApi.create(id!, {
        ...rest,
        leadContact,
        sourceChannel: data.sourceChannel || undefined,
        sourceBdaId: data.sourceBdaId || undefined,
      } as any);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['leads', id] });
      if (res.data && (res.data as any).isDuplicate) {
        setDuplicateWarning({ isDuplicate: true, duplicates: (res.data as any).duplicates || [] });
      }
      navigate(`/trackers/${id}`);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Failed to add lead');
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      leadType: 'NEW',
      countryCode: '+91',
    },
  });

  // Live duplicate check on blur
  const handleDuplicateCheck = async () => {
    const email = watch('leadEmail');
    const name = watch('leadName');
    if (!email && !name) return;
    try {
      const res = await leadApi.checkDuplicate(id!, email || undefined, name || undefined);
      if (res.data.isDuplicate) {
        setDuplicateWarning(res.data);
      } else {
        setDuplicateWarning(null);
      }
    } catch { /* ignore */ }
  };

  const selectClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  if (membersLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-4 w-32 mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-40" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Skeleton className="h-4 w-28 mb-3" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-36 mb-3" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
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
          <CardTitle>Add New Lead</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {duplicateWarning?.isDuplicate && (
              <Alert className="border-amber-300 bg-amber-50 text-amber-900 [&>svg]:text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Potential Duplicate</AlertTitle>
                <AlertDescription>
                  A lead with similar email or name already exists in this tracker.
                  {duplicateWarning.duplicates.map((d: any) => (
                    <div key={d.leadId} className="text-xs mt-1">
                      - {d.leadName || 'No name'} ({d.leadEmail || 'No email'})
                    </div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            {/* Lead Information */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Lead Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1">Lead Name</Label>
                  <Input
                    {...register('leadName')}
                    placeholder="John Doe"
                    onBlur={handleDuplicateCheck}
                  />
                </div>
                <div>
                  <Label className="mb-1">Lead Email</Label>
                  <Input
                    {...register('leadEmail')}
                    type="email"
                    placeholder="john@example.com"
                    onBlur={handleDuplicateCheck}
                  />
                  {errors.leadEmail && (
                    <p className="text-destructive text-sm mt-1">{errors.leadEmail.message}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Phone Number</Label>
                  <div className="flex gap-2">
                    <select {...register('countryCode')} className={`${selectClassName} w-28 shrink-0`}>
                      {countryCodes.map((cc, i) => (
                        <option key={`${cc.code}-${i}`} value={cc.code}>{cc.label}</option>
                      ))}
                    </select>
                    <Input
                      {...register('phoneNumber')}
                      placeholder="234 567 8900"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-1">Social Link</Label>
                  <Input
                    {...register('socialLink')}
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                  {errors.socialLink && (
                    <p className="text-destructive text-sm mt-1">{errors.socialLink.message}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Signup Date</Label>
                  <Input {...register('signupDate')} type="date" />
                </div>
              </div>
            </div>

            {/* Source & Classification */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Source & Classification</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1">Lead Type *</Label>
                  <select {...register('leadType')} className={selectClassName}>
                    <option value="NEW">New</option>
                    <option value="YELLOW">Yellow</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-1">Lead Wants *</Label>
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
                  {errors.leadWants && (
                    <p className="text-destructive text-sm mt-1">{errors.leadWants.message}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Source Channel</Label>
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
                  <Label className="mb-1">Sourced By</Label>
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
                  <Label className="mb-1">Country *</Label>
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
                  {errors.country && (
                    <p className="text-destructive text-sm mt-1">{errors.country.message}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">City</Label>
                  <Input {...register('city')} placeholder="e.g., Mumbai, New York" />
                </div>
              </div>
            </div>

            {/* Details */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Details</h3>
              <div className="space-y-4">
                <div>
                  <Label className="mb-1">Description *</Label>
                  <Textarea
                    {...register('description')}
                    className="min-h-24"
                    placeholder="What exactly does the lead want?"
                  />
                  {errors.description && (
                    <p className="text-destructive text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Notes for BD/Tech Team</Label>
                  <Textarea
                    {...register('notesForTeam')}
                    className="min-h-20"
                    placeholder="Important notes before reaching out..."
                  />
                </div>
                <div>
                  <Label className="mb-1">Additional Details</Label>
                  <Textarea
                    {...register('additionalDetails')}
                    className="min-h-20"
                    placeholder="Any other relevant information..."
                  />
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
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? 'Adding...' : 'Add Lead'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
