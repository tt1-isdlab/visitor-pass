import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

export const VISITOR_TYPE_LABELS: Record<string, string> = {
  STUDENT: "Student",
  FACULTY: "Faculty",
  CONTENT_CREATOR: "Content Creator",
  INDUSTRY_PROFESSIONAL: "Industry Professional",
  MEDIA: "Media",
  GUEST: "Guest",
  OTHER: "Other",
};

export const STATUS_LABELS: Record<string, string> = {
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CHECKED_IN: "Checked In",
};

export const PAYMENT_LINK_URL =
  process.env.NEXT_PUBLIC_PAYMENT_LINK_URL ?? "https://rzp.io/rzp/rfvisitingpass";
