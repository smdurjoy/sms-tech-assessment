import { z } from "zod";

export const ACADEMIC_YEAR_RE = /^\d{4}\/\d{2}$/;

export const ENROLMENT_STATUS_OPTIONS = [
  { value: "ENROLLED", label: "Enrolled" },
  { value: "DEFERRED", label: "Deferred" },
  { value: "WITHDRAWN", label: "Withdrawn" },
  { value: "COMPLETED", label: "Completed" },
] as const;

const ENROLMENT_STATUS_VALUES = [
  "ENROLLED",
  "DEFERRED",
  "WITHDRAWN",
  "COMPLETED",
] as const;

const MAX_AGE_MS = 120 * 365.25 * 24 * 60 * 60 * 1000;

const dateOfBirth = z.coerce
  .date({ error: "Enter a valid date of birth" })
  .refine((d) => d.getTime() < Date.now(), "Date of birth must be in the past")
  .refine(
    (d) => d.getTime() > Date.now() - MAX_AGE_MS,
    "Date of birth looks too far in the past"
  );

export const enrolStudentSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter the student's full name")
    .max(120, "Name must be at most 120 characters"),
  email: z.email("Enter a valid email address"),
  dateOfBirth,
  programmeId: z.string().min(1, "Select a programme"),
  academicYear: z
    .string()
    .trim()
    .regex(ACADEMIC_YEAR_RE, "Use the format 2025/26"),
  enrolmentStatus: z.enum(ENROLMENT_STATUS_VALUES),
  feeDueDate: z.coerce.date({ error: "Enter a fee due date" }),
});

export const updateStudentSchema = enrolStudentSchema.pick({
  fullName: true,
  email: true,
  academicYear: true,
  enrolmentStatus: true,
  feeDueDate: true,
});

export type EnrolStudentInput = z.infer<typeof enrolStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
