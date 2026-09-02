type CreatePdfMonkeyDocumentInput = {
  filename: string;
  payload: Record<string, unknown>;
  templateId: string;
};

type PdfMonkeyDocument = {
  checksum?: string | null;
  download_url?: string | null;
  failure_cause?: string | null;
  filename?: string | null;
  id: string;
  preview_url?: string | null;
  public_share_link?: string | null;
  status?: string | null;
};

function getPdfMonkeyApiKey() {
  return process.env.PDFMONKEY_API_KEY ?? "";
}

async function pdfMonkeyRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = getPdfMonkeyApiKey();

  if (!apiKey) {
    throw new Error("PDFMONKEY_API_KEY is not configured.");
  }

  const response = await fetch(`https://api.pdfmonkey.io/api/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => ({}))) as {
    document?: PdfMonkeyDocument;
    error?: string;
    errors?: unknown;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      body.error ??
        body.message ??
        (body.errors ? JSON.stringify(body.errors) : `PDFMonkey returned HTTP ${response.status}.`),
    );
  }

  return body as T;
}

export async function createPdfMonkeyDocument({
  filename,
  payload,
  templateId,
}: CreatePdfMonkeyDocumentInput) {
  const body = await pdfMonkeyRequest<{ document: PdfMonkeyDocument }>("/documents", {
    body: JSON.stringify({
      document: {
        document_template_id: templateId,
        meta: { _filename: filename },
        payload,
        status: "pending",
      },
    }),
    method: "POST",
  });

  return body.document;
}

export async function getPdfMonkeyDocument(documentId: string) {
  const body = await pdfMonkeyRequest<{ document: PdfMonkeyDocument }>(`/documents/${documentId}`);

  return body.document;
}

export type { PdfMonkeyDocument };
