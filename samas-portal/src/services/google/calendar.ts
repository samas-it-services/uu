/**
 * Google Calendar API Service
 *
 * This service provides integration with Google Calendar for:
 * - Creating calendar events
 * - Scheduling meetings with Google Meet links
 * - Managing project-related events
 * - Syncing deadlines and milestones
 *
 * Prerequisites:
 * 1. Enable Google Calendar API in Google Cloud Console
 * 2. Add the calendar.events scope to Firebase Auth (already configured)
 * 3. Configure OAuth consent screen
 */

import { auth } from '@/services/firebase/config';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: { email: string; displayName?: string; responseStatus?: string }[];
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: { type: string };
    };
    entryPoints?: {
      entryPointType: string;
      uri: string;
      label?: string;
    }[];
    conferenceId?: string;
    conferenceSolution?: {
      key: { type: string };
      name: string;
      iconUri: string;
    };
  };
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
  colorId?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink?: string;
  hangoutLink?: string;
  created?: string;
  updated?: string;
}

export interface CalendarListResponse {
  items: CalendarEvent[];
  nextPageToken?: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  attendeeEmails?: string[];
  createMeetLink?: boolean;
  reminders?: { method: 'email' | 'popup'; minutes: number }[];
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  location?: string;
  startTime?: Date;
  endTime?: Date;
  attendeeEmails?: string[];
}

class GoogleCalendarService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    if (this.accessToken && now < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!this.accessToken) {
      throw new Error('No access token available. Please connect to Google Calendar.');
    }

    throw new Error('Access token expired. Please reconnect to Google Calendar.');
  }

  /**
   * Set the access token (called after Google sign-in)
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    this.tokenExpiry = Date.now() + 3600000; // 1 hour
  }

  /**
   * Re-authenticate with Google Calendar scope
   */
  async reauthenticate(): Promise<void> {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    provider.setCustomParameters({ prompt: 'consent' });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (credential?.accessToken) {
      this.accessToken = credential.accessToken;
      this.tokenExpiry = Date.now() + 3600000;
    }
  }

  /**
   * Make an authenticated request to the Calendar API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAccessToken();

    const response = await fetch(`${CALENDAR_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.accessToken = null;
        throw new Error('Authentication expired. Please sign in again.');
      }
      const error = await response.json();
      throw new Error(error.error?.message || 'Calendar API error');
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * List events from the primary calendar
   */
  async listEvents(
    timeMin?: Date,
    timeMax?: Date,
    maxResults = 50,
    pageToken?: string
  ): Promise<CalendarListResponse> {
    const params = new URLSearchParams({
      maxResults: String(maxResults),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    if (timeMin) {
      params.append('timeMin', timeMin.toISOString());
    }
    if (timeMax) {
      params.append('timeMax', timeMax.toISOString());
    }
    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    return this.request<CalendarListResponse>(
      `/calendars/primary/events?${params}`
    );
  }

  /**
   * Get a single event by ID
   */
  async getEvent(eventId: string): Promise<CalendarEvent> {
    return this.request<CalendarEvent>(
      `/calendars/primary/events/${eventId}`
    );
  }

  /**
   * Create a new calendar event
   */
  async createEvent(data: CreateEventData): Promise<CalendarEvent> {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const event: CalendarEvent = {
      summary: data.title,
      description: data.description,
      location: data.location,
      start: {
        dateTime: data.startTime.toISOString(),
        timeZone,
      },
      end: {
        dateTime: data.endTime.toISOString(),
        timeZone,
      },
      attendees: data.attendeeEmails?.map((email) => ({ email })),
    };

    // Add reminders if specified
    if (data.reminders && data.reminders.length > 0) {
      event.reminders = {
        useDefault: false,
        overrides: data.reminders,
      };
    }

    // Add Google Meet link if requested
    if (data.createMeetLink) {
      event.conferenceData = {
        createRequest: {
          requestId: `meet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    const params = data.createMeetLink
      ? '?conferenceDataVersion=1&sendUpdates=all'
      : '?sendUpdates=all';

    return this.request<CalendarEvent>(
      `/calendars/primary/events${params}`,
      {
        method: 'POST',
        body: JSON.stringify(event),
      }
    );
  }

  /**
   * Create a meeting with Google Meet link
   */
  async createMeeting(
    title: string,
    description: string | undefined,
    startTime: Date,
    endTime: Date,
    attendeeEmails: string[]
  ): Promise<{ event: CalendarEvent; meetLink: string | null }> {
    const event = await this.createEvent({
      title,
      description,
      startTime,
      endTime,
      attendeeEmails,
      createMeetLink: true,
      reminders: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 10 },
      ],
    });

    const meetLink = event.hangoutLink || null;

    return { event, meetLink };
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    eventId: string,
    data: UpdateEventData
  ): Promise<CalendarEvent> {
    const existing = await this.getEvent(eventId);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const updates: Partial<CalendarEvent> = {
      ...existing,
    };

    if (data.title !== undefined) {
      updates.summary = data.title;
    }
    if (data.description !== undefined) {
      updates.description = data.description;
    }
    if (data.location !== undefined) {
      updates.location = data.location;
    }
    if (data.startTime) {
      updates.start = {
        dateTime: data.startTime.toISOString(),
        timeZone,
      };
    }
    if (data.endTime) {
      updates.end = {
        dateTime: data.endTime.toISOString(),
        timeZone,
      };
    }
    if (data.attendeeEmails) {
      updates.attendees = data.attendeeEmails.map((email) => ({ email }));
    }

    return this.request<CalendarEvent>(
      `/calendars/primary/events/${eventId}?sendUpdates=all`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<void> {
    await this.request(
      `/calendars/primary/events/${eventId}?sendUpdates=all`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Quick add - create event from natural language
   */
  async quickAdd(text: string): Promise<CalendarEvent> {
    return this.request<CalendarEvent>(
      `/calendars/primary/events/quickAdd?text=${encodeURIComponent(text)}`,
      {
        method: 'POST',
      }
    );
  }

  /**
   * Check if the user has Calendar access
   */
  async checkAccess(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a project milestone event (all-day event)
   */
  async createMilestoneEvent(
    title: string,
    date: Date,
    projectName: string
  ): Promise<CalendarEvent> {
    const dateStr = date.toISOString().split('T')[0];

    const event: Record<string, unknown> = {
      summary: `[${projectName}] ${title}`,
      description: `Milestone for project: ${projectName}`,
      start: { date: dateStr },
      end: { date: dateStr },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'email', minutes: 1440 }], // 1 day before
      },
      colorId: '9', // Blue
    };

    return this.request<CalendarEvent>('/calendars/primary/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  /**
   * Create a project deadline event
   */
  async createDeadlineEvent(
    projectName: string,
    deadline: Date
  ): Promise<CalendarEvent> {
    const dateStr = deadline.toISOString().split('T')[0];

    const event: Record<string, unknown> = {
      summary: `[DEADLINE] ${projectName}`,
      description: `Project deadline for: ${projectName}`,
      start: { date: dateStr },
      end: { date: dateStr },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 10080 }, // 1 week before
          { method: 'email', minutes: 1440 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
      colorId: '11', // Red
    };

    return this.request<CalendarEvent>('/calendars/primary/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  /**
   * Create a task due date event
   */
  async createTaskEvent(
    taskTitle: string,
    projectName: string,
    dueDate: Date
  ): Promise<CalendarEvent> {
    const dateStr = dueDate.toISOString().split('T')[0];

    const event: Record<string, unknown> = {
      summary: `[Task] ${taskTitle}`,
      description: `Task from project: ${projectName}`,
      start: { date: dateStr },
      end: { date: dateStr },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 60 }],
      },
      colorId: '5', // Yellow
    };

    return this.request<CalendarEvent>('/calendars/primary/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }
}

export const calendarService = new GoogleCalendarService();
