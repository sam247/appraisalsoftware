-- Hosted Auth had "Confirm email" enabled while the app signup flow signs in
-- immediately (matches config.toml enable_confirmations = false). Auto-confirm
-- new users so password sign-in works without a confirmation mailbox.
CREATE OR REPLACE FUNCTION private.autoconfirm_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'auth', 'private', 'pg_temp'
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS autoconfirm_auth_user ON auth.users;
CREATE TRIGGER autoconfirm_auth_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION private.autoconfirm_auth_user();

REVOKE ALL ON FUNCTION private.autoconfirm_auth_user() FROM PUBLIC, anon, authenticated;

-- Unblock anyone already stuck behind hosted Confirm Email.
UPDATE auth.users
SET email_confirmed_at = now(), updated_at = now()
WHERE email_confirmed_at IS NULL;
