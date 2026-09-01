# SMS Registry Module — Technical Assessment

A high-performance, domain-focused web application covering the four daily core workflows of a University Registry Administrator, built for **PEN Global (PEN Group)**.

Built with **Next.js 14 (App Router)**, **PostgreSQL**, **Prisma ORM**, and **Tailwind CSS / Shadcn UI**.

---

## 🌟 Overview & Product Architecture

This application is designed specifically around how a **Registry Office** operates in higher education. Rather than a generic CRUD system, it models domain-specific workflows, financial ledger integrity, academic progression, and confidentiality boundaries.

### Role Separation

- **Staff View (`/` - Registry Portal)**: Full administrative access to manage student enrolments, programme fees, fee payments, assessment creation, grade entry, and results publication.
- **Student View (`/portal` - Student Self-Service)**: Tailored student portal allowing students to view their balance & breakdown, submit assignments (PDF/DOCX), and view their **published marksheet only**.

_(A role switcher header component allows seamless toggling between Staff and Student views without complex login overhead)._

---

## ⚙️ Environment Variables

The project uses `.env` for local database configuration. An example template is provided in `.env.example`.

```env
# Postgres (Docker Compose)
POSTGRES_USER=sms
POSTGRES_PASSWORD=change-me
POSTGRES_DB=sms

# Prisma / App Connection (Local Docker Postgres on port 5434)
DATABASE_URL="postgresql://sms:change-me@localhost:5434/sms?schema=public"
```

---

## 🛠️ How to Run Locally

### Prerequisites

- **Node.js**: v18+ or v20+
- **Docker & Docker Compose** (or a running local PostgreSQL instance)
- **npm** / **pnpm** / **yarn**

### 1. Clone the repository & Install Dependencies

```bash
git clone https://github.com/smdurjoy/sms-tech-assessment.git
cd sms-tech-assessment
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 3. Start PostgreSQL with Docker

```bash
docker compose up -d
```

_(Runs Postgres on port `5434` as configured in `docker-compose.yml` and `DATABASE_URL`)._

### 4. Run Prisma Database Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Seed the Database

Seed the database with realistic demo data (6 students across 2 programmes, installment schedules, payments, overdue scenarios, assessments, submissions, and sample graded results):

```bash
npx prisma db seed
```

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤖 AI Usage & Engineering Ownership

In alignment with PEN Global’s engineering standards, AI (Claude) was leveraged as an **engineering capability and velocity multiplier** rather than a code-generation shortcut.

### How AI Was Used:

- First I generated CLAUDE.md file based on the requirements for giving context to AI and best results.
- Then I use AI to setup and configure the project.
- After that I verify and run the project to ensure project setup is done correctly.
- Then for each feature I have given the commands to AI and verify each feature, found quite a few issues, fixed them, run verify and finally pushed for each feature.
- Along with the code generation there were few decisions I had to make regarding the feature, I instructed AI accordingly and ensure the flow works as I planed.

### Ownership & Code Quality Guarantee:

- All generated code was line-by-line reviewed, refactored, and tested for TypeScript type safety.
- Business rules (grade classifications, overdue balance formulas, file upload type validation, server action error handling) were authored and verified explicitly to ensure 100% adherence to requirement specs.

---
