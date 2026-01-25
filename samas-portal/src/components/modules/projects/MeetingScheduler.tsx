import { FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addHours } from 'date-fns';
import {
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Loader2,
  X,
  Plus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { calendarService } from '@/services/google/calendar';
import { useToast } from '@/hooks/useToast';

interface MeetingSchedulerProps {
  projectName: string;
  teamEmails?: string[];
}

const meetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required').max(200),
  description: z.string().max(1000).optional(),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  duration: z.string().min(1, 'Duration is required'),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

const durationOptions = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
];

export const MeetingScheduler: FC<MeetingSchedulerProps> = ({
  projectName,
  teamEmails = [],
}) => {
  const { success, error } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [customEmail, setCustomEmail] = useState('');
  const [lastMeetingLink, setLastMeetingLink] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: `${projectName} Meeting`,
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: format(addHours(new Date(), 1), 'HH:00'),
      duration: '60',
    },
  });

  const handleAddAttendee = (email: string) => {
    if (email && !selectedAttendees.includes(email)) {
      setSelectedAttendees([...selectedAttendees, email]);
    }
    setCustomEmail('');
  };

  const handleRemoveAttendee = (email: string) => {
    setSelectedAttendees(selectedAttendees.filter((e) => e !== email));
  };

  const handleAddCustomEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (customEmail && emailRegex.test(customEmail)) {
      handleAddAttendee(customEmail);
    }
  };

  const onSubmit = async (data: MeetingFormData) => {
    setIsSubmitting(true);
    try {
      const hasAccess = await calendarService.checkAccess();
      if (!hasAccess) {
        await calendarService.reauthenticate();
      }

      const startDateTime = new Date(`${data.date}T${data.startTime}`);
      const endDateTime = new Date(
        startDateTime.getTime() + parseInt(data.duration) * 60 * 1000
      );

      const { meetLink } = await calendarService.createMeeting(
        data.title,
        data.description,
        startDateTime,
        endDateTime,
        selectedAttendees
      );

      if (meetLink) {
        setLastMeetingLink(meetLink);
      }

      success('Meeting scheduled successfully');
      setShowModal(false);
      reset();
      setSelectedAttendees([]);
    } catch (err) {
      error(`Failed to schedule meeting: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Schedule Meeting
            </h3>
          </div>
          <Button onClick={() => setShowModal(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Meeting
          </Button>
        </div>

        {lastMeetingLink && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300 mb-2">
              Last meeting created:
            </p>
            <a
              href={lastMeetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <Video className="h-4 w-4" />
              Join Google Meet
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {!lastMeetingLink && (
          <p className="text-sm text-gray-500">
            Schedule team meetings with automatic Google Meet links.
          </p>
        )}
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-500" />
              Schedule Meeting
            </DialogTitle>
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Enter meeting title"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                {...register('description')}
                placeholder="Meeting agenda or notes"
                rows={2}
                className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="date"
                    type="date"
                    {...register('date')}
                    className="pl-10"
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="startTime"
                    type="time"
                    {...register('startTime')}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="duration">Duration *</Label>
              <select
                id="duration"
                {...register('duration')}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Attendees</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedAttendees.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttendee(email)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {teamEmails.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">Team members:</p>
                  <div className="flex flex-wrap gap-1">
                    {teamEmails
                      .filter((email) => !selectedAttendees.includes(email))
                      .map((email) => (
                        <button
                          key={email}
                          type="button"
                          onClick={() => handleAddAttendee(email)}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          + {email}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Add email address"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomEmail();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCustomEmail}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-500" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                A Google Meet link will be automatically created
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Schedule Meeting
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
