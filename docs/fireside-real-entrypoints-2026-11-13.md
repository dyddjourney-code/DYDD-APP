# Actual owner-console / sandbox navigation

The real private Command Center is https://dydd-private-owner-console.vercel.app/command-center, project prj_Aw8o5xjiMpVY9NaGvFBsamRIM4Aq. Its top navigation is app/layout.tsx, not the retired owner-console prototype or the sandbox Command Center. The Fireside top tab points directly to https://dydd-online-school-sandbox.vercel.app/command-center/fireside. Sandbox Live Fireside points to /live on that same sandbox host; /fireside is the original landing. No Fireside functionality or records are promoted to the live owner app.

The private console is protected by Vercel Authentication. The sandbox uses separate Supabase accounts/cookies. An existing sandbox session is reused normally by the browser; private-console Vercel auth cannot become a sandbox account session. If absent, normal sandbox password login preserves next=/command-center/fireside. No identity handoff, privileged token bridge, share grant, or auth bypass was added.

Sandbox middleware must not silently forward Command Center navigation to the live-data private console. Each route retains its original page/API auth guards. Auth callback failure preserves the original next destination. Every sandbox page retains its global gold sandbox indicator and explicit link to /live, with an explicitly named return to the private live-data owner console.

My Access course/module/map contents are unrelated to this navigation repair; no entitlement, course, assessment, reporting or database changes are included.
