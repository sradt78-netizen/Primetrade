# Neon security foundation migration

This migration adds the database structures needed for server-verified accounts,
sessions, email OTP challenges, user profiles, transactions, KYC, support messages,
withdrawal-code hashes, and payment methods.

## Safety properties

- The SQL is idempotent and wrapped in a transaction.
- It does not drop or rewrite existing tables.
- It does not copy, overwrite, or delete legacy JSON records.
- It does not enable or expose any API route.
- It stores only hashes for session tokens, OTPs, and withdrawal codes.
- KYC document numbers are represented by an encrypted-value column; application
  code must encrypt them before storing them. Do not store plaintext identity data.

## Before running

1. Take a backup/snapshot of the existing Neon database.
2. Confirm the Vercel project's `DATABASE_URL` points to the intended Neon project.
3. Run this migration against a staging Neon branch first, if available.
4. Never paste the database URL into chat, GitHub source files, or a client-side
   `VITE_*` variable.

## Explicit execution

With the repository checked out in a trusted environment that has the existing
`DATABASE_URL` configured, run:

```bash
CONFIRM_NEON_MIGRATION=YES npm run db:migrate
```

The command refuses to run unless the explicit confirmation variable is set.
It reports success only after checking the migration ledger row.

## Not included yet

This is a schema foundation, not a finished authentication implementation.
The application still needs server-side registration/login, password hashing,
HttpOnly session cookies, CSRF checks, rate limiting, per-user authorization,
admin role provisioning, OTP delivery/verification, and data-preserving migration
of existing JSON records. Keep the temporary API lockdown in place until those
features are implemented and tested.
