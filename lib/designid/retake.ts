import { getAssessmentEligibility } from '../assessment-timing/policy';
export { addSixCalendarMonths } from './retake-policy';
export async function getDesignIdEligibility(userId: string, email: string, owner = false) {
  return getAssessmentEligibility(userId, email, 'designid', owner);
}
