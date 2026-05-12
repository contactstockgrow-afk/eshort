# eShort API Documentation

Base URL: `http://localhost:3000/api`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <firebase_id_token>
```

## Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/google-signin` | No | Google Sign-In |
| GET | `/auth/me` | Yes | Get current user |
| PUT | `/auth/me` | Yes | Update profile |
| GET | `/auth/google/drive-auth-url` | Yes | Get Google Drive auth URL |
| GET | `/auth/google/callback` | No | Drive OAuth callback |
| POST | `/auth/fcm-token` | Yes | Update FCM token |
| POST | `/auth/logout` | Yes | Logout |

### Feed
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/feed/for-you` | Optional | For You feed |
| GET | `/feed/following` | Yes | Following feed |
| GET | `/feed/friends` | Yes | Friends feed |

### Videos
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/videos` | Optional | List videos |
| GET | `/videos/trending` | Optional | Trending videos |
| GET | `/videos/:id` | Optional | Get video |
| POST | `/videos/:id/like` | Yes | Like video |
| DELETE | `/videos/:id/like` | Yes | Unlike video |
| POST | `/videos/:id/comment` | Yes | Add comment |
| GET | `/videos/:id/comments` | Optional | Get comments |
| DELETE | `/videos/:id/comment/:commentId` | Yes | Delete comment |
| POST | `/videos/:id/share` | Yes | Share video |
| POST | `/videos/:id/view` | Optional | Record view |
| POST | `/videos/:id/save` | Yes | Save video |
| DELETE | `/videos/:id/save` | Yes | Unsave video |
| DELETE | `/videos/:id` | Yes | Delete video |
| POST | `/videos/:id/report` | Yes | Report video |

### Upload
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/upload/video` | Yes | Upload video (multipart) |
| POST | `/upload/profile-picture` | Yes | Upload profile picture |
| POST | `/upload/thumbnail` | Yes | Upload thumbnail |
| GET | `/upload/status/:id` | Yes | Get upload status |
| POST | `/upload/draft` | Yes | Save draft |
| GET | `/upload/drafts` | Yes | Get drafts |
| DELETE | `/upload/draft/:id` | Yes | Delete draft |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/:id` | Optional | Get user profile |
| PUT | `/users/profile` | Yes | Update profile |
| GET | `/users/:id/videos` | Optional | Get user videos |
| GET | `/users/:id/followers` | No | Get followers |
| GET | `/users/:id/following` | No | Get following |
| POST | `/users/:id/follow` | Yes | Follow user |
| DELETE | `/users/:id/follow` | Yes | Unfollow user |
| POST | `/users/:id/block` | Yes | Block user |
| DELETE | `/users/:id/block` | Yes | Unblock user |
| GET | `/users/me/saved` | Yes | Get saved videos |
| GET | `/users/me/liked` | Yes | Get liked videos |

### Social
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/social/friend-request/:userId` | Yes | Send friend request |
| POST | `/social/friend-request/:id/accept` | Yes | Accept request |
| POST | `/social/friend-request/:id/reject` | Yes | Reject request |
| DELETE | `/social/friend-request/:id` | Yes | Cancel request |
| GET | `/social/friend-requests/pending` | Yes | Pending requests |
| GET | `/social/friend-requests/sent` | Yes | Sent requests |
| GET | `/social/friends` | Yes | Get friends |
| DELETE | `/social/friends/:userId` | Yes | Remove friend |

### Search
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/search?q=&type=` | Optional | Search |
| GET | `/search/suggestions?q=` | Optional | Search suggestions |
| GET | `/search/trending` | Optional | Trending content |
| GET | `/search/hashtags/:tag` | Optional | Hashtag videos |
| GET | `/search/discover` | Optional | Discover content |

### Notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Yes | Get notifications |
| GET | `/notifications/unread-count` | Yes | Unread count |
| PUT | `/notifications/:id/read` | Yes | Mark as read |
| PUT | `/notifications/read-all` | Yes | Mark all read |
| DELETE | `/notifications/:id` | Yes | Delete notification |
| PUT | `/notifications/settings` | Yes | Update settings |
| GET | `/notifications/settings` | Yes | Get settings |

### Admin (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Dashboard stats |
| GET | `/admin/users` | List users |
| PUT | `/admin/users/:id/role` | Update role |
| PUT | `/admin/users/:id/ban` | Ban user |
| PUT | `/admin/users/:id/unban` | Unban user |
| GET | `/admin/videos` | List videos |
| DELETE | `/admin/videos/:id` | Remove video |
| GET | `/admin/reports` | List reports |
| PUT | `/admin/reports/:id/resolve` | Resolve report |
| GET | `/admin/analytics` | Analytics |
| GET | `/admin/uploads` | Upload activity |

## Pagination

Cursor-based pagination:
```
?limit=20&cursor=<last_item_id>
```

Response includes:
```json
{
  "pagination": {
    "hasMore": true,
    "nextCursor": "abc123"
  }
}
```

## Error Responses

```json
{
  "success": false,
  "error": {
    "message": "Error description"
  }
}
```

## Rate Limits

- General API: 100 requests / 15 min
- Authentication: 10 requests / 15 min
- Upload: 20 requests / hour
- Search: 30 requests / min
