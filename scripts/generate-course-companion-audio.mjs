import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "public/audio/companions/course-moments");
const scriptDir = path.join(root, "docs/voice-lab/productions/course-companion-moments-2026-09-16");

const voices = {
  dydi: {
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    settings: { stability: 0.82, similarity_boost: 0.9, style: 0.08, use_speaker_boost: true },
  },
  daniel: {
    voiceId: "iP95p4xoKVk53GoZ742B",
    settings: { stability: 0.66, similarity_boost: 0.88, style: 0.24, use_speaker_boost: true },
  },
  mara: {
    voiceId: "fLQhkOW7F9KVKAjYCbhr",
    settings: { stability: 0.54, similarity_boost: 0.84, style: 0.4, use_speaker_boost: true },
  },
  naomi: {
    voiceId: "vQ2xJ0HUjdmWkVVJK2eI",
    settings: { stability: 0.56, similarity_boost: 0.88, style: 0.38, use_speaker_boost: true },
  },
  clara: {
    voiceId: "cgSgspJ2msm6clMCkdW9",
    settings: { stability: 0.58, similarity_boost: 0.86, style: 0.3, use_speaker_boost: true },
  },
  miles: {
    voiceId: "pqHfZKP75CvOlQylNhV4",
    settings: { stability: 0.76, similarity_boost: 0.9, style: 0.18, use_speaker_boost: true },
  },
  marcus: {
    voiceId: "nPczCjzI2devNBz1zQrb",
    settings: { stability: 0.66, similarity_boost: 0.89, style: 0.32, use_speaker_boost: true },
  },
  leo: {
    voiceId: "bIHbv24MWmeRgasZH58o",
    settings: { stability: 0.4, similarity_boost: 0.84, style: 0.42, use_speaker_boost: true },
  },
};

const moments = [
  {
    file: "sg-welcome-dydi.mp3",
    speaker: "Dydi",
    voice: "dydi",
    text: "Before you begin, take a breath. Your spiritual gifts are not a pressure to perform or a label to protect. They are grace to steward. This course will help you read your report slowly, pray honestly, and look for the places your gifts can build others up in love. Do not rush to prove anything. Ask God for humility, courage, and a small faithful next step.",
  },
  {
    file: "sg-report-daniel.mp3",
    speaker: "Daniel",
    voice: "daniel",
    text: "When you read your report, notice what gives life before you start fixing anything. Which gift sounds familiar? Which one surprises you? Which one needs maturity before it needs more opportunity? A gift is safest when it is governed by love. So read this as a beginning: one gift, one prayer, one trusted person, and one small place to serve.",
  },
  {
    file: "sg-community-mara.mp3",
    speaker: "Mara",
    voice: "mara",
    text: "You were not meant to discern your gifts alone. Sometimes other people see grace in us before we have words for it. Ask someone safe and honest, \"Where have you seen God use me to strengthen others?\" Then listen without defending and without shrinking back. Confirmation is not a crown. It is a kindness that helps you serve with more love.",
  },
  {
    file: "sg-growth-clara.mp3",
    speaker: "Clara",
    voice: "clara",
    text: "A growth plan does not have to be complicated. Choose one gift from your report. Choose one maturity practice. Choose one place to serve. Then set a seven-day checkpoint. Small faithful steps repeated over time create real formation. The question is not, \"Can I master this gift?\" The better question is, \"How can I steward this grace faithfully this week?\"",
  },
  {
    file: "fl-welcome-dydi.mp3",
    speaker: "Dydi",
    voice: "dydi",
    text: "FruitLife 360 is not here to grade your spiritual life. It is a mirror for noticing what the Spirit may be forming in you. Begin with grace. Receive encouragement first. Then let the report help you notice one fruit, one ordinary setting, and one practice where you can walk with Jesus more intentionally this week.",
  },
  {
    file: "fl-observers-mara.mp3",
    speaker: "Mara",
    voice: "mara",
    text: "Observer feedback can feel tender because it touches real life. So receive it gently. Look for repeated themes, not one sharp sentence. Look for encouragement before correction. And when something stings, ask, \"Lord, is there an invitation here?\" You are not being reduced to a score. You are being invited into formation with hope.",
  },
  {
    file: "fl-abiding-daniel.mp3",
    speaker: "Daniel",
    voice: "daniel",
    text: "Jesus does not tell branches to strain harder. He says, remain in Me. That matters. Fruit formation includes practice, but it starts with dependence. Before you choose a strategy, ask where you need to stay close to Christ. What would it look like to bring this fruit into prayer before you bring it into effort?",
  },
  {
    file: "fl-practice-naomi.mp3",
    speaker: "Naomi",
    voice: "naomi",
    text: "Formation becomes clearer when practice is specific. Do not choose every fruit at once. Choose one fruit. Choose one ordinary setting. Choose one action you can repeat for seven days. Then notice what happens in your words, tone, pace, and attention. Growth often begins quietly, but faithful practice gives it room to take root.",
  },
  {
    file: "fl-dydd-miles.mp3",
    speaker: "Miles",
    voice: "miles",
    text: "Design, gifts, calling, and action all need formation. FruitLife helps keep the center steady. The question is not only, \"What am I designed to do?\" It is also, \"Who am I becoming as I do it?\" Let your next step be both purposeful and faithful. Steward the work, but also steward the heart carrying the work.",
  },
  {
    file: "designid-welcome-dydi.mp3",
    speaker: "Dydi",
    voice: "dydi",
    text: "DesignID is not meant to box you in. It gives language for patterns God may have woven into your life: how you see, serve, build, care, create, organize, and respond. As you begin, hold the report with curiosity. You are not trying to become a type. You are learning to notice grace, design, and the next faithful step.",
  },
  {
    file: "designid-profile-marcus.mp3",
    speaker: "Marcus",
    voice: "marcus",
    text: "Your profile is useful when it becomes stewardship. Do not stop at, \"This is how I am wired.\" Ask, \"What does this help me build, clarify, protect, or serve?\" Primary and secondary reflections can show repeated patterns, but maturity asks how those patterns bless real people in real places.",
  },
  {
    file: "designid-capacity-naomi.mp3",
    speaker: "Naomi",
    voice: "naomi",
    text: "Capacity is not a moral score. It is information for wisdom. If a reflection is low, stretched, or tired, that may name a need for rest, partnership, practice, or clearer boundaries. If a reflection is strong, that may name a place to steward carefully. Either way, listen with gentleness and respond with one wise adjustment.",
  },
  {
    file: "designid-shadows-leo.mp3",
    speaker: "Leo",
    voice: "leo",
    text: "Shadow language can sound heavy, but it can also be merciful. It helps us notice what happens when a good reflection gets pressured, disconnected, or afraid. Do not use shadow to shame yourself. Use it as a lamp. Ask, \"What beautiful thing is trying to protect itself here, and how can God redeem it?\"",
  },
];

async function generateMoment(moment) {
  const voice = voices[moment.voice];
  if (!voice) {
    throw new Error(`Unknown voice ${moment.voice}`);
  }

  const outPath = path.join(outputDir, moment.file);
  const scriptPath = path.join(scriptDir, moment.file.replace(/\.mp3$/, ".txt"));
  await fs.writeFile(scriptPath, `${moment.speaker}\n\n${moment.text}\n`, "utf8");

  const existing = await fs.stat(outPath).catch(() => null);
  if (existing?.size > 1000 && !process.argv.includes("--force")) {
    console.log(`skip ${moment.file}`);
    return;
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": process.env.ELEVENLABS_API_KEY ?? process.env.XI_API_KEY ?? "",
    },
    body: JSON.stringify({
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
      text: moment.text,
      voice_settings: voice.settings,
    }),
  });

  if (!response.ok) {
    throw new Error(`${moment.file}: ${response.status} ${await response.text()}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outPath, buffer);
  console.log(`wrote ${moment.file} ${buffer.length} bytes`);
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(scriptDir, { recursive: true });

if (!process.env.ELEVENLABS_API_KEY && !process.env.XI_API_KEY) {
  throw new Error("Missing ELEVENLABS_API_KEY or XI_API_KEY");
}

for (const moment of moments) {
  await generateMoment(moment);
}
