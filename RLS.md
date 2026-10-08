# Row Level Security (RLS)

Geopoly / JustGimmeADolla stores its data in Supabase Postgres.
The anon key is **public** — it ships in the browser bundle — so
RLS policies, not the key, are what protect the data. RLS is
enabled on **every** public table, with the policy set in
[`supabase/migrations/004_enable_row_level_security.sql`](supabase/migrations/004_enable_row_level_security.sql).

## Apply it to the live project (one time)

Option A — Supabase Dashboard → SQL Editor → paste the whole
`004_enable_row_level_security.sql` file → Run.

Option B — `supabase link --project-ref <your-ref>` then
`supabase db push`.

The migration is idempotent and safe to re-run. It does not
delete data. After running it, nothing in the app code needs to
change: all server routes already use the service-role key,
which bypasses RLS after the route itself checks authorization.

Fresh installs: run `schema.sql`, then migration 004.

## Who can do what

| Table | anon (not signed in) | authenticated | admin (in `admins`) | service role (server) |
|---|---|---|---|---|
| `stories` | Read **approved** only; insert a new **pending** story (not featured, tip/view counters must be 0) | Same as anon | Read all statuses; update; delete | Full access |
| `tips` | Nothing | Nothing | Read | Full access — rows are only created after Stripe/PayPal verifies payment server-side |
| `admins` | Nothing | Read only the row matching your own login email | (same — the list itself is SQL-editor/service-role only) | Full access |
| `reactions` | Nothing | Nothing | Nothing | Full access, via `/api/reactions` only |
| `storage.objects` (`story-media`) | Read; upload only to `audio/` or `covers/` | Same as anon | Update/delete files | Full access |
| Views `country_stats`, `map_stories` | Read (approved stories only, `security_invoker = true`) | Read | Read | Read |

Adding an admin is still a manual, trusted step:

```sql
INSERT INTO public.admins (email) VALUES ('you@example.com');
```

## What was wrong before 004

- `admins` had RLS disabled everywhere — the admin email list
  was readable through the public anon key.
- `tips` had `INSERT ... WITH CHECK (true)` for the public —
  anyone could insert a fake `completed` tip. It also existed
  only in `schema.sql`, not in the migrations.
- `stories` public insert only checked `status = 'pending'`,
  so a direct API caller could set `featured`, `tip_total`, …
- Storage uploads were allowed to any path in the bucket.
- `increment_view_count` was `SECURITY DEFINER` with no pinned
  `search_path` and counted views on pending/rejected stories.
- The two views bypassed the underlying table's RLS.

## Verify after applying

In the SQL Editor:

```sql
-- Every row must show rowsecurity = true
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' ORDER BY tablename;

-- Expected counts: stories 5, tips 1, admins 1, reactions 0,
-- storage.objects 4 (story-media)
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY tablename, policyname;
```

Supabase Dashboard → Database → Advisors should also stop
reporting any "RLS disabled" / "policy missing" findings for
public tables.
