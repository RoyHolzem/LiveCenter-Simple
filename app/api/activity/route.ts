import { NextRequest } from 'next/server';
import { CloudTrailClient, LookupEventsCommand } from '@aws-sdk/client-cloudtrail';
import { isAuthenticated } from '@/lib/auth';

type ActivityEvent = {
  eventId: string;
  eventName: string;
  eventSource: string;
  eventTime: string;
  actor: string;
  resource: string;
};

const region = process.env.ACTIVITY_AWS_REGION || process.env.AWS_REGION || 'eu-central-1';
const lookbackHours = Number(process.env.ACTIVITY_LOOKBACK_HOURS || 24);
const usernameContains = process.env.ACTIVITY_CLOUDTRAIL_USERNAME_CONTAINS || 'xena-';
const allowedEventSources = new Set(
  (process.env.ACTIVITY_ALLOWED_EVENT_SOURCES || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
);
const allowedEventNames = new Set(
  (process.env.ACTIVITY_ALLOWED_EVENT_NAMES || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
);

const client = new CloudTrailClient({ region });

export async function GET(request: NextRequest) {
  if (!isAuthenticated()) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 8), 20);
  const startTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

  try {
    const response = await client.send(
      new LookupEventsCommand({
        StartTime: startTime,
        MaxResults: 50
      })
    );

    const events = (response.Events || [])
      .map((event) => {
        const username = event.Username || 'unknown';
        const resource = event.Resources?.[0]?.ResourceName || event.Resources?.[0]?.ResourceType || 'n/a';
        return {
          eventId: event.EventId || `${event.EventTime?.toISOString() || 'event'}-${event.EventName || 'unknown'}`,
          eventName: event.EventName || 'UnknownEvent',
          eventSource: event.EventSource || 'unknown',
          eventTime: event.EventTime?.toISOString() || new Date().toISOString(),
          actor: username,
          resource
        } satisfies ActivityEvent;
      })
      .filter((event) => (usernameContains ? event.actor.includes(usernameContains) : true))
      .filter((event) => (allowedEventSources.size ? allowedEventSources.has(event.eventSource) : true))
      .filter((event) => (allowedEventNames.size ? allowedEventNames.has(event.eventName) : true))
      .slice(0, limit);

    return Response.json({ ok: true, events });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load activity';
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
