@AGENTS.md

## Quick facts

- **Database:** MongoDB through Mongoose. The schemas in `src/models/*.ts` are the source of
  truth; there are no SQL migrations. On an empty database run, in this order:
  `npm run db:indexes` (collections and indexes), then `npm run db:seed -- --demo-users`
  (sample catalogue and demo accounts). `npm run db:setup` runs both.
- **First admin:** register in the app, then `npm run promote-admin -- you@example.com`.
- **Checks:** `npm run lint`, `npm run typecheck`, `npm test` (unit tests in `tests/`, Node
  22.18+), `npm run build`. `npm run test:demo -- <url>` runs the API smoke test of the demo flow.
- **Access control:** every data-changing API route starts with `requireRoleForWrite(...)` or
  `requireRole(...)` from `src/lib/authGuard.ts`; see the rules in AGENTS.md.
