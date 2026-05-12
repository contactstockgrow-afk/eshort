# eShort - AI-Powered Short Video Platform

A lightweight, AI-managed short video social media platform inspired by TikTok with a unique modern dark UI and optimized architecture.

## Architecture

```
eShort/
├── android/          # Kotlin + Jetpack Compose Android app
├── backend/          # Node.js + Express API server
├── admin/            # Web-based admin dashboard
└── docs/             # Documentation
```

## Features

- **Home Feed**: Full-screen vertical short videos with auto-play, swipe navigation, infinite scrolling
- **Search**: Users, videos, hashtags, trending content, live suggestions
- **Upload**: Gallery upload, video compression, progress tracking, drafts
- **Social**: Friend requests, follow system, notifications, real-time updates
- **Profile**: Editable profiles, video grids, saved/liked videos, privacy controls
- **Auth**: Firebase Authentication with Google Sign-In
- **Storage**: Google Drive-based media storage (not Firebase Storage)
- **AI Management**: Autonomous backend configuration, optimization, and monitoring

## Tech Stack

### Frontend (Android)
- Kotlin
- Jetpack Compose
- MVVM Architecture
- Hilt (Dependency Injection)
- ExoPlayer (Video Playback)
- Retrofit + OkHttp
- Coil (Image Loading)
- Navigation Compose

### Backend
- Node.js + Express
- Firebase Admin SDK (Firestore, Auth, FCM)
- Google Drive API
- JWT Authentication
- Rate Limiting
- Content Moderation

### Infrastructure
- Firebase (Auth, Firestore, Cloud Messaging)
- Google Cloud / Google Drive (Media Storage)
- Cloud Functions (Background Tasks)

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Configure environment variables
npm run dev
```

### Android
1. Open `android/` in Android Studio
2. Add `google-services.json` to `android/app/`
3. Build and run

### Admin Dashboard
```bash
cd admin
npm install
npm start
```

## API Documentation

See `backend/API.md` for full API documentation.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_DRIVE_FOLDER_ID` | Root Google Drive folder ID |
| `JWT_SECRET` | JWT signing secret |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging server key |

## License

MIT
