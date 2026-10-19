export function isSandbox() {
  return process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT === 'sandbox';
}
export function schoolFeatures() {
  return {
    profiles: true,
    circleConversations: isSandbox() && process.env.DYDD_FEATURE_CIRCLE_CONVERSATIONS === 'true',
    journeyDiscussionPins: isSandbox() && process.env.DYDD_FEATURE_DISCUSSION_PINS === 'true',
  };
}
