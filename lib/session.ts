import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Role = "staff" | "student";

export const ROLE_COOKIE = "sms_role";
export const STUDENT_COOKIE = "sms_student_id";

/** Current role from the cookie. Defaults to staff (the Registry console). */
export function getRole(): Role {
  return cookies().get(ROLE_COOKIE)?.value === "student" ? "student" : "staff";
}

export function getCurrentStudentId(): string | null {
  return cookies().get(STUDENT_COOKIE)?.value ?? null;
}

/** Guard for staff-only pages/actions — bounces students to their portal. */
export function requireStaff(): void {
  if (getRole() !== "staff") redirect("/portal");
}

/**
 * Guard for student-only pages/actions. Returns the impersonated student id,
 * or redirects staff (and student sessions with no selected student) away.
 */
export function requireStudentId(): string {
  if (getRole() !== "student") redirect("/");
  const id = getCurrentStudentId();
  if (!id) redirect("/");
  return id;
}
