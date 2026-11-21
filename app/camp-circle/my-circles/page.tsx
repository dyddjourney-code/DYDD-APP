import { CircleSetupPlanner } from "@/components/circle-setup-planner";
import { CirclePageHeader } from "@/components/circle-page-header";
import { isCircleSetupBeta } from "@/lib/circles/beta-policy";
import MyCirclesWorkspace from "@/components/my-circles-workspace";
import { BaseCampProfile } from "@/components/basecamp-profile";
import { isSandbox } from "@/lib/environment";
import { isNewReviewRequest, reviewQuery, type ReviewSearchParams } from "@/lib/review/heather";

export const dynamic = "force-dynamic";
export default async function MyCirclesPage({ searchParams }: { searchParams?: Promise<ReviewSearchParams> }) {
  const params = await searchParams;
  const profile = isSandbox() && isNewReviewRequest(params)
    ? <BaseCampProfile initialName="John" preview previewQuery={reviewQuery(params)} readOnly /> : null;
  if (isCircleSetupBeta()) return <main className="journey-shell hq-standalone-page camp-circle-page circle-beta-workspace"><CirclePageHeader title="My Circles">Create your Circle, plan your gatherings, and save draft people. This beta stops before invitations.</CirclePageHeader><CircleSetupPlanner /></main>;
  return <MyCirclesWorkspace profilePreview={profile} />;
}
