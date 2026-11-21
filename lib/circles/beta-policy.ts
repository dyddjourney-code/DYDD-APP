/** Limited planning pilot; unrelated to lifetime PERSONAL or paid Leadership. */
export const CIRCLE_BETA_END = "2027-03-01T00:00:00.000Z";
export const CIRCLE_BETA_NOTICE = "Circle setup beta: save your plan and draft people. Invitations, admission links, payments, messages and shared assessment results are not enabled.";
export function isCircleSetupBeta() {
  return process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT !== "sandbox";
}
export function circleBetaOpen(now = Date.now()) {
  return now < Date.parse(CIRCLE_BETA_END);
}
export function circleBetaBlockedPath(path: string) {
  if (!isCircleSetupBeta()) return false;
  // Allow only planning and its PDF. Deny current AND future operational paths.
  if (path.startsWith("/api/circles/")) return !["/api/circles/export", "/api/circles/field-guide"].includes(path.replace(/\/$/, ""));
  return /^\/api\/(?:commerce|stripe)\/.*(?:circle|couple|leadership|enroll|admission)/i.test(path);
}
