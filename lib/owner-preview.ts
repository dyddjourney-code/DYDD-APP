import { isSandbox } from "@/lib/environment";
export type OwnerPreviewParams = {
  key?: string | null;
  review?: string | null;
};

export function isOwnerPreviewRequest(params?: OwnerPreviewParams | null) {
  return (
    isSandbox() && params?.review === "owner" &&
    Boolean(params.key) &&
    Boolean(process.env.DYDD_REVIEW_TOKEN) &&
    params.key === process.env.DYDD_REVIEW_TOKEN
  );
}
