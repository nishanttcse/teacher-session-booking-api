# Session Booking API

A standalone TypeScript, Express, and MongoDB/Mongoose API. It runs alongside the existing lead-management backend without changing its PostgreSQL/Prisma setup.

## Requirements

- Node.js 18+
- MongoDB 6+
- npm

## Setup

```powershell
cd backend/session-api
npm install
@'
MONGODB_URI=mongodb://127.0.0.1:27017/session_booking
PORT=3001
NODE_ENV=development
'@ | Set-Content .env
npm run dev
```

The API listens on port `3001` by default. For a production-style run, use `npm run build` followed by `npm start`.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/users` | Create a user |
| `POST` | `/teachers` | Create a teacher for session scheduling |
| `POST` | `/sessions` | Create an available session |
| `GET` | `/sessions/available?dateTimestamp=<milliseconds>` | List available sessions on the UTC date containing the supplied Unix timestamp |
| `POST` | `/sessions/:id/book` | Book an available session; JSON body: `{ "userId": "<ObjectId>" }` |
| `PATCH` | `/sessions/:id/complete` | Mark a booked session complete |
| `GET` | `/users/:id/sessions` | Return the user's upcoming and completed sessions |
| `GET` | `/health` | Health check |

Creation bodies:

```json
{ "fullName": "Alex User", "email": "alex@example.com", "phone": "+1-555-0100" }
```

```json
{ "fullName": "Jordan Teacher", "email": "jordan@example.com", "specialization": "Mathematics", "experience": 5 }
```

```json
{ "teacherId": "<ObjectId>", "startTime": "2026-11-01T14:00:00.000Z", "endTime": "2026-11-01T15:00:00.000Z" }
```

The available-session and user-session endpoints use MongoDB aggregation pipelines. Booking and completion use conditional atomic updates to prevent conflicting status changes. Validation errors return `400`, missing records `404`, duplicate email or invalid state transitions `409`, and unexpected failures are handled centrally.

Import [`postman/session-booking-api.postman_collection.json`](./postman/session-booking-api.postman_collection.json) into Postman. The collection stores created IDs in variables for the booking workflow.
