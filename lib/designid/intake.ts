export const designIdReflections = ["Architect", "Artisan", "Shepherd", "Steward"] as const;

export type DesignIdReflection = (typeof designIdReflections)[number];

export type DesignIdStatement = {
  auditAction: "Keep" | "Change" | "Fix";
  block: number;
  code: string;
  original: string;
  reflection: DesignIdReflection;
  text: string;
};

export const designIdRankField = (code: string) => `designid_rank_${code}`;

export const designIdQuestionBlocks: Array<{
  block: number;
  statements: DesignIdStatement[];
}> = [
  {
    block: 1,
    statements: [
      { auditAction: "Keep", block: 1, code: "B01_S1", original: "I can sense when someone needs care.", reflection: "Shepherd", text: "I can sense when someone needs care." },
      { auditAction: "Change", block: 1, code: "B01_S2", original: "I notice when things could be clearer.", reflection: "Artisan", text: "I improve things until they work clearly." },
      { auditAction: "Keep", block: 1, code: "B01_S3", original: "I like when plans stay on track.", reflection: "Steward", text: "I like when plans stay on track." },
      { auditAction: "Change", block: 1, code: "B01_S4", original: "I like to start things that need action.", reflection: "Architect", text: "I start things when direction is needed." },
    ],
  },
  {
    block: 2,
    statements: [
      { auditAction: "Change", block: 2, code: "B02_S1", original: "I’m happiest when things are organized.", reflection: "Steward", text: "I create order where things feel scattered." },
      { auditAction: "Change", block: 2, code: "B02_S2", original: "I find joy helping people grow.", reflection: "Shepherd", text: "I notice growth needs in people." },
      { auditAction: "Fix", block: 2, code: "B02_S3", original: "I feel alive taking bold action", reflection: "Architect", text: "I feel alive taking bold action." },
      { auditAction: "Keep", block: 2, code: "B02_S4", original: "I enjoy improving ideas until they work well.", reflection: "Artisan", text: "I enjoy improving ideas until they work well." },
    ],
  },
  {
    block: 3,
    statements: [
      { auditAction: "Keep", block: 3, code: "B03_S1", original: "I like finding better ways to do things.", reflection: "Artisan", text: "I like finding better ways to do things." },
      { auditAction: "Keep", block: 3, code: "B03_S2", original: "I prefer clear routines that build steady progress.", reflection: "Steward", text: "I prefer clear routines that build steady progress." },
      { auditAction: "Keep", block: 3, code: "B03_S3", original: "I notice when someone feels left out.", reflection: "Shepherd", text: "I notice when someone feels left out." },
      { auditAction: "Keep", block: 3, code: "B03_S4", original: "I naturally take charge when direction is needed.", reflection: "Architect", text: "I naturally take charge when direction is needed." },
    ],
  },
  {
    block: 4,
    statements: [
      { auditAction: "Keep", block: 4, code: "B04_S1", original: "I enjoy turning ideas into practical results.", reflection: "Artisan", text: "I enjoy turning ideas into practical results." },
      { auditAction: "Keep", block: 4, code: "B04_S2", original: "I listen well when others need to speak.", reflection: "Shepherd", text: "I listen well when others need to speak." },
      { auditAction: "Change", block: 4, code: "B04_S3", original: "I’m quick to start new projects.", reflection: "Architect", text: "I move quickly when something needs to begin." },
      { auditAction: "Keep", block: 4, code: "B04_S4", original: "I feel most at ease when tasks are complete.", reflection: "Steward", text: "I feel most at ease when tasks are complete." },
    ],
  },
  {
    block: 5,
    statements: [
      { auditAction: "Change", block: 5, code: "B05_S1", original: "I like improving how things function.", reflection: "Artisan", text: "I improve how things are formed." },
      { auditAction: "Keep", block: 5, code: "B05_S2", original: "I’m drawn to help people who are hurting.", reflection: "Shepherd", text: "I’m drawn to help people who are hurting." },
      { auditAction: "Keep", block: 5, code: "B05_S3", original: "I find peace in doing consistent work.", reflection: "Steward", text: "I find peace in doing consistent work." },
      { auditAction: "Change", block: 5, code: "B05_S4", original: "I like challenges that build my strength.", reflection: "Architect", text: "I grow stronger when facing challenge." },
    ],
  },
  {
    block: 6,
    statements: [
      { auditAction: "Keep", block: 6, code: "B06_S1", original: "I see patterns that bring clarity to complex things.", reflection: "Artisan", text: "I see patterns that bring clarity to complex things." },
      { auditAction: "Keep", block: 6, code: "B06_S2", original: "I keep systems steady and details aligned.", reflection: "Steward", text: "I keep systems steady and details aligned." },
      { auditAction: "Change", block: 6, code: "B06_S3", original: "I’m aware of the emotions of people around me.", reflection: "Shepherd", text: "I notice emotional shifts in people." },
      { auditAction: "Keep", block: 6, code: "B06_S4", original: "I enjoy creating new paths.", reflection: "Architect", text: "I enjoy creating new paths." },
    ],
  },
  {
    block: 7,
    statements: [
      { auditAction: "Change", block: 7, code: "B07_S1", original: "I notice how people are really doing.", reflection: "Shepherd", text: "I track how people are doing." },
      { auditAction: "Change", block: 7, code: "B07_S2", original: "I’m happiest when a plan comes together clearly.", reflection: "Artisan", text: "I enjoy bringing ideas into order." },
      { auditAction: "Change", block: 7, code: "B07_S3", original: "I’m most energized when I’m leading something.", reflection: "Architect", text: "I lead when movement is needed." },
      { auditAction: "Change", block: 7, code: "B07_S4", original: "I like routines that bring stability.", reflection: "Steward", text: "I rely on routines that create stability." },
    ],
  },
  {
    block: 8,
    statements: [
      { auditAction: "Keep", block: 8, code: "B08_S1", original: "I see beauty in structure and balance.", reflection: "Artisan", text: "I see beauty in structure and balance." },
      { auditAction: "Change", block: 8, code: "B08_S2", original: "I take satisfaction in keeping things consistent.", reflection: "Steward", text: "I keep things consistent over time." },
      { auditAction: "Change", block: 8, code: "B08_S3", original: "I find better ways to reach goals.", reflection: "Architect", text: "I see better paths toward a goal." },
      { auditAction: "Keep", block: 8, code: "B08_S4", original: "I enjoy comforting people who are stressed.", reflection: "Shepherd", text: "I enjoy comforting people who are stressed." },
    ],
  },
  {
    block: 9,
    statements: [
      { auditAction: "Keep", block: 9, code: "B09_S1", original: "I act quickly when I see what needs to be done.", reflection: "Architect", text: "I act quickly when I see what needs to be done." },
      { auditAction: "Change", block: 9, code: "B09_S2", original: "I check in on friends to see how they’re doing.", reflection: "Shepherd", text: "I notice when friends are struggling." },
      { auditAction: "Change", block: 9, code: "B09_S3", original: "I notice what’s missing in a plan.", reflection: "Artisan", text: "I notice design gaps others miss." },
      { auditAction: "Keep", block: 9, code: "B09_S4", original: "I feel best when I finish what I start.", reflection: "Steward", text: "I feel best when I finish what I start." },
    ],
  },
  {
    block: 10,
    statements: [
      { auditAction: "Keep", block: 10, code: "B10_S1", original: "I notice moods and bring calm where there’s tension.", reflection: "Shepherd", text: "I notice moods and bring calm where there’s tension." },
      { auditAction: "Keep", block: 10, code: "B10_S2", original: "I keep plans realistic and on schedule.", reflection: "Steward", text: "I keep plans realistic and on schedule." },
      { auditAction: "Change", block: 10, code: "B10_S3", original: "I like setting direction for others.", reflection: "Architect", text: "I set direction when people need movement." },
      { auditAction: "Keep", block: 10, code: "B10_S4", original: "I take time to refine details.", reflection: "Artisan", text: "I take time to refine details." },
    ],
  },
  {
    block: 11,
    statements: [
      { auditAction: "Keep", block: 11, code: "B11_S1", original: "I sense when someone needs to talk.", reflection: "Shepherd", text: "I sense when someone needs to talk." },
      { auditAction: "Change", block: 11, code: "B11_S2", original: "I bring order to messy situations.", reflection: "Artisan", text: "I bring form to messy ideas." },
      { auditAction: "Keep", block: 11, code: "B11_S3", original: "I manage responsibilities carefully.", reflection: "Steward", text: "I manage responsibilities carefully." },
      { auditAction: "Keep", block: 11, code: "B11_S4", original: "I like solving problems others find challenging.", reflection: "Architect", text: "I like solving problems others find challenging." },
    ],
  },
  {
    block: 12,
    statements: [
      { auditAction: "Keep", block: 12, code: "B12_S1", original: "I’m grateful to stay faithful with what’s entrusted to me.", reflection: "Steward", text: "I’m grateful to stay faithful with what’s entrusted to me." },
      { auditAction: "Change", block: 12, code: "B12_S2", original: "I’m fulfilled when I help people grow.", reflection: "Shepherd", text: "I invest in people’s growth." },
      { auditAction: "Change", block: 12, code: "B12_S3", original: "I’m drawn to projects with clear design.", reflection: "Artisan", text: "I’m drawn to purposeful design." },
      { auditAction: "Keep", block: 12, code: "B12_S4", original: "I feel at home when I’m leading meaningful work.", reflection: "Architect", text: "I feel at home when I’m leading meaningful work." },
    ],
  },
  {
    block: 13,
    statements: [
      { auditAction: "Keep", block: 13, code: "B13_S1", original: "I keep track of details so things stay strong.", reflection: "Steward", text: "I keep track of details so things stay strong." },
      { auditAction: "Change", block: 13, code: "B13_S2", original: "I enjoy learning how things work.", reflection: "Artisan", text: "I study how things are made." },
      { auditAction: "Keep", block: 13, code: "B13_S3", original: "I like inspiring others to see what’s possible.", reflection: "Architect", text: "I like inspiring others to see what’s possible." },
      { auditAction: "Change", block: 13, code: "B13_S4", original: "I care about people’s wellbeing.", reflection: "Shepherd", text: "I naturally track people’s wellbeing." },
    ],
  },
  {
    block: 14,
    statements: [
      { auditAction: "Change", block: 14, code: "B14_S1", original: "I value kindness and connection.", reflection: "Shepherd", text: "I create connection when people feel distant." },
      { auditAction: "Keep", block: 14, code: "B14_S2", original: "I like structure that gives people security.", reflection: "Steward", text: "I like structure that gives people security." },
      { auditAction: "Change", block: 14, code: "B14_S3", original: "I like creating clarity in confusing situations.", reflection: "Artisan", text: "I clarify ideas through careful shaping." },
      { auditAction: "Change", block: 14, code: "B14_S4", original: "I get excited by new ideas.", reflection: "Architect", text: "I get excited by new possibilities." },
    ],
  },
  {
    block: 15,
    statements: [
      { auditAction: "Fix", block: 15, code: "B15_S1", original: "I enjoy motivating others toward shared goals", reflection: "Architect", text: "I enjoy motivating others toward shared goals." },
      { auditAction: "Keep", block: 15, code: "B15_S2", original: "I find satisfaction in crafting until it’s complete.", reflection: "Artisan", text: "I find satisfaction in crafting until it’s complete." },
      { auditAction: "Change", block: 15, code: "B15_S3", original: "I take comfort in dependable routines.", reflection: "Steward", text: "I trust routines that keep things dependable." },
      { auditAction: "Change", block: 15, code: "B15_S4", original: "I enjoy being there for people who need support.", reflection: "Shepherd", text: "I make room for people who need support." },
    ],
  },
  {
    block: 16,
    statements: [
      { auditAction: "Keep", block: 16, code: "B16_S1", original: "I keep things on course through steady effort.", reflection: "Steward", text: "I keep things on course through steady effort." },
      { auditAction: "Keep", block: 16, code: "B16_S2", original: "I like building momentum that brings vision to life.", reflection: "Architect", text: "I like building momentum that brings vision to life." },
      { auditAction: "Keep", block: 16, code: "B16_S3", original: "I notice when people feel unseen.", reflection: "Shepherd", text: "I notice when people feel unseen." },
      { auditAction: "Change", block: 16, code: "B16_S4", original: "I see ways to make things more effective.", reflection: "Artisan", text: "I refine things to work better." },
    ],
  },
  {
    block: 17,
    statements: [
      { auditAction: "Keep", block: 17, code: "B17_S1", original: "I make improvements others might overlook.", reflection: "Artisan", text: "I make improvements others might overlook." },
      { auditAction: "Keep", block: 17, code: "B17_S2", original: "I maintain order during uncertain times.", reflection: "Steward", text: "I maintain order during uncertain times." },
      { auditAction: "Keep", block: 17, code: "B17_S3", original: "I encourage people who lose confidence.", reflection: "Shepherd", text: "I encourage people who lose confidence." },
      { auditAction: "Keep", block: 17, code: "B17_S4", original: "I take initiative when something important needs to be done.", reflection: "Architect", text: "I take initiative when something important needs to be done." },
    ],
  },
  {
    block: 18,
    statements: [
      { auditAction: "Change", block: 18, code: "B18_S1", original: "I like refining systems.", reflection: "Artisan", text: "I refine systems until they work better." },
      { auditAction: "Change", block: 18, code: "B18_S2", original: "I bring calm by setting clear steps.", reflection: "Steward", text: "I create clear steps in uncertain moments." },
      { auditAction: "Change", block: 18, code: "B18_S3", original: "I enjoy taking risks that lead to growth.", reflection: "Architect", text: "I move toward possibility before it is certain." },
      { auditAction: "Change", block: 18, code: "B18_S4", original: "I listen deeply to understand others.", reflection: "Shepherd", text: "I listen for what people are really saying." },
    ],
  },
  {
    block: 19,
    statements: [
      { auditAction: "Keep", block: 19, code: "B19_S1", original: "I keep processes consistent and fair.", reflection: "Steward", text: "I keep processes consistent and fair." },
      { auditAction: "Keep", block: 19, code: "B19_S2", original: "I act when someone feels left behind.", reflection: "Shepherd", text: "I act when someone feels left behind." },
      { auditAction: "Change", block: 19, code: "B19_S3", original: "I notice details others might miss.", reflection: "Artisan", text: "I notice design details others miss." },
      { auditAction: "Change", block: 19, code: "B19_S4", original: "I think ahead to what could be built.", reflection: "Architect", text: "I think ahead to what should be built." },
    ],
  },
  {
    block: 20,
    statements: [
      { auditAction: "Keep", block: 20, code: "B20_S1", original: "I envision what could be better.", reflection: "Architect", text: "I envision what could be better." },
      { auditAction: "Keep", block: 20, code: "B20_S2", original: "I shape ideas into finished form.", reflection: "Artisan", text: "I shape ideas into finished form." },
      { auditAction: "Fix", block: 20, code: "B20_S3", original: "I value compassion.", reflection: "Shepherd", text: "I respond when people need compassion." },
      { auditAction: "Change", block: 20, code: "B20_S4", original: "I stay steady.", reflection: "Steward", text: "I remain steady when pressure rises." },
    ],
  },
];

export const designIdQuestionBank = designIdQuestionBlocks.flatMap((block) => block.statements);
