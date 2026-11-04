-- Cohorts may signal only approved prompt keys; free writing cannot hide inside topic fields.
begin;
create table public.dydd_circle_prompt_catalog(prompt text primary key,lesson text not null,label text not null);
alter table public.dydd_circle_prompt_catalog enable row level security;
revoke all on public.dydd_circle_prompt_catalog from public,anon,authenticated;
grant select on public.dydd_circle_prompt_catalog to service_role;
insert into public.dydd_circle_prompt_catalog(prompt,lesson,label) values
('child-of-god-response','identity-who-vs-whose-16','When you hear ''You are a child of God,'' how does your heart respond?'),
('old-label-truth','identity-who-vs-whose-16','Write one lie or label you have believed, then write the truth God says about you.'),
('whose-before-who','identity-who-vs-whose-16','Is your identity shaped more by who you think you are or by whose you are?'),
('whose-tomorrow','identity-who-vs-whose-16','How might your life be different tomorrow if you focused on whose rather than who?'),
('identity-the-designid-lens-what-is-in-the-report-19-designid-connect','identity-the-designid-lens-what-is-in-the-report-19','Which part of your results best describes how you naturally respond, connect, or contribute? Share one everyday example.'),
('identity-the-designid-lens-what-is-in-the-report-19-designid-act','identity-the-designid-lens-what-is-in-the-report-19','Where will you practice this strength, whom could it serve, and what will you watch for as you use it?'),
('identity-the-designid-lens-what-is-in-the-report-19-designid-reflect','identity-the-designid-lens-what-is-in-the-report-19','What does your design help you understand about your response then? Knowing this now, what might you have done differently?'),
('identity-the-designid-lens-what-is-in-the-report-19-designid-explore','identity-the-designid-lens-what-is-in-the-report-19','How could understanding your design help you communicate, collaborate, or serve better there? What is one adjustment you could try?'),
('believer-community-placement','identity-identity-among-believers-20','Where has God placed you among other believers? How is His love already moving through you to others in quiet, unseen ways?'),
('believer-love-freely','identity-identity-among-believers-20','Take one intentional step this week to love another believer with no “so that.” Love freely, simply because God loves you. Encourage, serve, give, or forgive, not out of duty, but delight in reflecting His heart.'),
('love-god-four-ways','identity-identity-among-believers-20','•	Heart: Are my desires aligned with His?
•	Soul: Do my choices reflect surrender or self-will?
•	Mind: Are my thoughts renewed and submitted to Christ?
•	Strength: Am I offering my abilities, time, and resources to serve Him?'),
('believer-flourishing','identity-identity-among-believers-20','Where might God be inviting me to use my heart, soul, mind, and strength for the flourishing of others?'),
('identity-the-design-reflections-and-love-21-designid-connect','identity-the-design-reflections-and-love-21','For your primary and secondary reflection, record the words within the Heart, Soul, Mind, and Strength columns that stand out most to you. Why'),
('identity-the-design-reflections-and-love-21-designid-reflect','identity-the-design-reflections-and-love-21','How does connecting your design reflection to they ways we reflect God impact your approach to loving God?'),
('identity-reflections-and-one-anothering-23-designid-connect','identity-reflections-and-one-anothering-23','Who is a fellow believer you find difficult to understand or connect with? What might you appreciate about how God designed that person?'),
('identity-reflections-and-one-anothering-23-designid-act','identity-reflections-and-one-anothering-23','What will you do, and when will you do it?'),
('identity-reflections-and-one-anothering-23-designid-reflect','identity-reflections-and-one-anothering-23','Through which reflection does loving others come most naturally? Through which do you tend to hold back, and what might trusting God look like there?'),
('growth-signs','expertise-the-journey-to-expertise-26','Where do you see signs of God’s steady growth in your life, even if the process has been slow?'),
('expertise-the-journey-to-expertise-26-care-act','expertise-the-journey-to-expertise-26','What is your step?'),
('success-struggle-formation','expertise-the-journey-to-expertise-26','How has God used both your successes and struggles to strengthen your skills?'),
('expertise-the-journey-to-expertise-26-care-explore','expertise-the-journey-to-expertise-26','Where do you see signs of God''s steady growth in your life?'),
('expertise-talent-27-workbook-response','expertise-talent-27','What are your talents? Don’t hold back. This is a place for a brain dump. You may be surprised at how many things you list.'),
('expertise-talent-27-care-act','expertise-talent-27','Name one talent you can dust off and surrender to God this week.'),
('expertise-talent-27-care-reflect','expertise-talent-27','Are you cultivating them or letting them sit dormant?'),
('expertise-talent-27-care-explore','expertise-talent-27','Have you invited God into the process of developing your talents into something more?'),
('expertise-competence-28-workbook-response','expertise-competence-28','What in your life has muscle memory developed?'),
('expertise-competence-28-care-act','expertise-competence-28','What would it look like to train, practice, or study more in that area?'),
('expertise-competence-28-care-reflect','expertise-competence-28','Take a moment and be honest with yourself, are you coasting or growing. Are there areas where you’ve built some “muscle memory” but may be tempted to cruise?'),
('expertise-competence-28-care-explore','expertise-competence-28','Ask God to reveal one area in work, home, church, or personal, where He wants you to invest in growth this season. Who could you learn from, ask for feedback, or partner within this development?'),
('expertise-expertise-29-care-connect','expertise-expertise-29','If expertise is relational at its heart, consider your own relationship with Jesus. Would people who experienced you be able to say, “they have been with Jesus”?'),
('expertise-expertise-29-care-act','expertise-expertise-29','Excellence grows through faithful repetition.  “Whatever you do, work at it with all your heart, as working for the Lord” (Colossians 3:23). Choose one deliberate, learnable practice, and start showing up to it consistently. Record your plan.'),
('competent-to-expert','expertise-expertise-29','Where are you competent, and where is God inviting you toward expertise? “But solid food is for the mature, who by constant use have trained themselves to distinguish good from evil” Hebrews 5:14. Name the shortcuts you’ve been tempted to take.'),
('next-learning-stretch','expertise-expertise-29','Stay curious; stay teachable. “He has filled him with the Spirit of God, with wisdom, with understanding, with knowledge and with all kinds of skills” (Exodus 35:31). Plan your next learning stretch: a book list, a course, shadowing a seasoned practitioner, or teaching what you know to someone newer. Ask where your craft can bless others and strengthen the Body.'),
('busy-taking-stage','expertise-being-vs-doing-30','What is one area of your life where you have potentially tied your value to performance?'),
('expertise-being-vs-doing-30-care-act','expertise-being-vs-doing-30','This week, begin each workday or ministry task by pausing for thirty seconds to pray, “Lord, help me do this with You, not for You.” Write out eh first prayer that comes to mind..'),
('expertise-being-vs-doing-30-care-reflect','expertise-being-vs-doing-30','What can you surrender to Jesus?'),
('being-rhythm','expertise-being-vs-doing-30','Choose one daily rhythm this week that helps you remain present with Jesus. It should be something small yet sacred that reminds you your doing is meant to flow from being.'),
('expertise-connecting-identity-and-expertise-32-designid-connect','expertise-connecting-identity-and-expertise-32','Primary reflection: Where do you currently see talent, competency, and expertise expressed in your primary and secondary reflections, and what is one next step that would help each grow?'),
('expertise-connecting-identity-and-expertise-32-designid-reflect','expertise-connecting-identity-and-expertise-32','Secondary reflection: Where do you currently see talent, competency, and expertise expressed in your primary and secondary reflections, and what is one next step that would help each grow?'),
('shaping-moments','story-why-story-matters-35','List the biggest moments in your life that have shaped who you are.'),
('faith-story-outline','story-pauls-testimony-38','Write or outline your faith story.'),
('story-encouragement','story-pauls-testimony-38','What part of your story might encourage someone else?'),
('family-culture-gifts-wounds','story-family-and-culture-39','Name one gift and one wound you have inherited from your family or culture.'),
('inheritance-keep-surrender','story-family-and-culture-39','What inherited belief or pattern should be kept, and what should be surrendered?'),
('story-your-work-matters-40-workbook-response','story-your-work-matters-40','Called where you are'),
('story-your-church-story-41-workbook-response','story-your-church-story-41','Church Vs. The Body of Christ'),
('story-divine-reflections-within-your-stories-42-designid-connect','story-divine-reflections-within-your-stories-42','What does this DesignID reflection help you notice?'),
('story-divine-reflections-within-your-stories-42-designid-reflect','story-divine-reflections-within-your-stories-42','Where does this feel aligned, stretched, or in need of grace?'),
('story-what-is-learned-helplessness-43-designid-connect','story-what-is-learned-helplessness-43','What does this DesignID reflection help you notice?'),
('story-what-is-learned-helplessness-43-designid-reflect','story-what-is-learned-helplessness-43','Where does this feel aligned, stretched, or in need of grace?'),
('story-shadows-anxiety-and-fear-44-designid-connect','story-shadows-anxiety-and-fear-44','What does this DesignID reflection help you notice?'),
('story-shadows-anxiety-and-fear-44-designid-reflect','story-shadows-anxiety-and-fear-44','Where does this feel aligned, stretched, or in need of grace?'),
('story-from-fear-to-alignment-45-designid-connect','story-from-fear-to-alignment-45','What does this DesignID reflection help you notice?'),
('story-from-fear-to-alignment-45-designid-reflect','story-from-fear-to-alignment-45','Where does this feel aligned, stretched, or in need of grace?'),
('desire-say-think-live-love','desire-desire-why-you-say-think-live-and-love-the-way-you-do-48','For your primary reflection, how do you tend to say, think, live, and love?'),
('desire-near-refined','desire-will-vs-ways-50','Name one desire that draws you nearer to God and one that needs refining.'),
('desire-obedience-step','desire-will-vs-ways-50','What small prompting of obedience will you act on this week?'),
('strongest-insights-so-far','desire-identity-and-desire-51','What are the two strongest truths or insights God has shown you so far?'),
('design-patterns-emerging','desire-identity-and-desire-51','How do Identity, Expertise, Story, and Desire begin to connect into a clear picture?'),
('gift-service-opportunity','gifts-what-are-and-are-not-the-spiritual-gifts-58','What tangible need could you serve this week?'),
('gift-fit-body','gifts-what-are-and-are-not-the-spiritual-gifts-58','How could your gifts bring strength or encouragement to the Body of Christ?'),
('top-three-gifts','gifts-unpack-your-spiritual-gifts-59','List your top three spiritual gifts and rewrite each definition in your own words.'),
('gift-surprises','gifts-unpack-your-spiritual-gifts-59','Was there anything surprising to you about your gifts?'),
('gift-family-body-service','gifts-unpack-your-spiritual-gifts-59','How can your gifts benefit the Body of Christ and your family?'),
('gift-reflection-overlap','gifts-spiritual-gifts-and-identity-60','Which gifts feel most aligned with your reflection, and which invite you to stretch?'),
('gift-reflection-service','gifts-spiritual-gifts-and-identity-60','What new way to serve emerges when you compare gifts and DesignID reflections?'),
('hold-lightly-intentionally','gifts-spiritual-gifts-and-expertise-61','What insight should you hold lightly, and what should you hold with intention?'),
('gifts-pulling-together','gifts-spiritual-gifts-and-expertise-61','What patterns do you see between your Spiritual Gifts, Story, Identity, Expertise, and Desire?'),
('gifts-spiritual-gifts-and-story-desire-62-workbook-response','gifts-spiritual-gifts-and-story-desire-62','Spiritual Gifts: Pulling it all together');
create function public.dydd_cohort_count_only_guard() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare p jsonb;begin
 select plan into p from public.journey_circle_plans where id=new.circle_id;
 if p->>'format'='Cohort' then
  if new.body<>'' or new.share_text then raise exception 'Cohorts collect counts only, never written submissions';end if;
  if not exists(select 1 from public.dydd_circle_prompt_catalog where prompt=new.prompt and lesson=new.lesson) or new.session is distinct from p->'assignments'->>new.lesson then raise exception 'Choose an assigned canonical lesson prompt for a count-only Cohort signal';end if;
 end if;return new;
end $$;
create trigger dydd_cohort_count_only_guard before insert or update on public.dydd_circle_callouts for each row execute function public.dydd_cohort_count_only_guard();
revoke all on function public.dydd_cohort_count_only_guard() from public,anon,authenticated;
grant execute on function public.dydd_cohort_count_only_guard() to service_role;
commit;
