"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_COOKIE, STUDENT_COOKIE } from "@/lib/session";

const COOKIE_OPTS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30,
};

/** Switch the session to the staff Registry console. */
export async function switchToStaff() {
  cookies().set(ROLE_COOKIE, "staff", COOKIE_OPTS);
  cookies().delete(STUDENT_COOKIE);
  redirect("/");
}

/** Switch the session to the student portal, impersonating one student. */
export async function switchToStudent(studentId: string) {
  if (!studentId) return;
  cookies().set(ROLE_COOKIE, "student", COOKIE_OPTS);
  cookies().set(STUDENT_COOKIE, studentId, COOKIE_OPTS);
  redirect("/portal");
}
