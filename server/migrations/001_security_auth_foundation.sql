-- PrimeTrade Neon security foundation
-- Idempotent schema-only migration. It deliberately does NOT copy or delete
-- legacy JSON data and does not grant access to any API by itself.
BEGIN;

CREATE TABLE IF NOT EXISTS auth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  email_verified_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS auth_accounts_username_ci_uq ON auth_accounts (LOWER(username));
CREATE UNIQUE INDEX IF NOT EXISTS auth_accounts_email_ci_uq ON auth_accounts (LOWER(email));

CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  csrf_token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_hash TEXT
);
CREATE INDEX IF NOT EXISTS auth_sessions_account_idx ON auth_sessions(account_id);
CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx ON auth_sessions(expires_at) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS auth_otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES auth_accounts(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  purpose VARCHAR(30) NOT NULL CHECK (purpose IN ('registration', 'login', 'password_reset', 'withdrawal')),
  code_hash TEXT NOT NULL,
  attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  delivery_id TEXT
);
CREATE INDEX IF NOT EXISTS auth_otp_email_purpose_idx ON auth_otp_challenges(LOWER(email), purpose, created_at DESC);

CREATE TABLE IF NOT EXISTS user_profiles (
  account_id UUID PRIMARY KEY REFERENCES auth_accounts(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL DEFAULT '',
  phone VARCHAR(50),
  country VARCHAR(100),
  city VARCHAR(100),
  account_balance NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (account_balance >= 0),
  demo_balance NUMERIC(18,2) NOT NULL DEFAULT 50000,
  kyc_tier VARCHAR(50) NOT NULL DEFAULT 'Unverified',
  is_kyc_verified BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_initials VARCHAR(8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_transactions (
  id VARCHAR(120) PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES auth_accounts(id),
  type VARCHAR(40) NOT NULL,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  asset VARCHAR(120) NOT NULL,
  status VARCHAR(30) NOT NULL CHECK (status IN ('COMPLETED','PENDING','PROCESSING','REJECTED')),
  reference VARCHAR(180) NOT NULL UNIQUE,
  note TEXT,
  proof_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS app_transactions_account_created_idx ON app_transactions(account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS kyc_submissions (
  id VARCHAR(120) PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES auth_accounts(id),
  id_type VARCHAR(80) NOT NULL,
  document_number_encrypted TEXT,
  issue_country VARCHAR(100) NOT NULL,
  front_document_key TEXT,
  proof_document_key TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth_accounts(id)
);
CREATE INDEX IF NOT EXISTS kyc_submissions_account_idx ON kyc_submissions(account_id);

CREATE TABLE IF NOT EXISTS support_messages (
  id VARCHAR(120) PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES auth_accounts(id),
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('user','admin','system')),
  message TEXT NOT NULL,
  is_read_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS support_messages_account_created_idx ON support_messages(account_id, created_at);

CREATE TABLE IF NOT EXISTS withdrawal_codes (
  id VARCHAR(120) PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES auth_accounts(id),
  code_hash TEXT NOT NULL,
  status VARCHAR(12) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','USED','EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth_accounts(id)
);
CREATE INDEX IF NOT EXISTS withdrawal_codes_account_status_idx ON withdrawal_codes(account_id, status);

CREATE TABLE IF NOT EXISTS crypto_payment_methods (
  id VARCHAR(120) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  network VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  memo TEXT,
  qr_code_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  min_deposit NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (min_deposit >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_schema_migrations (
  version VARCHAR(80) PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO app_schema_migrations(version)
VALUES ('001_security_auth_foundation')
ON CONFLICT (version) DO NOTHING;

COMMIT;
