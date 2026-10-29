import "server-only";
/** This mode is deployed only to the pinned, ALL-deployment Vercel-auth project.
 * No client query/header/cookie or public preview token can enable it. */
export function isPrivateOwnerConsole() {
  return process.env.DYDD_PRIVATE_OWNER_MODE === "true" &&
    process.env.VERCEL_PROJECT_ID === "prj_Aw8o5xjiMpVY9NaGvFBsamRIM4Aq" &&
    process.env.VERCEL_ENV === "production";
}
