export function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function canonicalizeParticipantEmail(email: string | null | undefined) {
  const normalized = normalizeEmail(email);
  const [localPart, domain] = normalized.split("@");

  if (!localPart || !domain) {
    return "";
  }

  if (domain === "gmail.com" || domain === "googlemail.com") {
    return `${localPart.split("+")[0].replaceAll(".", "")}@gmail.com`;
  }

  return normalized;
}

export function participantEmailCandidates(email: string | null | undefined) {
  return Array.from(
    new Set([normalizeEmail(email), canonicalizeParticipantEmail(email)].filter(Boolean)),
  );
}
