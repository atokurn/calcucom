# Cloudflare + Google Auth + Sheets/Drive Plan

This document defines the deployment/auth/data-sync direction for CekBiayaJualan.

## Target Architecture

```text
Cloudflare Pages
  static app: index.html, css/, js/, sw.js
  Pages Functions: /api/*

Google OAuth 2.0
  Login: openid email profile
  Data access: drive.file + spreadsheets

Google Drive / Sheets
  One app-created spreadsheet per user
  localStorage remains offline cache
```

## Security Rules

- Never expose `GOOGLE_CLIENT_SECRET` in frontend JavaScript.
- Never store Google access tokens in `localStorage`.
- Use HttpOnly, Secure, SameSite=Lax session cookies.
- Service worker must bypass `/api/*` and never cache auth or sync responses.
- Use least-privilege Google scopes:
  - `openid`
  - `email`
  - `profile`
  - `https://www.googleapis.com/auth/drive.file`
  - `https://www.googleapis.com/auth/spreadsheets`

## Required Cloudflare Environment Variables

Configure these in Cloudflare Pages project settings:

```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SESSION_SECRET=long-random-string-at-least-32-bytes
APP_ORIGIN=https://your-production-domain.example
```

`APP_ORIGIN` is optional for local preview but recommended in production.

## Google Cloud Console Setup

1. Create or select Google Cloud project.
2. Configure OAuth consent screen.
3. Create OAuth 2.0 Web Client.
4. Add Authorized redirect URI:

```text
https://your-production-domain.example/api/auth/callback
```

For local testing with Wrangler/Pages preview, add the local callback too.

## Implemented Functions

Current scaffold:

```text
functions/_shared/oauth.js
functions/api/auth/google.js
functions/api/auth/callback.js
functions/api/auth/me.js
functions/api/auth/logout.js
```

Endpoints:

```text
GET  /api/auth/google     -> starts Google OAuth
GET  /api/auth/callback   -> handles OAuth redirect
GET  /api/auth/me         -> returns public session profile
POST /api/auth/logout     -> clears session
GET  /api/auth/logout     -> clears session and redirects home
```

## Token and Session Storage

The auth scaffold now uses Cloudflare D1 for sensitive Google token storage.

Session cookie behavior:

- Cookie contains only an opaque `sessionId`.
- Cookie is `HttpOnly`, `Secure`, and `SameSite=Lax`.
- User identity and expiration are stored in D1 table `user_sessions`.

Google token behavior:

- Google access and refresh tokens are stored in D1 table `google_tokens`.
- Refresh tokens are preserved when Google does not return a new refresh token on later logins.
- User spreadsheet mapping is reserved in D1 table `user_spreadsheets`.

## Recommended Data Model in Google Sheets

Create one spreadsheet per user named:

```text
CekBiayaJualan Data
```

Tabs:

```text
Products
History
Scenarios
Settings
SyncLog
```

### Products

```text
id | name | hpp | marketplace | categoryGroup | categoryName | payloadJson | createdAt | updatedAt
```

### History

```text
id | productName | marketplace | sellingPrice | hpp | profit | margin | payloadJson | createdAt
```

### Scenarios

```text
id | label | name | payloadJson | createdAt | updatedAt
```

### Settings

```text
key | value | updatedAt
```

## Next Implementation Steps

1. Add Google token refresh helper.
2. Add Drive helper to find/create the user's app spreadsheet.
3. Add Sheets repository functions:
   - append rows
   - read sheet range
   - overwrite sheet range for full sync
5. Add API endpoints:
   - `GET /api/sync/pull`
   - `POST /api/sync/push`
6. Add frontend auth client:
   - login/logout button
   - `getCurrentUser()`
   - sync status indicator
7. Update localStorage writes to optionally enqueue cloud sync.
8. Add conflict handling for local/offline edits.

## PWA Note

`sw.js` has been updated to bypass `/api/*` so user-specific auth/sync responses are always fetched from network and are not cached by the service worker.
