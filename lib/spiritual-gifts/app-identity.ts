import crypto from "node:crypto";
import { normalizeEmail } from "@/lib/identity/email";

type AppIdentityInput = {
  email?: string | null;
  name?: string | null;
};

type AppIdentityParams = AppIdentityInput & {
  signature?: string | null;
};

function identitySecret() {
  return process.env.DYDD_REVIEW_TOKEN ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

function identityPayload({ email, name }: AppIdentityInput) {
  return `${normalizeEmail(email)}\n${String(name ?? "").trim()}`;
}

export function signSpiritualGiftsAppIdentity(identity: AppIdentityInput) {
  const secret = identitySecret();

  if (!secret || !normalizeEmail(identity.email)) {
    return "";
  }

  return crypto.createHmac("sha256", secret).update(identityPayload(identity)).digest("base64url");
}

export function verifySpiritualGiftsAppIdentity({ email, name, signature }: AppIdentityParams) {
  const normalizedEmail = normalizeEmail(email);
  const displayName = String(name ?? "").trim();
  const expectedSignature = signSpiritualGiftsAppIdentity({
    email: normalizedEmail,
    name: displayName,
  });

  if (!normalizedEmail || !displayName || !signature || !expectedSignature) {
    return null;
  }

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  return {
    email: normalizedEmail,
    name: displayName,
    signature: expectedSignature,
  };
}

export function withSpiritualGiftsAppIdentity(path: string, identity: AppIdentityInput) {
  const normalizedEmail = normalizeEmail(identity.email);
  const displayName = String(identity.name ?? "").trim();
  const signature = signSpiritualGiftsAppIdentity({
    email: normalizedEmail,
    name: displayName,
  });

  if (!normalizedEmail || !displayName || !signature) {
    return path;
  }

  const url = new URL(path, "https://dydd.local");
  url.searchParams.set("app_name", displayName);
  url.searchParams.set("app_email", normalizedEmail);
  url.searchParams.set("app_sig", signature);

  return `${url.pathname}${url.search}`;
}
