import MyCirclesWorkspace from "@/components/my-circles-workspace";
import { BaseCampProfile } from "@/components/basecamp-profile";
import { isSandbox } from "@/lib/environment";
import { isNewReviewRequest, reviewQuery, type ReviewSearchParams } from "@/lib/review/heather";

export const dynamic = "force-dynamic";
export default async function MyCirclesPage({ searchParams }: { searchParams?: Promise<ReviewSearchParams> }) {
  const params = await searchParams;
  const profile = isSandbox() && isNewReviewRequest(params)
    ? <BaseCampProfile initialName="John" preview previewQuery={reviewQuery(params)} readOnly /> : null;
  return <MyCirclesWorkspace profilePreview={profile} />;
}
