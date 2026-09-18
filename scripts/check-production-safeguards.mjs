// Starts a disposable local PostgreSQL cluster. Never accepts a database URL.
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer } from "node:net";
import assert from "node:assert/strict";
const root = resolve(import.meta.dirname, "..");
const bin = process.env.PG_BIN || "/opt/homebrew/opt/postgresql@17/bin";
const dir = mkdtempSync(join(tmpdir(), "appraisal-db-check-"));
const listener = createServer();
await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
let started = false;
const run = (name, args) =>
  execFileSync(join(bin, name), args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
const args = [
  "-h",
  "127.0.0.1",
  "-p",
  String(port),
  "-U",
  "postgres",
  "-d",
  "postgres",
  "-v",
  "ON_ERROR_STOP=1",
  "-X",
];
const sql = (text) => run("psql", [...args, "-c", text]);
try {
  run("initdb", [
    "-D",
    dir,
    "-U",
    "postgres",
    "-A",
    "trust",
    "--encoding=UTF8",
    "--locale=C",
  ]);
  run("pg_ctl", [
    "-D",
    dir,
    "-l",
    join(dir, "server.log"),
    "-o",
    `-F -h 127.0.0.1 -p ${port} -k ${dir}`,
    "-w",
    "start",
  ]);
  started = true;
  sql(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA extensions;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    GRANT USAGE ON SCHEMA public, auth, extensions TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;`);
  for (const migration of readdirSync(join(root, "supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    run("psql", [...args, "-f", join(root, "supabase/migrations", migration)]);
  run("psql", [
    ...args,
    "-f",
    join(root, "supabase/tests/production_safeguards.sql"),
  ]);
  run("psql", [
    ...args,
    "-f",
    join(root, "supabase/tests/360_privacy_foundation.sql"),
  ]);
  run("psql", [...args, "-f", join(root, "supabase/tests/360_workflow.sql")]);
  // A held activation lock must serialize participant editing, not allow a late replacement.
  const lockFile = join(dir, "activation.sql");
  writeFileSync(
    lockFile,
    `BEGIN; SET LOCAL request.jwt.claim.sub='10000000-0000-0000-0000-000000000001'; SELECT public.activate_campaign('40000000-0000-0000-0000-000000000003'); SELECT pg_sleep(1); COMMIT;`,
  );
  const activation = spawn(join(bin, "psql"), [...args, "-f", lockFile], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  const done = new Promise((resolve, reject) => {
    activation.on("error", reject);
    activation.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("Activation failed")),
    );
  });
  // Synchronize on the real database lock, without relying on a guessed sleep.
  let locked = false;
  for (let i = 0; i < 100; i++) {
    if (
      run("psql", [
        ...args,
        "-At",
        "-c",
        "SELECT count(*) FROM pg_locks WHERE locktype='transactionid' AND pid <> pg_backend_pid() AND mode='ExclusiveLock'",
      ]).trim() === "1"
    ) {
      locked = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert(locked, "Activation did not acquire its transaction lock");
  assert.throws(
    () =>
      sql(
        `SET request.jwt.claim.sub='10000000-0000-0000-0000-000000000001'; SET ROLE authenticated; SELECT public.save_appraisal_participants('40000000-0000-0000-0000-000000000003','[]');`,
      ),
    /editable annual appraisal draft/,
  );
  await done;
  assert.match(
    sql(
      "SELECT status, (SELECT count(*) FROM public.campaign_assignments a WHERE a.campaign_id=c.id) FROM public.campaigns c WHERE id='40000000-0000-0000-0000-000000000003'",
    ),
    /active\s+\|\s+2/,
  );
  const token = run("psql", [
    ...args,
    "-At",
    "-c",
    "SELECT payload->>'raw_token' FROM public.email_outbox WHERE payload->>'campaign_id'='40000000-0000-0000-0000-000000000003' LIMIT 1",
  ]).trim();
  const question = run("psql", [
    ...args,
    "-At",
    "-c",
    "SELECT id FROM public.campaign_questions WHERE campaign_id='40000000-0000-0000-0000-000000000003'",
  ]).trim();
  sql(
    `SET ROLE anon; SELECT public.respond_save('${token}', jsonb_build_array(jsonb_build_object('campaign_question_id','${question}','text_value','Saved reflection')));`,
  );
  assert.match(
    sql(
      `SET ROLE anon; SELECT text_value FROM public.respond_get_saved_answers('${token}');`,
    ),
    /Saved reflection/,
  );
  assert.throws(
    () =>
      sql(
        "SET ROLE anon; SELECT * FROM public.respond_get_saved_answers('unknown-token');",
      ),
    /Invalid or closed appraisal link/,
  );
  const submitFile = join(dir, "submission.sql");
  writeFileSync(
    submitFile,
    `BEGIN; SET LOCAL ROLE anon; SELECT public.respond_submit('${token}', jsonb_build_array(jsonb_build_object('campaign_question_id','${question}','text_value','Final reflection'))); SELECT pg_sleep(1); COMMIT;`,
  );
  const submission = spawn(join(bin, "psql"), [...args, "-f", submitFile], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  const submitted = new Promise((resolve, reject) => {
    submission.on("error", reject);
    submission.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("Submission failed")),
    );
  });
  let submitting = false;
  for (let i = 0; i < 100; i++) {
    if (
      run("psql", [
        ...args,
        "-At",
        "-c",
        "SELECT count(*) FROM pg_locks WHERE locktype='transactionid' AND pid <> pg_backend_pid() AND mode='ExclusiveLock'",
      ]).trim() === "1"
    ) {
      submitting = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert(submitting, "Submission did not acquire its transaction lock");
  assert.throws(
    () =>
      sql(
        `SET ROLE anon; SELECT public.respond_save('${token}', jsonb_build_array(jsonb_build_object('campaign_question_id','${question}','text_value','Late overwrite')));`,
      ),
    /not open for responses/,
  );
  await submitted;
  assert.match(
    sql(
      "SELECT text_value FROM public.response_answers WHERE campaign_question_id='" +
        question +
        "'",
    ),
    /Final reflection/,
  );
  sql(
    "SET request.jwt.claim.sub='10000000-0000-0000-0000-000000000001'; SET ROLE authenticated; SELECT public.close_campaign('40000000-0000-0000-0000-000000000003');",
  );
  assert.throws(
    () => sql(`SET ROLE anon; SELECT public.respond_save('${token}', '[]');`),
    /Invalid or expired link/,
  );
  assert.throws(
    () =>
      sql(
        `SET ROLE anon; SELECT * FROM public.respond_get_saved_answers('${token}');`,
      ),
    /Invalid or closed appraisal link/,
  );
  console.log(
    "PASS: PostgreSQL migrations, private 360 grants/RLS, immutable contracts, closed-only/cohort-safe reports, launch guards, atomic rollback, tenancy, GMT/BST scheduling, annual respondent/results/close path, activation/edit and submit/save races.",
  );
} finally {
  if (started) run("pg_ctl", ["-D", dir, "-m", "immediate", "-w", "stop"]);
  rmSync(dir, { recursive: true, force: true });
}
