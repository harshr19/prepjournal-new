# PrepJournal API

## Setup

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI` and a long random `JWT_SECRET`.
3. Start MongoDB.
4. Run `npm run server`.

To load the demo profiles, FAANG-style interviews, rounds, answers, and question bank data, run:

```bash
npm run seed
```

This resets only the three demo accounts (`harsh.demo@prepjournal.dev`, `priya.demo@prepjournal.dev`, and `jordan.demo@prepjournal.dev`) before reseeding them. The password for each demo account is `PrepJournal123!`.

The API listens on `http://localhost:5000` by default.

## Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/interviews`
- `POST /api/interviews`
- `GET /api/interviews/:id`
- `PATCH /api/interviews/:id`
- `DELETE /api/interviews/:id`
- `GET /api/interviews/stats/summary`

Interview routes require `Authorization: Bearer <token>`. Each interview is scoped to the authenticated owner. `GET /api/interviews` accepts `search`, `difficulty`, `result`, `page`, and `limit`.
