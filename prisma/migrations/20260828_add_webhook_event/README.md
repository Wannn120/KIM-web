Migration: add_webhook_event

This migration creates the `webhook_event` table used by the webhook handler to record incoming
payment provider notifications and ensure idempotent processing.

To apply locally (development):

1. Ensure `DATABASE_URL` in your `.env` points to your development database.
2. Run:

```bash
npx prisma migrate dev --name add_webhook_event
```

To deploy in production (CI / release):

```bash
npx prisma migrate deploy
```

Notes:
- The migration SQL enables the `uuid-ossp` extension. Ensure your Postgres user has privilege to create extensions.
- If your Postgres environment uses `pgcrypto` instead, adjust the SQL to use `gen_random_uuid()` instead of `uuid_generate_v4()`.
