type SendEmailInput = {
  html: string;
  subject: string;
  text: string;
  to: string;
};

type SendEmailResult = {
  id?: string;
  message?: string;
  sent: boolean;
  skipped: boolean;
};

function getResendConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY ?? process.env.DYDD_RESEND_API_KEY ?? "",
    from:
      process.env.FRUITLIFE_EMAIL_FROM ??
      process.env.DYDD_EMAIL_FROM ??
      "FruitLife 360 <fruitlife@discoverdivine.design>",
  };
}

export async function sendResendEmail({
  html,
  subject,
  text,
  to,
}: SendEmailInput): Promise<SendEmailResult> {
  const { apiKey, from } = getResendConfig();

  if (!apiKey) {
    return {
      message: "RESEND_API_KEY or DYDD_RESEND_API_KEY is not configured.",
      sent: false,
      skipped: true,
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from,
      html,
      subject,
      text,
      to,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
    id?: string;
    message?: string;
  };

  if (!response.ok) {
    return {
      message:
        payload.error?.message ??
        payload.message ??
        `Resend returned HTTP ${response.status}.`,
      sent: false,
      skipped: false,
    };
  }

  return {
    id: payload.id,
    sent: true,
    skipped: false,
  };
}
