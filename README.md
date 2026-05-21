# IdeaVault – Server

Express.js REST API for the IdeaVault platform, backed by MongoDB Atlas.

## Endpoints

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/users/jwt` | — | Generate JWT token |
| GET | `/api/users/profile` | ✅ | Get user profile |
| PUT | `/api/users/profile` | ✅ | Update user profile |

### Ideas
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/ideas` | — | Get all ideas (search, filter, limit) |
| GET | `/api/ideas/trending` | — | Get top 6 by views |
| GET | `/api/ideas/:id` | — | Get single idea |
| POST | `/api/ideas` | ✅ | Create idea |
| PUT | `/api/ideas/:id` | ✅ owner | Update idea |
| DELETE | `/api/ideas/:id` | ✅ owner | Delete idea |
| GET | `/api/ideas/user/:email` | ✅ | Get ideas by user |

### Comments
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/comments/:ideaId` | — | Get comments for an idea |
| POST | `/api/comments` | ✅ | Add comment |
| PUT | `/api/comments/:id` | ✅ owner | Edit comment |
| DELETE | `/api/comments/:id` | ✅ owner | Delete comment |
| GET | `/api/comments/user/:email` | ✅ | Get all comments by user |

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```
