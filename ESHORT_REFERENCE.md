# eShort Platform — Complete Reference & Backup Guide

## A-Z Configuration Reference

---

## 1. Firebase Configuration

- **Project ID**: `eshort-347ae`
- **Firebase Console**: https://console.firebase.google.com/project/eshort-347ae
- **Google Cloud Console**: https://console.cloud.google.com/home/dashboard?project=eshort-347ae
- **Owner Account**: `fatimakhan208pr@gmail.com`

### Firebase Services Enabled
| Service | Status |
|---------|--------|
| Firebase Authentication | Enabled (Google Sign-In) |
| Cloud Firestore | Enabled |
| Firebase Cloud Messaging | Enabled |
| Firebase Admin SDK | Configured |

### Firebase Admin SDK Service Account
- **Email**: `firebase-adminsdk-fbsvc@eshort-347ae.iam.gserviceaccount.com`
- **Key File Location**: `backend/serviceAccountKey.json` (gitignored)
- **Download New Key**: Firebase Console → Project Settings → Service Accounts → Generate New Private Key

### Android Firebase Config
- **Config File**: `android/app/google-services.json` (gitignored)
- **Package Name**: `com.eshort.app`
- **SHA-1 Fingerprint**: Added in Firebase Console → Project Settings → Android Apps

---

## 2. Google OAuth 2.0

- **Web Client ID**: `156049206756-878lkskoa1vrc9lq25tc5v45fipm7leo.apps.googleusercontent.com`
- **Client Secret**: Stored in `backend/.env` as `GOOGLE_CLIENT_SECRET`
- **Redirect URI**: `http://localhost:3000/api/auth/google/callback`
- **OAuth Consent Screen**: Google Cloud Console → APIs & Services → OAuth consent screen

---

## 3. Google Drive Integration

- **API**: Google Drive API v3
- **Auth Mode**: Service Account (no per-user OAuth required)
- **Root Folder ID**: Stored in `backend/.env` as `GOOGLE_DRIVE_FOLDER_ID`
- **Folder Config**: `backend/driveConfig.json`

### Folder Structure
```
/eShort (root)
  ├── /Videos          — All uploaded video files
  ├── /ProfilePictures — User profile images
  ├── /Thumbnails      — Video thumbnail images
  └── /Images          — General image uploads
```

### Drive Config Keys
| Key | Description |
|-----|-------------|
| `root` | Root eShort folder ID |
| `videos` | Videos subfolder ID |
| `profilepictures` | Profile pictures subfolder ID |
| `thumbnails` | Thumbnails subfolder ID |
| `images` | Images subfolder ID |

---

## 4. Backend API

### Server Configuration
| Setting | Value |
|---------|-------|
| Port | 3000 |
| Base URL | `http://localhost:3000/api` |
| Framework | Node.js + Express |
| Environment | `backend/.env` |

### API Routes
| Route Group | Base Path | Auth Required |
|-------------|-----------|---------------|
| Auth | `/api/auth` | Partial |
| Feed | `/api/feed` | Yes |
| Videos | `/api/videos` | Partial |
| Upload | `/api/upload` | Yes |
| Users | `/api/users` | Partial |
| Social | `/api/social` | Yes |
| Search | `/api/search` | No |
| Notifications | `/api/notifications` | Yes |
| Admin | `/api/admin` | Yes (Admin) |
| API Keys | `/api/keys` | Yes |
| External | `/api/external` | API Key |

### Complete API Endpoints

#### Auth (`/api/auth`)
- `POST /register` — Register new user
- `POST /google-signin` — Sign in with Google
- `GET /me` — Get current user
- `PUT /me` — Update profile
- `POST /fcm-token` — Update FCM token
- `POST /logout` — Sign out

#### Feed (`/api/feed`)
- `GET /for-you` — For You feed (paginated)
- `GET /following` — Following feed (paginated)

#### Videos (`/api/videos`)
- `GET /trending` — Trending videos
- `GET /:videoId` — Get video details
- `POST /:videoId/like` — Like video
- `DELETE /:videoId/like` — Unlike video
- `POST /:videoId/comment` — Add comment
- `GET /:videoId/comments` — Get comments
- `POST /:videoId/view` — Record view
- `POST /:videoId/share` — Record share
- `POST /:videoId/save` — Save video
- `DELETE /:videoId/save` — Unsave video
- `DELETE /:videoId` — Delete video

#### Upload (`/api/upload`)
- `POST /video` — Upload video (multipart)
- `POST /profile-picture` — Upload profile picture
- `GET /status/:uploadId` — Check upload status
- `GET /drafts` — Get saved drafts
- `POST /draft` — Save draft
- `DELETE /draft/:draftId` — Delete draft

#### Users (`/api/users`)
- `GET /:userId` — Get user profile
- `GET /:userId/videos` — Get user's videos
- `POST /:userId/follow` — Follow user
- `DELETE /:userId/follow` — Unfollow user
- `GET /:userId/followers` — Get followers
- `GET /:userId/following` — Get following
- `GET /me/saved` — Get saved videos
- `GET /me/liked` — Get liked videos
- `POST /:userId/block` — Block user
- `DELETE /:userId/block` — Unblock user

#### Social (`/api/social`)
- `POST /friend-request/:userId` — Send friend request
- `POST /friend-request/:requestId/accept` — Accept request
- `POST /friend-request/:requestId/reject` — Reject request
- `GET /friend-requests/pending` — Get pending requests
- `GET /friends` — Get friends list

#### Search (`/api/search`)
- `GET /` — Search users/videos/hashtags
- `GET /suggestions` — Search suggestions
- `GET /trending` — Trending content
- `GET /hashtags/:tag` — Hashtag videos

#### Notifications (`/api/notifications`)
- `GET /` — Get notifications
- `GET /unread-count` — Unread count
- `PUT /:notificationId/read` — Mark read
- `PUT /read-all` — Mark all read

#### Admin (`/api/admin`)
- `GET /stats` — Dashboard statistics
- `GET /users` — List users
- `GET /videos` — List videos
- `GET /reports` — List reports
- `POST /users/:uid/ban` — Ban user
- `POST /users/:uid/unban` — Unban user
- `DELETE /videos/:id` — Delete video
- `POST /reports/:id/resolve` — Resolve report

#### API Keys (`/api/keys`)
- `POST /` — Create API key
- `GET /` — List API keys
- `DELETE /:keyId` — Revoke API key

#### External API (`/api/external`)
- `GET /health` — API health check
- `GET /videos` — Fetch videos (API key)
- `POST /upload/video` — Upload video (API key)
- `POST /upload/image` — Upload image (API key)
- `GET /storage/info` — Storage info (API key)

---

## 5. Firestore Collections

| Collection | Purpose |
|-----------|---------|
| `users` | User profiles, preferences, stats |
| `videos` | Video metadata, URLs, engagement stats |
| `comments` | Video comments |
| `likes` | Like records |
| `saves` | Saved video records |
| `follows` | Follow relationships |
| `friendRequests` | Friend request records |
| `notifications` | User notifications |
| `reports` | Content/user reports |
| `hashtags` | Hashtag tracking and trending |
| `views` | View records for analytics |
| `apiKeys` | Third-party API key records |

### Composite Indexes Created
1. `videos` — status ASC, createdAt DESC
2. `videos` — userId ASC, status ASC, createdAt DESC
3. `videos` — isPrivate ASC, status ASC, likesCount DESC
4. `users` — username ASC
5. `hashtags` — count DESC
6. `notifications` — userId ASC, createdAt DESC

---

## 6. Android App

- **Package**: `com.eshort.app`
- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 34 (Android 14)
- **Architecture**: MVVM + Jetpack Compose + Hilt DI

### Key Technologies
| Tech | Version | Purpose |
|------|---------|---------|
| Kotlin | 1.9.22 | Language |
| Jetpack Compose | BOM 2024.01 | UI |
| Hilt | 2.50 | DI |
| Retrofit | 2.9.0 | HTTP |
| ExoPlayer/Media3 | 1.2.1 | Video |
| Coil | 2.5.0 | Images |
| Firebase BOM | 32.7.1 | Auth/DB/FCM |
| Play Services Auth | 20.7.0 | Google Sign-In |

### Android Permissions
| Permission | Purpose |
|-----------|---------|
| `INTERNET` | Network access |
| `ACCESS_NETWORK_STATE` | Network status |
| `READ_MEDIA_VIDEO` | Gallery video access (API 33+) |
| `READ_MEDIA_IMAGES` | Gallery image access (API 33+) |
| `READ_EXTERNAL_STORAGE` | Gallery (API ≤32) |
| `WRITE_EXTERNAL_STORAGE` | Save files (API ≤28) |
| `CAMERA` | Camera capture |
| `RECORD_AUDIO` | Audio recording |
| `POST_NOTIFICATIONS` | Push notifications |
| `FOREGROUND_SERVICE` | Background tasks |
| `FOREGROUND_SERVICE_DATA_SYNC` | Upload service |
| `VIBRATE` | Notification haptics |
| `WAKE_LOCK` | Keep device awake |
| `RECEIVE_BOOT_COMPLETED` | Auto-start service |

---

## 7. Admin Panel App

- **Package**: `com.eshort.admin`
- **Features**: Dashboard, User Management, Video Management, Reports, API Key Management
- **Auth**: Firebase Admin Token
- **Access**: Admin role only (verified by backend middleware)

---

## 8. API Key System (Third-Party Access)

### How It Works
1. Admin creates API key via Admin Panel or `POST /api/keys`
2. API key is hashed (SHA-256) and stored in Firestore `apiKeys` collection
3. Raw key is shown once and must be saved by admin
4. Third-party sends key via `x-api-key` header or `api_key` query parameter
5. All external uploads are stored in Google Drive under the API key owner's account

### Permissions
| Permission | Access Level |
|-----------|-------------|
| `read` | Fetch videos and storage info |
| `write` | Upload videos and images |

### Usage Example
```bash
# Fetch videos
curl -H "x-api-key: eshort_abc123..." https://api.eshort.app/api/external/videos

# Upload video
curl -X POST -H "x-api-key: eshort_abc123..." \
  -F "video=@myvideo.mp4" \
  -F "caption=My video" \
  https://api.eshort.app/api/external/upload/video
```

---

## 9. Security Configuration

### Rate Limiting
| Setting | Value |
|---------|-------|
| Window | 15 minutes |
| Max Requests | 100 per window |
| Auth Limiter | 20 per 15 min |

### JWT
- **Secret**: Stored in `backend/.env` as `JWT_SECRET`
- **Expiry**: 7 days

### Upload Limits
| Type | Max Size |
|------|----------|
| Video | 100 MB |
| Image | 10 MB |
| Video Duration | 180 seconds |

---

## 10. File Locations

### Backend Files (Not in Git)
| File | Purpose |
|------|---------|
| `backend/.env` | Environment variables (all secrets) |
| `backend/serviceAccountKey.json` | Firebase Admin private key |
| `backend/driveConfig.json` | Google Drive folder IDs |

### Android Files (Not in Git)
| File | Purpose |
|------|---------|
| `android/app/google-services.json` | Firebase Android config |

### Build Artifacts
| File | Purpose |
|------|---------|
| `eShort-debug.apk` | User app (debug build) |
| `eShort-debug.aab` | Play Store bundle |
| `eShort-admin.apk` | Admin panel app |

---

## 11. Build Commands

### Backend
```bash
cd backend
npm install
npm start          # Start server
npm run dev        # Development with nodemon
```

### Android App
```bash
cd android
./gradlew assembleDebug   # APK
./gradlew bundleDebug     # AAB
```

### Admin App
```bash
cd admin-app
./gradlew assembleDebug   # Admin APK
```

---

## 12. Deployment

### Backend Deployment
- Deploy `backend/` to any Node.js hosting (Railway, Render, Fly.io, AWS)
- Set all `.env` variables as environment variables
- Upload `serviceAccountKey.json` or set individual Firebase env vars

### Android App
- APK: Direct install on any Android device
- AAB: Upload to Google Play Console → Create Release → Upload Bundle

### Domain Setup
- Update `API_BASE_URL` in `android/app/build.gradle.kts` release variant
- Update `API_BASE_URL` in `admin-app/app/build.gradle.kts` release variant

---

## 13. Owner/Admin Account

- **Google Account**: `fatimakhan208pr@gmail.com`
- **Role**: `admin`
- **Firebase Project**: `eshort-347ae`
- **Google Cloud Project**: `eshort-347ae`
