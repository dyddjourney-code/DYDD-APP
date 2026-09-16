export type CompanionMomentSpeaker = {
  image: string;
  imageAlt: string;
  name: string;
  role: string;
};

export type CompanionMomentTranscriptLine = {
  speaker?: string;
  text: string;
};

export type CompanionMoment = {
  audioSrc: string;
  duration: string;
  kicker: string;
  speakers: readonly CompanionMomentSpeaker[];
  title: string;
  transcript: readonly CompanionMomentTranscriptLine[];
};
