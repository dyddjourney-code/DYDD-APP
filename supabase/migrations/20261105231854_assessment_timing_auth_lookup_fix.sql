-- Narrow existing verified-Auth helper avoids granting service_role broad auth.users reads.
begin;
do $patch$ declare original text; begin
 select pg_get_functiondef('public.dydd_assessment_eligibility(uuid,text,boolean,timestamptz)'::regprocedure) into original;
 if position('select email into account_email from auth.users where id=p_user_id;' in original)=0 then raise exception 'Unexpected eligibility function baseline';end if;
 execute replace(replace(original,'select email into account_email from auth.users where id=p_user_id;','account_email:=dydd_private.retake_verified_email(p_user_id);'),'completed+make_interval(days=>days)','completed+(days * interval ''24 hours'')');
end $patch$;
commit;
