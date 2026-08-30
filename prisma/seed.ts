import { PrismaClient, EnrolmentStatus, type Programme } from "@prisma/client";

import { buildFeeSchedule } from "../lib/services/fee-schedule";
import { formatStudentId } from "../lib/domain/studentId";

const prisma = new PrismaClient();

// Due dates are anchored to *now* so the overdue / upcoming / credit scenarios
// hold whenever the seed is run, not just on one calendar date. Overdue itself
// is always derived at read time against the real clock — never stored.
const now = new Date();
const refYear = now.getUTCFullYear();

/** First day of the month `n` months from this month, in UTC. */
function monthsFromNow(n: number): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + n, 1));
}

/** UTC midnight for a fixed calendar date (month is 1-indexed for readability). */
function utc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

let refCounter = 0;
function nextRef(): string {
  refCounter += 1;
  return `BANK-${refYear}-${String(refCounter).padStart(4, "0")}`;
}

type SeedPayment = { sequence: number; amount: number; paidAt: Date };
type SeedStudent = {
  studentId: string;
  fullName: string;
  email: string;
  dateOfBirth: Date;
  academicYear: string;
  enrolmentStatus: EnrolmentStatus;
  programme: Programme;
  firstDueDate: Date;
  payments: SeedPayment[];
};

// Mirrors enrolStudent: snapshot the programme fee into per-semester
// installments, then post payments against specific installments.
async function enrol(s: SeedStudent) {
  const schedule = buildFeeSchedule({
    totalFee: Number(s.programme.feeAmount),
    semesters: s.programme.durationSemesters,
    firstDueDate: s.firstDueDate,
  });

  const student = await prisma.student.create({
    data: {
      studentId: s.studentId,
      fullName: s.fullName,
      email: s.email,
      dateOfBirth: s.dateOfBirth,
      programmeId: s.programme.id,
      academicYear: s.academicYear,
      enrolmentStatus: s.enrolmentStatus,
      feeAmount: s.programme.feeAmount,
      installments: {
        create: schedule.map((i) => ({
          sequence: i.sequence,
          amount: i.amount,
          dueDate: i.dueDate,
        })),
      },
    },
    include: { installments: { orderBy: { sequence: "asc" } } },
  });

  for (const p of s.payments) {
    const inst = student.installments.find((i) => i.sequence === p.sequence);
    if (!inst) {
      throw new Error(`No installment ${p.sequence} for ${s.fullName}`);
    }
    await prisma.payment.create({
      data: {
        studentId: student.id,
        installmentId: inst.id,
        amount: p.amount,
        paidAt: p.paidAt,
        referenceNumber: nextRef(),
      },
    });
  }

  return student;
}

async function main() {
  // Idempotent: clear in FK-safe order so `prisma db seed` can run repeatedly.
  await prisma.payment.deleteMany();
  await prisma.result.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.feeInstallment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.programme.deleteMany();
  await prisma.studentSequence.deleteMany();

  const bscCs = await prisma.programme.create({
    data: {
      code: "BSC-CS",
      name: "BSc Computer Science",
      feeAmount: 27750,
      durationSemesters: 6,
    },
  });
  const mscDs = await prisma.programme.create({
    data: {
      code: "MSC-DS",
      name: "MSc Data Science",
      feeAmount: 12000,
      durationSemesters: 3,
    },
  });

  const bscSemester = 4625; // 27,750 / 6
  const mscSemester = 4000; // 12,000 / 3

  // 1. Fully paid, completed — a settled historical account. Every semester is
  //    in the past and paid in full, so nothing outstanding, nothing overdue.
  const ada = await enrol({
    studentId: formatStudentId(2024, 1),
    fullName: "Ada Lovelace",
    email: "ada.lovelace@example.ac.uk",
    dateOfBirth: utc(2003, 12, 10),
    academicYear: "2024/25",
    enrolmentStatus: EnrolmentStatus.COMPLETED,
    programme: bscCs,
    firstDueDate: monthsFromNow(-22),
    payments: [1, 2, 3, 4, 5, 6].map((sequence) => ({
      sequence,
      amount: bscSemester,
      paidAt: monthsFromNow(-22 + (sequence - 1) * 4),
    })),
  });

  // 2. Overdue — paid the first semester then fell behind. Two past-due
  //    semesters remain unpaid, so this student is flagged on the dashboard.
  const alan = await enrol({
    studentId: formatStudentId(2025, 1),
    fullName: "Alan Turing",
    email: "alan.turing@example.ac.uk",
    dateOfBirth: utc(2004, 6, 23),
    academicYear: "2025/26",
    enrolmentStatus: EnrolmentStatus.ENROLLED,
    programme: bscCs,
    firstDueDate: monthsFromNow(-10),
    payments: [{ sequence: 1, amount: bscSemester, paidAt: monthsFromNow(-10) }],
  });

  // 3. Overdue with nothing paid — deferred, but the fee still stands. Three
  //    past-due semesters; a second entry on the dashboard's attention list.
  const dorothy = await enrol({
    studentId: formatStudentId(2025, 2),
    fullName: "Dorothy Vaughan",
    email: "dorothy.vaughan@example.ac.uk",
    dateOfBirth: utc(2003, 9, 20),
    academicYear: "2025/26",
    enrolmentStatus: EnrolmentStatus.DEFERRED,
    programme: bscCs,
    firstDueDate: monthsFromNow(-10),
    payments: [],
  });

  // 4. Partially paid but current — the only past-due semester is settled; the
  //    rest fall due later, so there's a balance but no overdue flag.
  const grace = await enrol({
    studentId: formatStudentId(2026, 1),
    fullName: "Grace Hopper",
    email: "grace.hopper@example.ac.uk",
    dateOfBirth: utc(2002, 12, 9),
    academicYear: "2026/27",
    enrolmentStatus: EnrolmentStatus.ENROLLED,
    programme: mscDs,
    firstDueDate: monthsFromNow(-2),
    payments: [{ sequence: 1, amount: mscSemester, paidAt: monthsFromNow(-2) }],
  });

  // 5. In credit — overpaid the first (not-yet-due) semester, leaving that
  //    semester in credit. Nets the total down but flags nothing overdue.
  const katherine = await enrol({
    studentId: formatStudentId(2026, 2),
    fullName: "Katherine Johnson",
    email: "katherine.johnson@example.ac.uk",
    dateOfBirth: utc(2003, 8, 26),
    academicYear: "2026/27",
    enrolmentStatus: EnrolmentStatus.ENROLLED,
    programme: mscDs,
    firstDueDate: monthsFromNow(2),
    payments: [{ sequence: 1, amount: mscSemester + 500, paidAt: now }],
  });

  // 6. Newly enrolled, nothing paid — every semester is still in the future, so
  //    the student is *not* flagged overdue despite carrying the full balance.
  const margaret = await enrol({
    studentId: formatStudentId(2026, 3),
    fullName: "Margaret Hamilton",
    email: "margaret.hamilton@example.ac.uk",
    dateOfBirth: utc(2004, 8, 17),
    academicYear: "2026/27",
    enrolmentStatus: EnrolmentStatus.ENROLLED,
    programme: bscCs,
    firstDueDate: monthsFromNow(3),
    payments: [],
  });

  // Continue the per-year Student ID counter so the next real enrolment gets
  // the correct next number rather than colliding with a seeded one.
  await prisma.studentSequence.createMany({
    data: [
      { year: 2024, lastSeq: 1 },
      { year: 2025, lastSeq: 2 },
      { year: 2026, lastSeq: 3 },
    ],
  });

  // Assessments are programme-scoped: each belongs to one programme, and only
  // students on that programme can see or submit to it. A mix of past-deadline
  // (closed) and future (open) assessments per programme exercises the open/late
  // states in the UI.
  const registrar = "Registry Office";

  const csCoursework = await prisma.assessment.create({
    data: {
      title: "Coursework 1 — Data Structures",
      module: "CS201",
      programmeId: bscCs.id,
      deadline: monthsFromNow(-2),
      createdBy: registrar,
    },
  });
  await prisma.assessment.create({
    data: {
      title: "Coursework 2 — Algorithms",
      module: "CS305",
      programmeId: bscCs.id,
      deadline: monthsFromNow(1),
      createdBy: registrar,
    },
  });

  const dsProposal = await prisma.assessment.create({
    data: {
      title: "Project Proposal",
      module: "DS500",
      programmeId: mscDs.id,
      deadline: monthsFromNow(-1),
      createdBy: registrar,
    },
  });
  await prisma.assessment.create({
    data: {
      title: "Data Ethics Essay",
      module: "DS520",
      programmeId: mscDs.id,
      deadline: monthsFromNow(2),
      createdBy: registrar,
    },
  });

  // Sample grades on the closed assessments only — spanning every classification
  // boundary (39 Fail, 40 Pass, 60 Merit, 70 Distinction) with a mix of published
  // and withheld results, so the marksheet and the student-facing confidentiality
  // rule are both demonstrable. Every grade is for a student on the assessment's
  // own programme.
  await prisma.result.createMany({
    data: [
      { assessmentId: csCoursework.id, studentId: ada.id, grade: 70, published: true, publishedAt: now, gradedBy: registrar },
      { assessmentId: csCoursework.id, studentId: alan.id, grade: 60, published: true, publishedAt: now, gradedBy: registrar },
      { assessmentId: csCoursework.id, studentId: dorothy.id, grade: 39, published: true, publishedAt: now, gradedBy: registrar },
      { assessmentId: csCoursework.id, studentId: margaret.id, grade: 40, published: false, gradedBy: registrar },
      { assessmentId: dsProposal.id, studentId: grace.id, grade: 68, published: true, publishedAt: now, gradedBy: registrar },
      { assessmentId: dsProposal.id, studentId: katherine.id, grade: 55, published: false, gradedBy: registrar },
    ],
  });

  const [students, programmes, installments, payments, assessments, results] =
    await Promise.all([
      prisma.student.count(),
      prisma.programme.count(),
      prisma.feeInstallment.count(),
      prisma.payment.count(),
      prisma.assessment.count(),
      prisma.result.count(),
    ]);
  console.log(
    `Seeded ${programmes} programmes, ${students} students, ` +
      `${installments} installments, ${payments} payments, ` +
      `${assessments} assessments, ${results} results.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
