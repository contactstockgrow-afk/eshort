---
name: testing-eshort-backend
description: Test the eShort backend API end-to-end. Use when verifying backend API endpoints, Firebase/Firestore integration, or Google Drive connectivity.
---

# Testing eShort Backend

## Prerequisites

- Node.js installed
- `backend/.env` configured with Firebase and Google credentials
- `backend/serviceAccountKey.json` present (Firebase Admin SDK key)
- `backend/driveConfig.json` present (auto-generated on first run if Drive folders exist)

## Devin Secrets Needed

- `GOOGLE_ACCOUNT_PASSWORD` — Google account password for Firebase Console access (needed for index creation)

## Starting the Backend

```bash
cd /home/ubuntu/repos/eShort/backend
npm install
npm start
```

Server runs on port 3000. Watch startup logs for:
- "Firebase initialized successfully"
- "Google Drive service initialized (service account mode)"
- "eShort API server running on port 3000"

## Firestore Composite Indexes

The backend requires composite indexes for compound Firestore queries. Without them, feed/videos/search endpoints will return 500 errors with `FAILED_PRECONDITION`.

**Required indexes (create in Firebase Console → Firestore → Indexes → Manual):**

| Collection | Fields | Direction |
|-----------|--------|-----------|
| videos | status ↑, trendingScore ↓ | Collection |
| videos | isPrivate ↑, status ↑, trendingScore ↓, createdAt ↓ | Collection |
| videos | status ↑, createdAt ↓ | Collection |
| videos | status ↑, likesCount ↓ | Collection |
| users | isVerified ↑, followersCount ↓ | Collection |
| hashtags | tag ↑, count ↓ | Collection |

**How to create indexes:**
1. Navigate to Firebase Console → Firestore → Indexes tab → Manual
2. Click "Add index" button
3. Fill in Collection ID, field names, and sort directions
4. Wait for status to change from "Building..." to "Enabled" (typically 1-5 minutes)

**Tip:** If you hit a `FAILED_PRECONDITION` error, the server logs include a direct URL to create the missing index. However, these URLs may get truncated in the browser — using the manual "Add index" form is more reliable.

## Test Suite (14 Tests)

All tests run via curl against `http://localhost:3000`:

1. **Backend Startup** — Firebase + Drive init success in logs
2. **Health Check** — `GET /health` returns `{"status":"ok"}`
3. **404 Handler** — Invalid routes return JSON error, not HTML
4. **Auth No Token** — Protected endpoints return 401
5. **Auth Invalid Token** — Malformed Bearer token returns 401
6. **Feed** — `GET /api/feed/for-you` returns `{"success":true}` with pagination
7. **Videos** — `GET /api/videos` and `/api/videos/trending` return success
8. **Search** — `GET /api/search?q=...`, `/trending`, `/discover` all return success
9. **Rate Limiting** — `RateLimit-*` headers present on API responses
10. **Input Validation** — `POST /api/auth/register` with invalid data returns validation errors
11. **Upload Auth** — `POST /api/upload/video` without auth returns 401
12. **Drive Connectivity** — `driveConfig.json` has valid folder IDs
13. **APK Artifact** — `eShort-debug.apk` exists and is 5-50MB valid archive
14. **Error Handling** — All errors return `Content-Type: application/json`

## Common Issues

- **Search returns 500**: Missing Firestore composite index. Check server logs for the specific index needed.
- **Drive init fails**: `serviceAccountKey.json` missing or invalid. Regenerate from Firebase Console → Project Settings → Service Accounts.
- **Profile picture uploads fail**: The folder type detection in `drive.js` uses a length heuristic (`> 20`) to distinguish semantic names from Drive IDs. If a new folder type name exceeds 20 chars, it may be misidentified.

## No CI

This repo has no CI configured. All testing is done locally via shell commands.
