// ════════════════════════════════════════════════════════════════════════════
// integrations.ts — Portal integrations catalog + Google Calendar OAuth routes
// Service : core  |  Scope: CLIENT read own; STAFF/ADMIN full access
// Note    : Google Calendar tokens are stored as UserPreference entries.
//           Required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
//                              GOOGLE_REDIRECT_URI, FRONTEND_URL
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { readScopeHeaders, resolveClientFilter } from "../lib/scope.js";
import { prisma } from "../lib/prisma.js";

export interface IntegrationOption {
  provider: string;
  label: string;
  category: string;
  status: "connected" | "not_connected";
  connectedAt: string | null;
}

const INTEGRATION_CATALOG: Omit<IntegrationOption, "status" | "connectedAt">[] = [
  { provider: "slack",       label: "Slack",         category: "communication" },
  { provider: "google_meet", label: "Google Meet",   category: "video" },
  { provider: "zoom",        label: "Zoom",          category: "video" },
  { provider: "github",      label: "GitHub",        category: "development" },
  { provider: "figma",       label: "Figma",         category: "design" },
  { provider: "notion",      label: "Notion",        category: "productivity" },
  { provider: "hubspot",     label: "HubSpot",       category: "crm" },
  { provider: "stripe",      label: "Stripe",        category: "billing" },
];

// ── Preference keys for Google Calendar token storage ─────────────────────
const GC_ACCESS_TOKEN_KEY  = "gcal_access_token";
const GC_REFRESH_TOKEN_KEY = "gcal_refresh_token";
const GC_EMAIL_KEY         = "gcal_email";
const GC_EXPIRY_KEY        = "gcal_token_expiry";

interface GcalTokens {
  access_token:  string;
  refresh_token: string | null;
  expiry_date:   number | null;
  email:         string | null;
}

// ── Refresh the access token using a stored refresh token ─────────────────
async function refreshGcalAccessToken(refreshToken: string): Promise<{ access_token: string; expiry_date: number } | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID     ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        refresh_token: refreshToken,
        grant_type:    "refresh_token",
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    return {
      access_token: data.access_token,
      expiry_date:  Date.now() + (data.expires_in ?? 3600) * 1000,
    };
  } catch {
    return null;
  }
}

// ── Get a valid access token (refreshing if necessary) ────────────────────
async function getValidAccessToken(userId: string): Promise<string | null> {
  const [tokenPref, expiryPref, refreshPref] = await Promise.all([
    prisma.userPreference.findUnique({ where: { userId_key: { userId, key: GC_ACCESS_TOKEN_KEY } } }),
    prisma.userPreference.findUnique({ where: { userId_key: { userId, key: GC_EXPIRY_KEY } } }),
    prisma.userPreference.findUnique({ where: { userId_key: { userId, key: GC_REFRESH_TOKEN_KEY } } }),
  ]);

  if (!tokenPref) return null;

  const expiryDate = expiryPref ? Number(expiryPref.value) : 0;
  const isExpired  = expiryDate < Date.now() + 60_000; // refresh if < 1 min left

  if (!isExpired) return tokenPref.value;

  if (!refreshPref) return null;

  const refreshed = await refreshGcalAccessToken(refreshPref.value);
  if (!refreshed) return null;

  await prisma.userPreference.upsert({
    where:  { userId_key: { userId, key: GC_ACCESS_TOKEN_KEY } },
    update: { value: refreshed.access_token },
    create: { userId, key: GC_ACCESS_TOKEN_KEY, value: refreshed.access_token },
  });
  await prisma.userPreference.upsert({
    where:  { userId_key: { userId, key: GC_EXPIRY_KEY } },
    update: { value: String(refreshed.expiry_date) },
    create: { userId, key: GC_EXPIRY_KEY, value: String(refreshed.expiry_date) },
  });

  return refreshed.access_token;
}

export async function registerIntegrationRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /portal/settings/integrations ────────────────────────────────────
  app.get("/portal/settings/integrations", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const scopedClientId = resolveClientFilter(scope.role, scope.clientId);
    if (!scopedClientId) {
      return reply.status(400).send({ success: false, error: { code: "CLIENT_ID_REQUIRED", message: "Client ID is required." } } as ApiResponse);
    }

    const data: IntegrationOption[] = INTEGRATION_CATALOG.map((item) => ({
      ...item,
      status: "not_connected",
      connectedAt: null,
    }));

    return { success: true, data, meta: { requestId: scope.requestId } } as ApiResponse<IntegrationOption[]>;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Google Calendar OAuth2
  // ─────────────────────────────────────────────────────────────────────────

  /** GET /integrations/google-calendar/auth-url
   *  Returns the Google OAuth2 authorization URL. */
  app.get("/integrations/google-calendar/auth-url", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!scope.userId) {
      return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "User ID required." } } as ApiResponse);
    }

    const clientId    = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${process.env.FRONTEND_URL ?? ""}/auth/google-calendar/callback`;

    if (!clientId) {
      return reply.status(503).send({ success: false, error: { code: "GCAL_NOT_CONFIGURED", message: "Google Calendar is not configured." } } as ApiResponse);
    }

    const state = encodeURIComponent(JSON.stringify({ userId: scope.userId, clientId: scope.clientId }));
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent("https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email")}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`;

    return { success: true, data: { authUrl }, meta: { requestId: scope.requestId } } as ApiResponse<{ authUrl: string }>;
  });

  /** POST /integrations/google-calendar/callback
   *  Exchanges the authorization code for tokens and stores them. */
  app.post("/integrations/google-calendar/callback", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const body  = request.body as { code?: string; state?: string };

    if (!body?.code) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Authorization code is required." } } as ApiResponse);
    }

    // Parse state to get userId (fallback to scope header)
    let userId = scope.userId ?? "";
    try {
      const parsed = JSON.parse(decodeURIComponent(body.state ?? "{}")) as { userId?: string };
      if (parsed.userId) userId = parsed.userId;
    } catch { /* use scope.userId */ }

    if (!userId) {
      return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "Unable to identify user." } } as ApiResponse);
    }

    const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${process.env.FRONTEND_URL ?? ""}/auth/google-calendar/callback`;

    // Exchange code for tokens
    let tokens: GcalTokens;
    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code:          body.code,
          client_id:     process.env.GOOGLE_CLIENT_ID     ?? "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
          redirect_uri:  redirectUri,
          grant_type:    "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        request.log.error({ errBody }, "Google token exchange failed");
        return reply.status(502).send({ success: false, error: { code: "GCAL_TOKEN_EXCHANGE_FAILED", message: "Failed to exchange authorization code." } } as ApiResponse);
      }

      const tokenData = await tokenRes.json() as {
        access_token:  string;
        refresh_token?: string;
        expires_in?:   number;
        error?:        string;
      };

      if (tokenData.error || !tokenData.access_token) {
        return reply.status(502).send({ success: false, error: { code: "GCAL_TOKEN_EXCHANGE_FAILED", message: tokenData.error ?? "Missing access token." } } as ApiResponse);
      }

      tokens = {
        access_token:  tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        expiry_date:   Date.now() + (tokenData.expires_in ?? 3600) * 1000,
        email:         null,
      };
    } catch (err) {
      request.log.error(err, "Google token exchange error");
      return reply.status(502).send({ success: false, error: { code: "GCAL_TOKEN_EXCHANGE_FAILED", message: "Network error during token exchange." } } as ApiResponse);
    }

    // Fetch Google account email
    try {
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json() as { email?: string };
        tokens.email = profile.email ?? null;
      }
    } catch { /* non-fatal */ }

    // Persist tokens as UserPreference entries
    try {
      const upserts: Promise<unknown>[] = [
        prisma.userPreference.upsert({
          where:  { userId_key: { userId, key: GC_ACCESS_TOKEN_KEY } },
          update: { value: tokens.access_token },
          create: { userId, key: GC_ACCESS_TOKEN_KEY, value: tokens.access_token },
        }),
        prisma.userPreference.upsert({
          where:  { userId_key: { userId, key: GC_EXPIRY_KEY } },
          update: { value: String(tokens.expiry_date ?? 0) },
          create: { userId, key: GC_EXPIRY_KEY, value: String(tokens.expiry_date ?? 0) },
        }),
      ];

      if (tokens.refresh_token) {
        upserts.push(
          prisma.userPreference.upsert({
            where:  { userId_key: { userId, key: GC_REFRESH_TOKEN_KEY } },
            update: { value: tokens.refresh_token },
            create: { userId, key: GC_REFRESH_TOKEN_KEY, value: tokens.refresh_token },
          })
        );
      }

      if (tokens.email) {
        upserts.push(
          prisma.userPreference.upsert({
            where:  { userId_key: { userId, key: GC_EMAIL_KEY } },
            update: { value: tokens.email },
            create: { userId, key: GC_EMAIL_KEY, value: tokens.email },
          })
        );
      }

      await Promise.all(upserts);
    } catch (err) {
      request.log.error(err, "Failed to persist Google Calendar tokens");
      return reply.status(500).send({ success: false, error: { code: "GCAL_STORE_FAILED", message: "Failed to store authorization tokens." } } as ApiResponse);
    }

    return { success: true, data: { connected: true, email: tokens.email }, meta: { requestId: scope.requestId } } as ApiResponse<{ connected: boolean; email: string | null }>;
  });

  /** GET /integrations/google-calendar/status */
  app.get("/integrations/google-calendar/status", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!scope.userId) {
      return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "User ID required." } } as ApiResponse);
    }

    const [tokenPref, emailPref, expiryPref] = await Promise.all([
      prisma.userPreference.findUnique({ where: { userId_key: { userId: scope.userId, key: GC_ACCESS_TOKEN_KEY } } }),
      prisma.userPreference.findUnique({ where: { userId_key: { userId: scope.userId, key: GC_EMAIL_KEY } } }),
      prisma.userPreference.findUnique({ where: { userId_key: { userId: scope.userId, key: GC_EXPIRY_KEY } } }),
    ]);

    const connected = !!tokenPref;
    const email     = emailPref?.value ?? null;
    const expiresAt = expiryPref ? new Date(Number(expiryPref.value)).toISOString() : null;

    return { success: true, data: { connected, email, expiresAt }, meta: { requestId: scope.requestId } } as ApiResponse<{ connected: boolean; email: string | null; expiresAt: string | null }>;
  });

  /** DELETE /integrations/google-calendar/disconnect */
  app.delete("/integrations/google-calendar/disconnect", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!scope.userId) {
      return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "User ID required." } } as ApiResponse);
    }

    await prisma.userPreference.deleteMany({
      where: {
        userId: scope.userId,
        key: { in: [GC_ACCESS_TOKEN_KEY, GC_REFRESH_TOKEN_KEY, GC_EMAIL_KEY, GC_EXPIRY_KEY] },
      },
    });

    return { success: true, data: { disconnected: true }, meta: { requestId: scope.requestId } } as ApiResponse<{ disconnected: boolean }>;
  });

  /** POST /integrations/google-calendar/sync-meeting  body: { meetingId } */
  app.post("/integrations/google-calendar/sync-meeting", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (!scope.userId) {
      return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "User ID required." } } as ApiResponse);
    }

    const body = request.body as { meetingId?: string };
    if (!body?.meetingId) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "meetingId is required." } } as ApiResponse);
    }

    // Look up meeting — enforce client scope for CLIENT role
    const meeting = await prisma.meetingRecord.findFirst({
      where: scope.role === "CLIENT"
        ? { id: body.meetingId, clientId: scope.clientId ?? "" }
        : { id: body.meetingId },
    });

    if (!meeting) {
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Meeting not found." } } as ApiResponse);
    }

    // Get a valid access token (auto-refresh if expired)
    const accessToken = await getValidAccessToken(scope.userId);
    if (!accessToken) {
      return reply.status(403).send({ success: false, error: { code: "GCAL_NOT_CONNECTED", message: "Google Calendar is not connected. Please connect first." } } as ApiResponse);
    }

    // Build Google Calendar event
    const startTime = new Date(meeting.meetingAt);
    const endTime   = new Date(startTime.getTime() + meeting.durationMins * 60_000);

    const event = {
      summary:     meeting.title,
      description: meeting.notes ?? `Meeting with ${meeting.attendeeCount} attendee(s). Action items: ${meeting.actionItemStatus}.`,
      start:       { dateTime: startTime.toISOString() },
      end:         { dateTime: endTime.toISOString() },
    };

    try {
      const gcalRes = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method:  "POST",
          headers: {
            Authorization:  `Bearer ${accessToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (!gcalRes.ok) {
        const errText = await gcalRes.text();
        request.log.error({ errText, status: gcalRes.status }, "Google Calendar event creation failed");

        if (gcalRes.status === 401) {
          return reply.status(403).send({ success: false, error: { code: "GCAL_TOKEN_INVALID", message: "Google Calendar token is invalid. Please reconnect." } } as ApiResponse);
        }

        return reply.status(502).send({ success: false, error: { code: "GCAL_EVENT_FAILED", message: "Failed to create Google Calendar event." } } as ApiResponse);
      }

      const gcalEvent = await gcalRes.json() as { id?: string; htmlLink?: string };

      return {
        success: true,
        data: {
          synced:      true,
          googleEventId:   gcalEvent.id ?? null,
          googleEventLink: gcalEvent.htmlLink ?? null,
        },
        meta: { requestId: scope.requestId },
      } as ApiResponse<{ synced: boolean; googleEventId: string | null; googleEventLink: string | null }>;

    } catch (err) {
      request.log.error(err, "Google Calendar sync error");
      return reply.status(502).send({ success: false, error: { code: "GCAL_SYNC_FAILED", message: "Network error during calendar sync." } } as ApiResponse);
    }
  });
}
