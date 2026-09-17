import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "public/audio/companions/course-moments");
const scriptDir = path.join(root, "docs/voice-lab/productions/dydd-journey-companion-moments-2026-09-16");

const voices = {
  clara: {
    voiceId: "cgSgspJ2msm6clMCkdW9",
    settings: { stability: 0.58, similarity_boost: 0.86, style: 0.3, use_speaker_boost: true },
  },
  daniel: {
    voiceId: "iP95p4xoKVk53GoZ742B",
    settings: { stability: 0.66, similarity_boost: 0.88, style: 0.24, use_speaker_boost: true },
  },
  dydi: {
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    settings: { stability: 0.82, similarity_boost: 0.9, style: 0.08, use_speaker_boost: true },
  },
  elena: {
    voiceId: "pBZVCk298iJlHAcHQwLr",
    settings: { stability: 0.64, similarity_boost: 0.88, style: 0.38, use_speaker_boost: true },
  },
  leo: {
    voiceId: "bIHbv24MWmeRgasZH58o",
    settings: { stability: 0.4, similarity_boost: 0.84, style: 0.42, use_speaker_boost: true },
  },
  mara: {
    voiceId: "fLQhkOW7F9KVKAjYCbhr",
    settings: { stability: 0.54, similarity_boost: 0.84, style: 0.4, use_speaker_boost: true },
  },
  marcus: {
    voiceId: "nPczCjzI2devNBz1zQrb",
    settings: { stability: 0.66, similarity_boost: 0.89, style: 0.32, use_speaker_boost: true },
  },
  miles: {
    voiceId: "pqHfZKP75CvOlQylNhV4",
    settings: { stability: 0.76, similarity_boost: 0.9, style: 0.18, use_speaker_boost: true },
  },
  naomi: {
    voiceId: "vQ2xJ0HUjdmWkVVJK2eI",
    settings: { stability: 0.56, similarity_boost: 0.88, style: 0.38, use_speaker_boost: true },
  },
};

const moments = [
  {
    file: "dydd-journey-welcome-dydi.mp3",
    turns: [
      {
        speaker: "Dydi",
        voice: "dydi",
        text: "Welcome to Discover Your Divine Design. Do not treat this like a race to finish content. This journey is meant to help you notice what God has already been forming in you: identity, story, gifts, desire, expertise, and purpose. Start simply. Bring honesty. Ask God for one faithful step at a time.",
      },
    ],
  },
  {
    file: "dydd-journey-care-daniel-mara.mp3",
    turns: [
      {
        speaker: "Daniel",
        voice: "daniel",
        text: "CARE is not a worksheet trick. It is a way of slowing down enough to connect with God before you act.",
      },
      {
        speaker: "Mara",
        voice: "mara",
        text: "And after you act, you reflect. You notice what happened in your heart, your relationships, and your courage. Then you explore what God may be inviting next.",
      },
      {
        speaker: "Daniel",
        voice: "daniel",
        text: "So when a lesson feels big, bring it back to the next small faithful step.",
      },
    ],
  },
  {
    file: "dydd-journey-identity-mara.mp3",
    turns: [
      {
        speaker: "Mara",
        voice: "mara",
        text: "Before you try to name what you do, let God remind you whose you are. Identity is not something you perform into existence. It is received in Christ and then expressed through love. As you answer these questions, be gentle with yourself. Let truth come before pressure.",
      },
    ],
  },
  {
    file: "dydd-journey-expertise-naomi-miles.mp3",
    turns: [
      {
        speaker: "Naomi",
        voice: "naomi",
        text: "Expertise often grows quietly through practice, repetition, failure, learning, and care. Do not only look for what feels impressive.",
      },
      {
        speaker: "Miles",
        voice: "miles",
        text: "Look for what has been entrusted to you over time. Talents, competencies, and hard-won wisdom can all become stewardship when they are offered back to God.",
      },
    ],
  },
  {
    file: "dydd-journey-story-leo-mara.mp3",
    turns: [
      {
        speaker: "Leo",
        voice: "leo",
        text: "Your story is not just a timeline of events. It carries themes, wounds, provision, courage, and moments where God was writing more than you could see.",
      },
      {
        speaker: "Mara",
        voice: "mara",
        text: "Hold it tenderly. Some memories need gratitude. Some need grief. Some need redemption language. Ask what God has been forming through the story, not only what happened in it.",
      },
    ],
  },
  {
    file: "dydd-journey-desire-elena.mp3",
    turns: [
      {
        speaker: "Elena",
        voice: "elena",
        text: "Desire can become noisy when it is ruled by fear, comparison, or ambition. But desire can also become a clue. Pay attention to the burdens, hopes, and possibilities that keep returning in prayer. Do not force them into a final answer yet. Name them honestly and ask what faithful direction they may be pointing toward.",
      },
    ],
  },
  {
    file: "dydd-journey-gifts-clara-daniel.mp3",
    turns: [
      {
        speaker: "Clara",
        voice: "clara",
        text: "When you reach the Gifts chapter, keep your results connected to everything you have already named: identity, expertise, story, and desire.",
      },
      {
        speaker: "Daniel",
        voice: "daniel",
        text: "A gift is not meant to stand alone. It becomes fruitful when love governs it and community confirms it. Ask where your gifts can serve the people God is placing in front of you.",
      },
    ],
  },
  {
    file: "dydd-journey-niche-four-voices.mp3",
    turns: [
      {
        speaker: "Dydi",
        voice: "dydi",
        text: "Before you draft the final declaration, gather the pieces slowly. Identity, story, expertise, desire, and gifts are not separate piles. They are becoming one faithful picture.",
      },
      {
        speaker: "Daniel",
        voice: "daniel",
        text: "And if the picture still feels incomplete, that is all right. Purpose often becomes clearer through obedience, not before it.",
      },
      {
        speaker: "Naomi",
        voice: "naomi",
        text: "Use plain words first. Do not try to make the sentence sound impressive. Make it honest, usable, and faithful to what you have actually discovered.",
      },
      {
        speaker: "Marcus",
        voice: "marcus",
        text: "Then give it structure. Who are you called to serve? What has God formed in you? What kind of good work is beginning to take shape?",
      },
      {
        speaker: "Dydi",
        voice: "dydi",
        text: "Let this be a working declaration, not a final prison. God can keep refining the language as you keep walking.",
      },
    ],
  },
];

async function synthesizeTurn(turn) {
  const voice = voices[turn.voice];
  if (!voice) {
    throw new Error(`Unknown voice ${turn.voice}`);
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
      text: turn.text,
      voice_settings: voice.settings,
    }),
  });

  if (!response.ok) {
    throw new Error(`${turn.speaker}: ${response.status} ${await response.text()}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function generateMoment(moment) {
  const outPath = path.join(outputDir, moment.file);
  const scriptPath = path.join(scriptDir, moment.file.replace(/\.mp3$/, ".txt"));
  await fs.writeFile(
    scriptPath,
    moment.turns.map((turn) => `${turn.speaker}: ${turn.text}`).join("\n\n") + "\n",
    "utf8",
  );

  const existing = await fs.stat(outPath).catch(() => null);
  if (existing?.size > 1000 && !process.argv.includes("--force")) {
    console.log(`skip ${moment.file}`);
    return;
  }

  const chunks = [];
  for (const [index, turn] of moment.turns.entries()) {
    chunks.push(await synthesizeTurn(turn));
  }

  const mp3 = Buffer.concat(chunks);
  await fs.writeFile(outPath, mp3);
  console.log(`wrote ${moment.file} ${mp3.length} bytes`);
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(scriptDir, { recursive: true });

if (!process.env.ELEVENLABS_API_KEY && !process.env.XI_API_KEY) {
  throw new Error("Missing ELEVENLABS_API_KEY or XI_API_KEY");
}

for (const moment of moments) {
  await generateMoment(moment);
}
