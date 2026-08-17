import { z } from "zod";

export const VISITOR_TYPES = [
  "STUDENT",
  "FACULTY",
  "CONTENT_CREATOR",
  "INDUSTRY_PROFESSIONAL",
  "MEDIA",
  "GUEST",
  "OTHER",
] as const;

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const ALLOWED_FILE_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

const indianPhoneRegex = /^[6-9]\d{9}$/;

// Fields shared by the multi-step form (file handled separately since it's a File object).
export const registrationFieldsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(120, "Full name is too long"),
  phone: z
    .string()
    .trim()
    .regex(indianPhoneRegex, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().trim().email("Enter a valid email address").max(255),
  collegeName: z
    .string()
    .trim()
    .min(2, "College / organization name is required")
    .max(200),
  visitorType: z.enum(VISITOR_TYPES, {
    message: "Select a visitor type",
  }),
  purposeOfVisit: z
    .string()
    .trim()
    .min(10, "Please describe the purpose of your visit (min 10 characters)")
    .max(1000),
  numberOfVisitors: z.coerce
    .number()
    .int()
    .min(1, "At least 1 visitor is required")
    .max(20, "For groups larger than 20, please contact the organizers directly"),
  consent: z.literal(true, {
    message: "You must confirm the information is accurate and agree to the guidelines",
  }),
});

export type RegistrationFields = z.output<typeof registrationFieldsSchema>;
export type RegistrationFieldsInput = z.input<typeof registrationFieldsSchema>;

export function validateAuthorizationLetter(file: File | null | undefined) {
  if (!file || file.size === 0) {
    return { valid: false as const, error: "Authorization letter is required" };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false as const, error: "File must be smaller than 5 MB" };
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false as const, error: "Only PDF, JPG, and PNG files are allowed" };
  }
  return { valid: true as const };
}

export const visitorStatusLookupSchema = z.object({
  registrationId: z.string().trim().min(1, "Registration ID is required"),
  email: z.string().trim().email("Enter a valid email address"),
});
