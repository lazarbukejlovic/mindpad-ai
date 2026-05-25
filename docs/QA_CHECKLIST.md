# MindPad AI — Manual QA Checklist

Run through this checklist before every production release. Each item must pass on both desktop (1280px+) and mobile (375px).

---

## Auth

- [ ] Email registration creates a new account and lands on /dashboard
- [ ] Login with correct email/password issues a valid JWT and loads dashboard
- [ ] Login with wrong password shows "Invalid credentials" (no stack trace)
- [ ] "Continue with Google" button on /login redirects to Google consent screen
- [ ] "Continue with Google" button on /register redirects to Google consent screen
- [ ] After Google OAuth, user is redirected to /dashboard (no `?google=success&token=` in URL bar)
- [ ] Google login with a new email creates a Free account
- [ ] Google login with an existing email links accounts — plan, tasks, and billing are preserved
- [ ] Logging out clears localStorage and redirects to /login
- [ ] Accessing /dashboard without a token redirects to /login

---

## Dashboard

- [ ] Morning Brief generates and shows focus, priorities, and warning (if any)
- [ ] Ask AI returns a relevant answer for a natural-language question
- [ ] AI status badge shows the correct plan name (FREE / PRO / TEAM)
- [ ] Streak and KPI cards match data in /analytics
- [ ] No raw `undefined`, `null`, or encoding junk visible anywhere

---

## Tasks

- [ ] Add a task — appears in the list immediately
- [ ] Complete a task — moves to completed section / checked state
- [ ] Edit a task title inline
- [ ] Delete a task — removed from list
- [ ] AI Cleanup runs and shows suggestions (Pro/Team) or upgrade gate (Free)
- [ ] Priority Insight panel shows correct task counts
- [ ] Empty state renders correctly when no tasks exist

---

## Brain Dump

- [ ] Type a brain dump and click Organize — returns structured AI response
- [ ] AI response sections render (Actions, Projects, Reference) without encoding artifacts
- [ ] Extracted tasks can be saved to the task list
- [ ] Empty state shown before first brain dump
- [ ] Free plan shows entitlement limit or upgrade prompt after quota

---

## Focus

- [ ] Task selector loads all active tasks
- [ ] Starting a session with a short task title shows the coaching warning
- [ ] Timer counts down correctly
- [ ] AI recommendation renders without encoding artifacts (no `â€"` or `â€™` visible)
- [ ] Completing a session saves it and increments the focus session count in analytics
- [ ] Pausing and resuming works
- [ ] Session completes correctly at T=0

---

## Analytics

- [ ] KPI cards show correct completed tasks, focus minutes, brain dumps, streak
- [ ] Weekly bar chart renders (or shows empty state gracefully)
- [ ] Evening Summary generates when clicked
- [ ] Weekly Review generates (Pro/Team) or shows upgrade gate (Free)
- [ ] Export Summary generates (Pro/Team) or shows upgrade gate (Free)
- [ ] Empty state ("No analytics yet") renders correctly when no data exists
- [ ] Error state does NOT say "Make sure the API is running"

---

## Team (Team plan only)

- [ ] Create workspace — shows workspace name and team code
- [ ] Team code is copyable
- [ ] Invite member flow works (send invite)
- [ ] Weekly team report generates and renders
- [ ] Non-Team users see the upgrade gate
- [ ] Workspace deletion prompts for confirmation

---

## Settings

- [ ] Account card shows name and email correctly
- [ ] Google avatar image displays for Google/mixed auth users
- [ ] Initials fallback shows for email-only users
- [ ] "Google connected" badge appears for Google/mixed auth users
- [ ] Plan section shows current plan (Free / Pro / Team)
- [ ] Upgrade to Pro button initiates Stripe Checkout
- [ ] Upgrade to Team button initiates Stripe Checkout
- [ ] "Coming soon" on Delete Account is visible but not interactive
- [ ] Theme, notifications, and other preference toggles render

---

## Pricing

- [ ] Free plan shows $0/month
- [ ] Pro plan shows $9/month
- [ ] Team plan shows $29/month
- [ ] "Get Started" (Free) links to /register
- [ ] "Upgrade to Pro" and "Upgrade to Team" initiate Stripe Checkout for logged-in users
- [ ] Already-on-plan state handled gracefully (no double-charge prompt)

---

## Visual / Cross-cutting

- [ ] No page shows raw `undefined` or `null` in the UI
- [ ] No encoding artifacts: `â€"`, `â€™`, `â€œ`, `Â` are never visible
- [ ] No UI text says: "offline", "fallback", "quota exceeded", "API server", "not reachable", "coming soon" (except the intentional Delete Account badge)
- [ ] Mobile (375px): all pages scroll correctly, no overflow, buttons tappable
- [ ] Mobile: navigation works (hamburger or bottom bar)
- [ ] Desktop (1280px): sidebar visible, layout not broken
- [ ] All pages load within 3 seconds on a local dev server (no layout thrash)

---

## Session / token health

- [ ] Logging in after sign-out with the same email/password works reliably
- [ ] Old sessions (dev-era UUID tokens in localStorage) are auto-cleared on first API call — user is redirected to /login, NOT shown a CastError
- [ ] After Google OAuth, visiting `/dashboard` shows the correct user email/name (not empty)
- [ ] `/api/auth/me` requires a valid JWT — returns 401 for missing/invalid/expired tokens
- [ ] `/api/auth/me` returns `id`, `_id`, `email`, `name`, `avatarUrl`, `authProvider`, `plan`, `subscriptionStatus`
- [ ] No route throws `Cast to ObjectId failed` — UUID-bearing tokens are rejected with `INVALID_TOKEN` before reaching any controller

---

## Session persistence (Phase 1B)

- [ ] After email/password login, close the browser tab entirely and reopen — user is still logged in, no re-authentication required
- [ ] After Google OAuth login, close the browser tab entirely and reopen — user is still logged in
- [ ] Logging out clears `mindpad_token` **and** `mindpad_me` from localStorage — no auth data remains
- [ ] After logout, pressing the browser Back button does NOT re-enter a protected page (it shows /login or is blocked)
- [ ] Visiting /dashboard with an **expired** or **invalid** JWT redirects to /login without a blank-page flash
- [ ] If `/auth/me` returns a network error (5xx / offline), the user remains logged in with cached data — no premature logout
- [ ] Legacy `token` localStorage key (from pre-Phase-1B sessions) is automatically migrated to `mindpad_token` on next page load — user stays logged in
- [ ] Protected pages (/dashboard, /tasks, /brain-dump, /focus, /analytics, /settings, /team) all show a centered spinner while auth is being verified — no content flash before redirect
- [ ] No protected page sends `Authorization: Bearer undefined` or `Bearer null` to the API

---

## Password reset & email verification (Phase 1)

- [ ] Login page: "Forgot password?" link is visible inline with the Password label, links to /forgot-password
- [ ] /forgot-password: submitting any email address (existing or not) shows the same success message (enumeration-safe)
- [ ] /forgot-password: submitting shows success message — no "Invalid credentials" or server error shown
- [ ] /reset-password?token=…: page loads, shows new password form
- [ ] /reset-password: submitting a valid token + new password succeeds and redirects to /login
- [ ] /reset-password: submitting an expired or invalid token shows a clear error (no stack trace)
- [ ] Logging in with the **new** password after a reset works
- [ ] Logging in with the **old** password after a reset is rejected
- [ ] New email/password registrations: verification banner appears on /dashboard ("Please verify your email")
- [ ] Google users: verification banner does **not** appear (Google emails are implicitly verified)
- [ ] Verification banner: "Resend email" button sends a new verification email without page reload
- [ ] Verification banner: can be dismissed (×) — stays dismissed for the session
- [ ] Clicking the verification link from email marks account as verified; banner disappears on next visit
- [ ] /settings Account card: "Email verified" badge shown for verified email users
- [ ] /settings Account card: no "Email verified" badge for unverified users (banner shown instead)
- [ ] After password reset, `emailVerified` is set to true (user does not need to re-verify)

## Build verification (run before every release)

```bash
# Backend TypeScript
cd apps/api && npx tsc --noEmit

# Frontend TypeScript
cd apps/web && npx tsc --noEmit

# Next.js production build
cd apps/web && npm run build
```

All three must complete with **0 errors**.
