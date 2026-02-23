import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, ChevronDown, X, Paperclip, Link2, Plus } from 'lucide-react';
import { leadApi, trackerApi } from '../api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';

const countryCodes = [
  { code: '+91',  iso: 'IN', country: 'India' },
  { code: '+1',   iso: 'US', country: 'United States' },
  { code: '+44',  iso: 'GB', country: 'United Kingdom' },
  { code: '+1',   iso: 'CA', country: 'Canada' },
  { code: '+61',  iso: 'AU', country: 'Australia' },
  { code: '+49',  iso: 'DE', country: 'Germany' },
  { code: '+33',  iso: 'FR', country: 'France' },
  { code: '+971', iso: 'AE', country: 'UAE' },
  { code: '+966', iso: 'SA', country: 'Saudi Arabia' },
  { code: '+65',  iso: 'SG', country: 'Singapore' },
  { code: '+81',  iso: 'JP', country: 'Japan' },
  { code: '+82',  iso: 'KR', country: 'South Korea' },
  { code: '+55',  iso: 'BR', country: 'Brazil' },
  { code: '+52',  iso: 'MX', country: 'Mexico' },
  { code: '+27',  iso: 'ZA', country: 'South Africa' },
  { code: '+234', iso: 'NG', country: 'Nigeria' },
  { code: '+254', iso: 'KE', country: 'Kenya' },
  { code: '+60',  iso: 'MY', country: 'Malaysia' },
  { code: '+62',  iso: 'ID', country: 'Indonesia' },
  { code: '+63',  iso: 'PH', country: 'Philippines' },
];

const flagEmoji = (iso: string) =>
  iso.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');

// Parse existing leadContact to extract country code and phone number
const parseContact = (contact: string | null | undefined) => {
  if (!contact) return { cc: countryCodes[0], phone: '' };
  const match = contact.match(/^(\+\d+)\s*(.*)$/);
  if (!match) return { cc: countryCodes[0], phone: contact };
  const [, code, phone] = match;
  const found = countryCodes.find(c => c.code === code);
  return { cc: found || countryCodes[0], phone };
};

const leadSchema = z.object({
  leadType: z.enum(['NEW', 'YELLOW']),
  leadName: z.string().optional(),
  leadEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
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
  const [selectedCC, setSelectedCC] = useState(countryCodes[0]);
  const [ccOpen, setCcOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const ccRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ccRef.current && !ccRef.current.contains(e.target as Node)) {
        setCcOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    mutationFn: (data: LeadForm) => {
      const leadContact = data.phoneNumber
        ? `${selectedCC.code} ${data.phoneNumber}`
        : undefined;
      const { phoneNumber, ...rest } = data;
      return leadApi.update(id!, leadId!, {
        ...rest,
        leadContact,
        sourceChannel: data.sourceChannel || undefined,
        sourceBdaId: data.sourceBdaId || undefined,
      } as any);
    },
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

  // Parse existing contact once when lead data loads
  useEffect(() => {
    if (lead?.leadContact) {
      const { cc } = parseContact(lead.leadContact);
      setSelectedCC(cc);
    }
  }, [lead?.leadContact]);

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
          phoneNumber: parseContact(lead.leadContact).phone,
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

  const handleFileAdd = (files: FileList | null) => {
    if (!files) return;
    setAttachedFiles(prev => [...prev, ...Array.from(files)]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addLink = () => {
    const trimmed = linkInput.trim();
    if (!trimmed) return;
    const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    if (!links.includes(url)) {
      setLinks(prev => [...prev, url]);
    }
    setLinkInput('');
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

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
                  <Label className="mb-1">Lead Name</Label>
                  <Input {...register('leadName')} placeholder="John Doe" />
                </div>
                <div>
                  <Label className="mb-1">Lead Email</Label>
                  <Input {...register('leadEmail')} type="email" placeholder="john@example.com" />
                  {errors.leadEmail && <p className="text-destructive text-sm mt-1">{errors.leadEmail.message}</p>}
                </div>

                {/* Phone with flag emoji country code picker */}
                <div className="col-span-2 sm:col-span-1">
                  <Label className="mb-1">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="relative shrink-0" ref={ccRef}>
                      <button
                        type="button"
                        onClick={() => setCcOpen(o => !o)}
                        className="flex items-center gap-1.5 h-10 px-2.5 rounded-md border border-input bg-background text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                      >
                        <span className="text-lg leading-none">{flagEmoji(selectedCC.iso)}</span>
                        <span className="font-medium text-xs">{selectedCC.code}</span>
                        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${ccOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {ccOpen && (
                        <div className="absolute top-full left-0 mt-1 w-60 max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-lg z-50">
                          {countryCodes.map((cc, i) => {
                            const isSelected = selectedCC.iso === cc.iso && selectedCC.code === cc.code;
                            return (
                              <button
                                key={`${cc.iso}-${i}`}
                                type="button"
                                onClick={() => { setSelectedCC(cc); setCcOpen(false); }}
                                className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors hover:bg-accent ${isSelected ? 'bg-accent font-medium' : ''}`}
                              >
                                <span className="text-base leading-none">{flagEmoji(cc.iso)}</span>
                                <span className="flex-1 truncate">{cc.country}</span>
                                <span className="text-muted-foreground text-xs font-mono">{cc.code}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <Input
                      {...register('phoneNumber')}
                      placeholder="234 567 8900"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-1">Signup Date</Label>
                  <Input {...register('signupDate')} type="date" />
                </div>

                {/* Links / URLs */}
                <div className="col-span-2">
                  <Label className="mb-1">Links / URLs</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
                        placeholder="https://example.com"
                        className="pl-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addLink}
                      className="shrink-0 h-10 w-10"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {links.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {links.map((url, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-muted rounded-md px-3 py-2 text-sm group"
                        >
                          <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 truncate text-primary hover:underline underline-offset-2"
                          >
                            {url}
                          </a>
                          <button
                            type="button"
                            onClick={() => removeLink(i)}
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                  {errors.leadWants && <p className="text-destructive text-sm mt-1">{errors.leadWants.message}</p>}
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
                  {errors.country && <p className="text-destructive text-sm mt-1">{errors.country.message}</p>}
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
                  <Textarea {...register('description')} className="min-h-24" placeholder="What exactly does the lead want?" />
                  {errors.description && <p className="text-destructive text-sm mt-1">{errors.description.message}</p>}
                </div>
                <div>
                  <Label className="mb-1">Notes for BD/Tech Team</Label>
                  <Textarea {...register('notesForTeam')} className="min-h-20" placeholder="Important notes before reaching out..." />
                </div>
                <div>
                  <Label className="mb-1">Additional Details</Label>
                  <Textarea {...register('additionalDetails')} className="min-h-20" placeholder="Any other relevant information..." />
                </div>

                {/* Attachments */}
                <div>
                  <Label className="mb-1">Attachments</Label>
                  <label
                    className={`flex flex-col items-center gap-2 border-2 border-dashed rounded-md p-5 cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:border-primary/50 hover:bg-muted/40'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleFileAdd(e.dataTransfer.files);
                    }}
                  >
                    <Paperclip className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground text-center">
                      Drop files here or{' '}
                      <span className="text-primary font-medium underline underline-offset-2">browse</span>
                    </span>
                    <span className="text-xs text-muted-foreground">PDF, Images, Docs — max 10 MB each</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.xlsx,.csv,.txt"
                      className="hidden"
                      onChange={(e) => handleFileAdd(e.target.files)}
                    />
                  </label>

                  {attachedFiles.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {attachedFiles.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-muted rounded-md px-3 py-2 text-sm"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="flex-1 truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {file.size < 1024 * 1024
                              ? `${(file.size / 1024).toFixed(0)} KB`
                              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
