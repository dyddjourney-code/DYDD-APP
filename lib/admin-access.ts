import { canonicalizeParticipantEmail } from "@/lib/identity/email";

const defaultAdminEmails = [
  "dyddjourney@gmail.com",
  "john@discoverdivine.design",
  "willoughbyhs@gmail.com",
];

export function getDyddAdminEmails() {
  return new Set(
    [
      ...defaultAdminEmails,
      ...(process.env.DYDD_ADMIN_EMAILS ?? "").split(","),
    ]
      .map((value) => canonicalizeParticipantEmail(value))
      .filter(Boolean),
  );
}

export function isDyddAdminEmail(email: string | null | undefined) {
  return getDyddAdminEmails().has(canonicalizeParticipantEmail(email));
}
