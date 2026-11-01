# Acme Tasks (sandbox)

A small, fake task-management SaaS used as a **test target** for Clevera (screen recording to how-to videos and help articles). Everything is static and runs in the browser; data is fake and lives in `localStorage`.

- Live: https://clevera-ai.github.io/acme-tasks-sandbox/
- Stack: Vite, React, TypeScript, Tailwind, React Router (`basename` `/acme-tasks-sandbox`).

## Demo account (public, fake)

| | |
|---|---|
| Email | `demo@acme-tasks.test` |
| Password | `AcmeDemo!2026` |
| 6-digit code (`password_code`) | `424242` |
| Authenticator key (`password_totp`) | `JBSWY3DPEHPK3PXP` (TOTP, SHA-1, 6 digits, 30 s) |

Whether you are asked to sign in depends on `src/config/auth.json` (`none`, `password`, `password_code`, `password_totp`).

## Reset the data

Add `?reset` to any URL (for example `/acme-tasks-sandbox/projects?reset`) to reseed the demo data and sign out.

## Areas

Projects (list, create, rename, archive/unarchive), Tasks (create, status, edit, delete, filter by assignee), Settings (profile, notifications, language, members and invitations), Billing (plans, invoices), Integrations (Slack, Google Calendar).

## Config: how the app changes between versions

| File | Purpose |
|---|---|
| `src/config/auth.json` | `{ "mode": "none" \| "password" \| "password_code" \| "password_totp" }` |
| `src/config/flags.json` | Feature flags. All features are built in and off by default |
| `src/config/copy.json` | Button labels and headings |
| `src/config/theme.json` | Colours and spacing |

## Scripts

```sh
npm run build

npm run auth -- <none|password|password_code|password_totp> [--no-push]   # commits "Auth mode: ..." and pushes
npm run release -- <id> [--no-push]                         # apply releases/<id>.json
npm run release -- --revert <id> [--no-push]                # new commit undoing a set
```

A release bumps `package.json` (`v1.N` is version `1.N.0`), prepends to `CHANGELOG.md`, commits `Release v1.N: ...`, tags `v1.N`, pushes, and runs `gh release create`. `--no-push` does everything except the push and the GitHub release. Pushing to `main` deploys to GitHub Pages.

### Release sets (`releases/*.json`)

Each set is a list of exact edits (`ops`) to config files, so the diff is small. A set that does not match the current files changes nothing.

| id | What it does |
|---|---|
| r1 | "Export to CSV" button on Projects |
| r2 | "Invite teammates" becomes "Add people", moves to a top-bar dialog |
| r3 | Wording only: seven labels and headings |
| r4 | Restyle only: colours and spacing |
| r5 | Internal refactor commit. No version, tag or release |
| r6 | Task labels, saved filters bar, dark mode, `?` shortcuts, bulk delete |
| r7 | Remove the Slack integration |
| r8a / r8b | Due-date reminders toggle / project description field (apply separately) |
| r9 | Revert of r7 (same as `--revert r7`) |
| r10 | Broken deploy: blank page. Fix with `npm run release -- --revert r10` |
