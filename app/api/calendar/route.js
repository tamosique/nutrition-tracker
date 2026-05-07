import { getServerSession } from 'next-auth';
import { google } from 'googleapis';
import { authOptions } from '@/lib/auth';

function getCalendarClient(accessToken) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth });
}

// GET /api/calendar?days=7
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const cal = getCalendarClient(session.accessToken);
    const now = new Date();
    const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const res = await cal.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50,
    });

    return Response.json({ events: res.data.items || [] });
  } catch (err) {
    console.error('Calendar GET error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/calendar — create event
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const body = await req.json();
    const cal = getCalendarClient(session.accessToken);

    const event = await cal.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: body.title,
        description: body.description || '',
        location: body.location || '',
        start: body.allDay
          ? { date: body.startDate }
          : { dateTime: body.startDateTime, timeZone: 'Europe/Paris' },
        end: body.allDay
          ? { date: body.endDate || body.startDate }
          : { dateTime: body.endDateTime, timeZone: 'Europe/Paris' },
        colorId: body.colorId || '1',
      },
    });

    return Response.json({ event: event.data });
  } catch (err) {
    console.error('Calendar POST error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/calendar — update event
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const body = await req.json();
    const cal = getCalendarClient(session.accessToken);

    const event = await cal.events.patch({
      calendarId: 'primary',
      eventId: body.eventId,
      requestBody: {
        summary: body.title,
        start: { dateTime: body.startDateTime, timeZone: 'Europe/Paris' },
        end: { dateTime: body.endDateTime, timeZone: 'Europe/Paris' },
      },
    });

    return Response.json({ event: event.data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
