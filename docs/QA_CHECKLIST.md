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

---

## Onboarding (Phase 2)

### New user flow
- [ ] New email user (no data) is redirected to /onboarding after login — not to /dashboard
- [ ] New Google user (no data) is redirected to /onboarding after login — not to /dashboard
- [ ] Existing user (tasks or brain dumps or focus sessions in DB) goes directly to /dashboard — onboarding is skipped
- [ ] Authenticated user who visits /onboarding directly when already onboarded is redirected to /dashboard

### Step 1 — Goal selection
- [ ] All 6 goal options render correctly
- [ ] Clicking a goal saves it via PATCH /api/onboarding/status and advances to step 2
- [ ] Progress bar advances from 0% to 25% after step 1

### Step 2 — Brain dump
- [ ] Starter buttons prefill the textarea with a useful template
- [ ] All 5 starter button variants produce distinct, non-empty text
- [ ] "Extract tasks" is disabled when textarea is empty
- [ ] Submitting a non-empty dump calls POST /ai/organize and advances to step 3
- [ ] Extraction quota limit (free plan) shows the normal upgrade prompt — does not crash
- [ ] If AI is unavailable, offline extraction still returns tasks

### Step 3 — Extraction results
- [ ] Extracted tasks render with priority badges (High/Medium/Low)
- [ ] First task is visually highlighted as the primary task
- [ ] Focus recommendation panel is shown (if returned by AI)
- [ ] "Add to task list" creates the tasks via POST /api/tasks/bulk and advances to step 4
- [ ] firstBrainDumpCompleted and firstTasksExtracted are set to true in the DB

### Step 4 — Focus recommendation
- [ ] Suggested duration is 25 min for small tasks, 50 min for larger tasks
- [ ] "Start first focus session" marks firstFocusStarted=true, calls POST /api/onboarding/complete, and redirects to /focus
- [ ] "Skip for now" marks onboarding complete and redirects to /dashboard

### Step 5 — Completion
- [ ] Completion summary shows correct checked/unchecked state for each milestone
- [ ] "Go to Dashboard" calls POST /api/onboarding/complete and redirects to /dashboard
- [ ] onboardingCompleted is true in the DB after completion

### Dashboard checklist
- [ ] Users who have NOT completed onboarding see the "Getting started" checklist card on /dashboard
- [ ] Checklist shows correct checked/unchecked state for each step
- [ ] After completing onboarding, the checklist card disappears on next visit
- [ ] "Continue setup →" link goes to /onboarding

### Settings — onboarding section
- [ ] Settings page shows an "Onboarding" card
- [ ] "Restart onboarding" button calls POST /api/onboarding/restart and redirects to /onboarding
- [ ] After restart, user data (tasks, brain dumps, focus sessions, billing) is NOT deleted
- [ ] After restart, user is sent through onboarding again as if new

### Empty states
- [ ] /tasks with no tasks: shows "Brain dump → extract tasks" link and "Add manually" button
- [ ] /brain-dump with no entries: shows descriptive empty state with guidance
- [ ] /focus with no active tasks: shows link to brain dump flow
- [ ] /analytics with no data: shows links to brain dump and focus pages
- [ ] /dashboard with no brain dumps: "Start a brain dump →" link appears in Recent Notes

### Regression (must still pass after Phase 2)
- [ ] Stripe checkout and billing still work
- [ ] Google login still works end-to-end
- [ ] Password reset still works
- [ ] Email verification still works
- [ ] Persistent login (mindpad_token) still works across browser close/reopen
- [ ] Free plan extraction limit is still enforced during onboarding
- [ ] Pro/Team features still gated correctly

---

## Team Workspace (Phase 3)

### Plan limits
- [ ] Free plan user: /team shows "Create workspace" (no invite form — at member limit of 1)
- [ ] Pro plan user: can create workspace and invite up to 2 members (3 total slots)
- [ ] Team plan user: can invite up to 9 members (10 total slots)
- [ ] Hitting the member limit shows a clear upgrade prompt with link to /pricing
- [ ] Team weekly report is gated behind Team plan (Pro users see upgrade prompt)

### Create & manage workspace
- [ ] Any plan can create a workspace on /team
- [ ] Creating workspace shows it immediately without page reload
- [ ] Rename workspace updates name in header and activity feed
- [ ] Settings > Team Workspace card: shows workspace name + member count when workspace exists
- [ ] Settings > Team Workspace card: shows "Set up workspace" CTA when no workspace
- [ ] Dashboard: compact Team card appears when workspace exists (name, member count, activity snippet)

### Invites (secure token flow)
- [ ] Owner fills in email + role (Member/Admin) → clicks Invite
- [ ] Invite link is shown ONCE immediately below the form in a highlighted box with Copy button
- [ ] Invite link does NOT appear again after dismissal (raw token never stored or re-shown)
- [ ] Pending invite appears in the "Pending Invitations" section (no link, just email + role + expiry)
- [ ] "New link" button on a pending invite generates a new link (old invite is revoked)
- [ ] Revoke (trash icon) removes the invite from the pending list
- [ ] Invite email is sent if RESEND_API_KEY is configured (non-blocking — does not fail the invite if email fails)
- [ ] Duplicate invite for same email is rejected with a clear error message
- [ ] Inviting an existing member's email is rejected with a clear error

### /team/invite accept page
- [ ] Valid invite with ?token=xxx: shows workspace name, inviter name, email, role
- [ ] Logged-out user: shows "Log in to accept" and "Create account & accept" buttons
- [ ] Logged-in, email matches: shows "Accept Invitation" button
- [ ] Logged-in, email mismatch: shows warning and "Log in as [invite email]" button
- [ ] Clicking Accept: adds user to workspace, redirects to /team after 2s
- [ ] Expired token: shows "Invitation expired" state
- [ ] Revoked token: shows "Invitation revoked" state
- [ ] Invalid/unknown token: shows "Invalid invite link" state
- [ ] Already accepted token: shows "Already accepted" state

### Member management
- [ ] Owner sees role dropdown (Member/Admin) and remove button for each non-owner member
- [ ] Changing a member's role via dropdown updates it immediately
- [ ] Removing a member removes them from the list immediately
- [ ] Owner cannot remove themselves
- [ ] Owner's row shows "Owner" badge with no management controls

### Activity feed
- [ ] Activity feed shows actor name (not raw userId)
- [ ] Invite, accept, rename, remove events all appear in the feed
- [ ] Feed shows newest-first (max 20 entries displayed)

### Shared projects (regression)
- [ ] Add shared project still works
- [ ] Delete shared project still works

### Regression (must still pass after Phase 3)
- [ ] Stripe checkout and billing still work
- [ ] Google login still works end-to-end
- [ ] Password reset still works
- [ ] Email verification still works
- [ ] Persistent login still works across browser close/reopen
- [ ] Onboarding flow still works for new users
- [ ] All existing AI features (brain dump, focus, brief, analytics) still work

---

## Billing Lifecycle & Legal Trust (Phase 4)

### Backend billing sync
- [ ] `POST /api/billing/sync` requires auth and returns updated billing status
- [ ] Sync fetches the live Stripe subscription if `stripeSubscriptionId` exists
- [ ] Sync gracefully returns local billing state if Stripe is unreachable (no 500)
- [ ] `GET /api/billing/status` now returns `canManageBilling`, `trialEnd`, and `canceledAt`
- [ ] `canManageBilling` is `true` only when user has a `stripeCustomerId` and Stripe is configured
- [ ] Billing portal `return_url` is `/settings?billing=return` (not `/settings`)

### Settings — billing section
- [ ] `?billing=return` param shows "Billing updated. Your plan status is shown below." message
- [ ] "Sync Status" button appears for users with `canManageBilling=true`
- [ ] Clicking "Sync Status" refreshes billing data and shows confirmation message
- [ ] `subscriptionStatus: 'trialing'` displays as "Trial active" with trial end date
- [ ] `subscriptionStatus: 'past_due'` displays as "Payment due" with amber warning banner
- [ ] `subscriptionStatus: 'unpaid'` displays as "Unpaid" with warning banner
- [ ] `subscriptionStatus: 'canceled'` shows "Canceled on [date]" (canceledAt field)
- [ ] `cancelAtPeriodEnd` banner appears correctly (will not renew)
- [ ] "Manage Billing" button opens Stripe portal and lands back on `/settings?billing=return`
- [ ] "Manage Billing" button is hidden for free users with no Stripe customer ID

### Dashboard — billing alert
- [ ] `past_due` or `unpaid` subscription shows a red non-blocking alert at top of dashboard
- [ ] `cancelAtPeriodEnd` shows a yellow warning alert with the end date
- [ ] Alert has a "Manage billing" link to /settings
- [ ] Alert does NOT block the rest of the dashboard from loading
- [ ] Users with active subscriptions (no issues) see no alert

### Pricing page
- [ ] Stripe trust line is visible: "Payments are securely processed by Stripe. MindPad AI never stores your card details."
- [ ] Paid users with `canManageBilling=true` see a "Manage billing" button below the plan cards
- [ ] Non-paid users and logged-out visitors do NOT see the manage billing button
- [ ] ShieldCheck icon appears next to the trust line

### Legal pages
- [ ] `/privacy` loads with Privacy Policy content, correct dark theme
- [ ] `/terms` loads with Terms of Service content
- [ ] `/refund-policy` loads with Refund Policy content (14-day window clearly stated)
- [ ] `/ai-data-notice` loads with AI Data Notice content (what AI processes, offline fallback)
- [ ] All 4 legal pages have cross-links to each other in the footer
- [ ] All 4 legal pages have a "Back to home" link in the header
- [ ] No AppNav on legal pages (they are public, no auth required)

### Landing page footer
- [ ] Footer contains links to Privacy Policy, Terms of Service, Refund Policy, AI Data Notice
- [ ] All footer legal links navigate to correct pages
- [ ] Footer still shows Login and Sign up links

### Regression (must still pass after Phase 4)
- [ ] Stripe checkout and billing still work
- [ ] Google login still works end-to-end
- [ ] Team workspace (invite flow, member access, role gating) still works
- [ ] Password reset and email verification still work
- [ ] Persistent login still works across browser close/reopen
- [ ] Onboarding flow still works for new users
- [ ] All AI features (brain dump, focus, brief, analytics) still work

---

## Phase 5 AI Intelligence Upgrade

### New backend endpoints
- [ ] `POST /api/ai/next-best-action` requires auth and returns `NextBestActionResult`
- [ ] `POST /api/ai/priority-brief` requires auth and returns `PriorityBriefResult`
- [ ] `POST /api/ai/blocker-analysis` requires auth and returns `BlockerAnalysisResult`
- [ ] `/morning-brief`, `/ask`, `/focus-recommendation` now use server-side DB context (no longer trust client-sent workspaceContext)
- [ ] All 3 new endpoints return `mode: 'offline'` gracefully when AI is unavailable
- [ ] Error message shown to user is "MindPad could not generate this insight right now. Try again." — no Gemini/provider names shown

### Priority scoring (deterministic, pre-AI)
- [ ] Tasks with "urgent/asap/today/deadline/critical/fix/emergency/launch/ship" in title score higher
- [ ] Tasks with "blocked/stuck/waiting/depends/delayed/paused/blocking" in title score higher
- [ ] Tasks with "client/customer/revenue/production/demo/meeting/investor" in title score higher
- [ ] Tasks older than 14 days get +2 score; older than 7 days get +1 score
- [ ] Tasks mentioned in brain dump content get +1 per dump mention (max +3)
- [ ] `isStale` is true for tasks older than 14 days; `ageDays` is correct

### Dashboard — Priority Brief card
- [ ] "Priority Brief" card shows with "Get Priority Brief" button (not auto-loaded)
- [ ] Clicking "Get Priority Brief" fetches real DB context and shows top priority, secondary, quick win, reasoning, session suggestion
- [ ] "Refresh" button clears and reloads
- [ ] Card renders correctly with missing fields (secondaryPriority empty, quickWin empty)

### Dashboard — Next Best Action card
- [ ] "Next Best Action" card shows in right column with "What's next?" button
- [ ] Clicking generates a recommendation with task title, why, first step, focus time, confidence label
- [ ] Confidence label shows correct color (green=high, blue=medium, grey=low)
- [ ] "Start N-min session" link goes to /focus
- [ ] "Refresh" button clears result

### Analytics — Blocker Analysis card
- [ ] "Blocker Analysis" card shows on analytics page with "Analyze" button
- [ ] Clicking generates analysis from real DB context
- [ ] If no blockers: shows "No blockers detected" success state
- [ ] If blockers: each blocker shows name, evidence, impact, next action, suggested window
- [ ] "Refresh" button regenerates
- [ ] Error message: "MindPad could not generate this insight right now. Try again."

### Regression (must still pass after Phase 5)
- [ ] Stripe checkout and billing still work
- [ ] Google login still works end-to-end
- [ ] Team workspace (invite flow, member access, role gating) still works
- [ ] Password reset and email verification still work
- [ ] Persistent login still works across browser close/reopen
- [ ] Onboarding flow still works for new users
- [ ] All existing AI features (brain dump, morning brief, ask, focus recommendation, task cleanup, evening summary, weekly review, export) still work
- [ ] Legal pages still load and cross-link correctly

---

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
