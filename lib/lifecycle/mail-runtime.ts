/** Fail closed before provider submission when a deployment copied encrypted API envelopes. */
export function lifecycleMailConfigurationError(from?:string, env:NodeJS.ProcessEnv=process.env):string|null {
 const key=env.RESEND_API_KEY??env.DYDD_RESEND_API_KEY??'';
 const sender=from??env.FRUITLIFE_EMAIL_FROM??env.DYDD_EMAIL_FROM??'reports@mail.discoverdivine.design';
 const address=sender.match(/<([^>]+)>/)?.[1]??sender.trim();
 if(!key.startsWith('re_')||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address))return 'Mail runtime configuration is invalid; delivery retained for retry. Verify decrypted provider key and verified sender in the deployment environment.';
 return null;
}
