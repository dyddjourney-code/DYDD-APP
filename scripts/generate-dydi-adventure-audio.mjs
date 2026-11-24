import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

// Optional Sandbox2 narration. No autoplay or customer/application data writes.
const outputDir = path.resolve('public/audio/dydi-adventure');
const voiceId = 'EXAVITQu4vr4xnSDxMaL';
const voiceSettings = {stability: 0.82, similarity_boost: 0.9, style: 0.08, use_speaker_boost: true};
const scenes = {
  camp: 'Welcome to Base Camp. I’m Dydi. There’s no race here. Walk with me to the Ranger Station, and we’ll find a good place for your journey to begin.',
  trail: 'Take a look at the trails ahead. The full Journey brings the pieces together. The shorter paths let you explore one part of your design at a time.',
  desk: 'Come on in. This is the Ranger Station. Bring your questions to the desk, or join me at the relief table to see how the journey fits together.',
  relief: 'This is our working map. Base Camp is where you return. Trailheads open the courses. Your Field Kit holds discoveries. And Fireside makes room to walk with others. Choose a place on the map and take a closer look.',
  doorway: 'Just past the map table is the Learning Center. This is the doorway into your classroom. Come through with me, and we’ll settle in for the Journey.',
  classroom: 'Welcome to the Learning Center. Your course follows the familiar modules and lessons on the left. Read, listen to your companions, then make room to reflect. Your existing lessons and saved work are still here.',
  passport: 'Your Passport records real milestones from your journey. We don’t hand out points for looking around. As you complete the existing missions and assessments, your earned badges tell the story.',
};
const key = process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY;
if (!key) throw new Error('Missing ElevenLabs API key');
const ffprobe = process.env.FFPROBE_PATH || 'ffprobe';
const timestamp = seconds => {
  const ms = Math.round(seconds * 1000);
  return `${String(Math.floor(ms / 3600000)).padStart(2,'0')}:${String(Math.floor(ms / 60000) % 60).padStart(2,'0')}:${String(Math.floor(ms / 1000) % 60).padStart(2,'0')}.${String(ms % 1000).padStart(3,'0')}`;
};
await fs.mkdir(outputDir,{recursive:true});
const manifest = {speaker:'Dydi', voiceId, modelId:'eleven_multilingual_v2', voiceSettings, generatedAt:new Date().toISOString(), clips:[]};
for (const [id,text] of Object.entries(scenes)) {
  const audioPath = path.join(outputDir,`${id}.mp3`);
  const receiptPath = path.join(outputDir,`${id}.alignment.json`);
  let receipt;
  const existing = await fs.stat(audioPath).catch(()=>null);
  if (existing?.size > 1000 && !process.argv.includes('--force')) {
    receipt = JSON.parse(await fs.readFile(receiptPath,'utf8'));
    if(receipt.text !== text) throw new Error(`${id}: existing transcript differs; use --force`);
  } else {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
      method:'POST',headers:{'Content-Type':'application/json','xi-api-key':key},
      body:JSON.stringify({text,model_id:'eleven_multilingual_v2',voice_settings:voiceSettings,apply_text_normalization:'off'})
    });
    if (!response.ok) throw new Error(`${id}: ElevenLabs HTTP ${response.status}`);
    const result = await response.json();
    if (!result.audio_base64) throw new Error(`${id}: missing audio`);
    await fs.writeFile(audioPath,Buffer.from(result.audio_base64,'base64'));
    receipt = {text,alignment:result.alignment,normalized_alignment:result.normalized_alignment};
    await fs.writeFile(receiptPath,JSON.stringify(receipt,null,2)+'\n');
  }
  const probe = JSON.parse(execFileSync(ffprobe,['-v','error','-show_format','-show_streams','-of','json',audioPath],{encoding:'utf8'}));
  const duration = Number(probe.format.duration);
  if (!Number.isFinite(duration) || duration <= 0 || probe.streams[0]?.codec_name !== 'mp3') throw new Error(`${id}: invalid MP3`);
  const alignment = receipt.normalized_alignment;
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)/gu).map(s=>s.trim());
  let cues;
  let timing;
  const canonical = value => value.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  const alignedText = alignment?.characters?.join('') || '';
  if (canonical(alignedText).trim() === canonical(text)) {
    timing = 'normalized_alignment';
    let cursor = 0;
    cues = sentences.map(sentence=>{
      const start = canonical(alignedText).indexOf(canonical(sentence),cursor);
      const end = start + sentence.length - 1;
      cursor = end + 1;
      return {text:sentence,start:alignment.character_start_times_seconds[start],end:alignment.character_end_times_seconds[end]};
    });
  } else {
    timing = 'approximate_sentence_timings_based_on_real_duration';
    let cursor=0;
    const total=sentences.reduce((sum,s)=>sum+s.length,0);
    cues=sentences.map(sentence=>{const start=cursor;cursor+=duration*sentence.length/total;return {text:sentence,start,end:cursor};});
  }
  if(cues.some(c=>!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.end<=c.start||c.end>duration+0.1)) throw new Error(`${id}: invalid cue timing`);
  const vtt = 'WEBVTT\n\n'+(timing.startsWith('approximate')?'NOTE Approximate sentence timings based on measured audio duration.\n\n':'')+cues.map((c,i)=>`${i+1}\n${timestamp(c.start)} --> ${timestamp(c.end)}\n${c.text}\n`).join('\n');
  await fs.writeFile(path.join(outputDir,`${id}.vtt`),vtt);
  await fs.writeFile(path.join(outputDir,`${id}.txt`),text+'\n');
  manifest.clips.push({id,audio:`/audio/dydi-adventure/${id}.mp3`,captions:`/audio/dydi-adventure/${id}.vtt`,transcript:text,durationSeconds:duration,timing,codec:probe.streams[0].codec_name,sampleRate:Number(probe.streams[0].sample_rate),bytes:Number(probe.format.size),cues});
  console.log(`${id}: ${duration.toFixed(3)}s; ${timing}; ${probe.format.size} bytes`);
}
await fs.writeFile(path.join(outputDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Verified ${manifest.clips.length} clips; total ${manifest.clips.reduce((sum,c)=>sum+c.durationSeconds,0).toFixed(3)}s`);
