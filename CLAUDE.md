# CLAUDE.md — SMS Registry Module (PEN Global Technical Assessment)

Reference guide for building this assessment. Source specs live in the parent folder:
`../SMS_Technical_Assessment_.md` (the task) and `../jobRequirements.md` (the role).

## Goal

Build a **focused** web app covering the **Registry Module** of a Student Management System —
i.e. the **four workflows a Registry Administrator uses every day**. Not a full platform.

The evaluators care **more about how we think than how much we build**: deliberate product
decisions, proactive edge-case handling, and documented reasoning. Use AI freely but **own the output**.

## Hard Constraints (non-negotiable — auto-fail risk if broken)

- **Next.js 14+ App Router** — required. (Have 14.2.35.)
- **PostgreSQL + Prisma ORM** — required. **Commit `schema.prisma`.**
- **No other backend framework.** Use Next.js Route Handlers / Server Actions only. No Laravel/Express/etc.
- **No mocked data in `useState`.** All data must come from a **real database**.
- **`.env.example`** committed; **never commit real credentials / `.env`**.
- Styling: **Tailwind** or a component library — **Shadcn UI preferred**.
- Submit as a **GitHub repo with all code committed** — **no zip files**.

## Tech Stack (planned)

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| DB | PostgreSQL |
| ORM | Prisma |
| Styling | Tailwind + Shadcn UI (preferred) |
| Backend | Next.js Route Handlers / Server Actions (no separate backend) |
| File uploads | Local disk or DB-backed for PDF/DOCX submissions (decide in build phase) |

## Current Scaffold State

- Fresh Create Next App. `app/` is at **repo root** (no `src/`). TypeScript + Tailwind configured.
- Present: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `tailwind.config.ts`, `tsconfig.json`.
- **Not yet added:** Prisma, DB, Shadcn UI, seed script, `.env.example`, any features.

## The Four Workflows

### 1. Student Enrolment
- Create/manage student record: **full name, email, date of birth, programme, academic year, enrolment status**.
- **Auto-generate unique Student ID** — format `SMS-2025-0001` (year + zero-padded sequence).
- Enrolment statuses: **Enrolled · Deferred · Withdrawn · Completed**.
- **Search & filter** students by **name, ID, programme, or status**.

### 2. Fees & Payments
- Assign a **fee amount to each student based on their programme**.
- Record **payment transactions**: **amount, date, reference number**.
- Show **outstanding balance in real time** (fee − sum of payments).
- **Flag students with an overdue balance** on the **Registry dashboard**.

### 3. Assessment Submission
- **Staff creates an assessment**: **title, module, submission deadline**.
- Students **upload a file (PDF or DOCX)** against an **open** assessment.
- **One submission per student per assessment**; **allow resubmission before the deadline**.
- **Late submissions are accepted but visually flagged.**

### 4. Marksheet & Results
- Staff enter a **numeric grade (0–100)** per student per assessment.
- Classification bands: **Pass ≥ 40, Merit ≥ 60, Distinction ≥ 70** →
  `<40 Fail · 40–59 Pass · 60–69 Merit · 70–100 Distinction`.
- Staff can **publish or withhold results per student**.
- Students **see their marksheet only after it is published**.

## Edge Cases to Handle Proactively (30% of score — "feature intuition")

Handle these **without being told**, and make the behavior visible in the UI:
- **Overdue fees** → dashboard flag. Decide & document what "overdue" means (any outstanding
  balance, or outstanding past a due date). Pick a defensible product rule.
- **Late submissions** → accepted, but clearly flagged (badge/color + timestamp vs deadline).
- **Withheld results** → student view must **never** leak unpublished grades (enforce server-side, not just hidden in UI).
- **Resubmission** → allowed only **before deadline**; block after. Enforce one-per-student-per-assessment (unique constraint).
- **Grade band boundaries** → get the `≥` boundaries exactly right (40, 60, 70). Reject grades outside 0–100.
- **Unique Student ID** → no collisions under concurrent creates; correct year prefix + padding.
- **Real-time balance** → recompute from payments, don't store a stale total.

## Proposed Data Model (refine in schema phase)

- **Programme**: `id, name, feeAmount` (fee derives from programme).
- **Student**: `id, studentId (SMS-YYYY-NNNN), fullName, email (unique), dateOfBirth, programmeId, academicYear, enrolmentStatus`.
- **Payment**: `id, studentId, amount, paidAt, referenceNumber`.
- **Assessment**: `id, title, module, deadline, createdBy`.
- **Submission**: `id, assessmentId, studentId, fileName/filePath, submittedAt, isLate` — **unique(studentId, assessmentId)**.
- **Result**: `id, assessmentId, studentId, grade (0–100), published (bool)` — classification derived — **unique(studentId, assessmentId)**.

## Role Separation

- **Staff view** vs **Student view**. **Auth optional** — a **simple role toggle is acceptable**.
- Staff: manage students, fees, assessments, grades, publish/withhold.
- Student: see own record, balance, submit work, view **published** marksheet only.

## Deliverables / Submission Checklist

- [ ] GitHub repo, all code committed (no zip).
- [ ] `schema.prisma` committed.
- [ ] `.env.example` committed; no real credentials.
- [ ] **Seed script**: **≥ 5 students, 2 programmes, fees, and sample grades**.
- [ ] **README** covering: **how to run locally**, **`.env` variables**, and **how AI was used** during the build.
- [ ] Staff view + Student view (role toggle fine).

## Assessment Rubric (how it's scored)

| Dimension | Weight |
|---|---|
| **Stakeholder understanding** — data model + UI reflect how a Registry team actually works | **30%** |
| **Feature intuition** — handled edge cases (overdue fees, late submissions, withheld results) unprompted | **30%** |
| **Technical quality** — clean schema, working API routes, basic error handling | **25%** |
| **AI usage** — used AI effectively + articulated how in README | **15%** |

## Dev Commands

- `npm run dev` — start dev server
- `npm run build` / `npm run start` — production build/serve
- `npm run lint` — lint
- (after Prisma) `npx prisma migrate dev`, `npx prisma studio`, seed via `prisma db seed`

## Working Notes

- **Test our own work before declaring done** (role expectation + rubric). For UI, exercise the
  golden path and edge cases in the browser.
- Keep a running log of **where/how AI was used** for the README's AI section (15%).
- Time budget: **7 working days**. Favor deliberate, correct handling of the four workflows over breadth.
