# MindPad AI

MindPad AI is a full-stack productivity SaaS MVP for turning scattered thoughts, tasks, notes, and focus sessions into clear execution workflows.

The product combines AI-powered brain dumping, task extraction, focus planning, analytics, saved execution plans, team workspaces, Google login, MongoDB persistence, and Stripe subscription billing into one polished SaaS-style application.

## Live 

https://mindpad-ai-five.vercel.app/

## Overview

MindPad AI is built around a simple execution problem:

> Most productivity tools help users store work. MindPad AI helps users turn messy input into clear next actions.

Users can write freely, extract structured tasks with AI, organize priorities, run focus sessions, review productivity insights, save execution plans, and upgrade into Pro or Team plans for deeper analytics and collaboration.

This project was built as a production-style portfolio application with real authentication, persistent database storage, third-party OAuth, subscription billing, webhook-based plan synchronization, and server-side paid feature gates.

## Product Highlights

- Full-stack SaaS architecture
- Email/password authentication
- Google OAuth login
- Existing account linking by email
- MongoDB Atlas persistence
- AI-powered brain dump workflow
- Task management with plan-based limits
- Focus timer and AI recommendations
- Analytics and productivity reports
- Saved execution plans
- Stripe Checkout subscriptions
- Stripe webhook billing sync
- Billing portal access
- Free, Pro, and Team pricing tiers
- Team workspace with members, shared projects, and activity feed
- Manual QA checklist and production build verification

## Core Features

### Authentication

- Email and password registration
- Email and password login
- Google OAuth login
- Google account linking by existing email
- JWT-based authenticated sessions
- User profile, avatar, name, provider, plan, and billing status persisted in MongoDB

### AI Brain Dump

- Free-form thought capture
- AI extraction of actionable tasks
- Saved notes
- Daily extraction usage tracking
- Plan-based extraction limits
- Persistent brain dump history

### Task Management

- Create, update, complete, and delete tasks
- Priority-based organization
- Active and completed task filtering
- Plan-based active task limits
- Persistent task storage in MongoDB
- AI-supported task prioritization

### Focus Workflow

- Focus timer interface
- AI task recommendation
- Suggested focus duration
- Task selection for focus sessions
- Saved execution plans for paid users
- Focus history foundation

### Analytics

- Productivity overview
- Execution score
- Focus consistency
- Productivity index
- Weekly AI review for paid users
- Exportable productivity summary
- Team analytics access for Team users

### Billing and Subscription Plans

- Free, Pro, and Team pricing tiers
- Stripe Checkout integration
- Stripe webhook subscription synchronization
- Billing portal access
- Current plan detection
- Subscription status tracking
- Server-side feature and usage enforcement

### Team Workspace

- Team workspace creation
- Member invite management
- Shared projects
- Activity feed
- Team weekly execution report
- Admin/team collaboration surface
- Team plan gating

### Paid Feature Gates

MindPad AI includes plan-based product behavior instead of only static pricing cards.

Paid features unlock different workflows after purchase, including higher task limits, more AI extractions, advanced analytics, saved execution plans, export summaries, and team collaboration features.

## Pricing Tiers

### Free

Designed for individual users testing the core workflow.

- 10 active tasks
- 3 brain dump extractions per day
- 7-day focus history
- Basic analytics
- Core AI planning

### Pro — $9/month

Designed for individuals who want deeper execution planning.

- 100 active tasks
- 50 brain dump extractions per day
- 90-day focus history
- Advanced analytics
- Weekly AI review
- Export productivity summary
- Saved execution plans
- Priority insights
- Advanced AI planning

### Team — $29/month

Designed for small teams working around shared execution.

- 500 active tasks
- 200 brain dump extractions per day
- 365-day focus history
- All Pro features
- Team workspace
- Up to 10 team members
- Shared projects
- Activity feed
- Team weekly AI report
- Admin controls
- Team analytics dashboard

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- JWT authentication

### Services and Integrations

- MongoDB Atlas
- Stripe Checkout
- Stripe Webhooks
- Stripe Billing Portal
- Google OAuth
- Gemini API

## Architecture

MindPad AI is structured as a monorepo with separate frontend and backend applications.

```txt
mindpad-ai/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── server.ts
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── lib/
│       │   ├── services/
│       │   └── types/
│       └── package.json
│
├── docs/
│   └── QA_CHECKLIST.md
│
├── package.json
└── README.md
```

## Environment Variables

Create a local environment file inside `apps/api/.env` using `apps/api/.env.example` as a reference.

```env
PORT=4000
CLIENT_URL=http://localhost:3000

MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/mindpad-ai?retryWrites=true&w=majority&appName=mindpad-ai
JWT_SECRET=replace_with_a_secure_random_secret

GEMINI_API_KEY=your_gemini_api_key

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PRICE_PRO_MONTHLY=your_pro_monthly_price_id
STRIPE_PRICE_TEAM_MONTHLY=your_team_monthly_price_id
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_signing_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback
```

Environment files containing real secrets are intentionally ignored by Git.

## Running Locally

Install dependencies from the project root:

```bash
npm install
```

Run the backend API:

```bash
cd apps/api
npm run dev
```

Run the frontend app in a separate terminal:

```bash
cd apps/web
npm run dev
```

Frontend:

```txt
http://localhost:3000
```

Backend:

```txt
http://localhost:4000/api
```

## Stripe Webhook Testing

For local Stripe webhook testing, use the Stripe CLI and forward events to the backend webhook route.

```bash
stripe listen --forward-to localhost:4000/api/stripe/webhook
```

Copy the generated webhook signing secret into:

```env
STRIPE_WEBHOOK_SECRET=your_webhook_signing_secret
```

Then restart the backend server.

## Google OAuth Setup

For local Google login, configure a Google OAuth client with the following redirect URI:

```txt
http://localhost:4000/api/auth/google/callback
```

Then add the client ID and client secret to `apps/api/.env`.

Google login is designed to link into an existing user record by email, preserving plan, billing, tasks, notes, execution plans, and team workspace data.

## QA Checklist

A manual QA checklist is included in:

```txt
docs/QA_CHECKLIST.md
```

Verified flows include:

- Email/password registration
- Email/password login
- Google login
- Existing account linking by email
- MongoDB user persistence
- No duplicate user creation after Google login
- Task creation and persistence
- Brain dump note saving
- AI task extraction
- Daily extraction limits
- Stripe Checkout
- Stripe webhook plan synchronization
- Billing portal access
- Free, Pro, and Team feature gates
- Team workspace creation
- Team member invite flow
- Shared project creation
- Activity feed updates
- Analytics generation
- Saved execution plans
- Refresh behavior across core routes
- Sign out and sign back in behavior

## Build Verification

Backend TypeScript check:

```bash
cd apps/api
npx tsc --noEmit
```

Frontend TypeScript check:

```bash
cd apps/web
npx tsc --noEmit
```

Frontend production build:

```bash
cd apps/web
npm run build
```

The latest verified build completed successfully with all core pages compiling.

## Key Product Screens

Core application routes include:

```txt
/login
/register
/dashboard
/brain-dump
/tasks
/focus
/analytics
/team
/settings
/pricing
```

## Portfolio Focus

MindPad AI demonstrates the ability to build and ship a serious full-stack SaaS product with real-world product architecture.

The project highlights:

- Product-focused frontend development
- Full-stack TypeScript architecture
- Authentication and session handling
- OAuth integration
- Database modeling with MongoDB and Mongoose
- AI workflow integration
- Stripe subscription billing
- Webhook-driven plan synchronization
- Paid feature gating
- Team collaboration features
- QA-oriented development
- Production deployment preparation

## Status

MindPad AI is a portfolio-ready full-stack SaaS MVP.

The project is ready for GitHub presentation and deployment, with environment variables handled securely outside of source control.
