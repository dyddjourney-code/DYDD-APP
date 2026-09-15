type SpiritualGiftReportGift = {
  definition: string;
  label: string;
  maturity?: {
    anchorScripture?: string;
    description?: string;
    growthAreas?: string;
    signsOfImmaturity?: string;
    stepsToGrow?: string;
  };
  rank?: number;
  reflections?: Record<string, string>;
  reportBlurb: string;
  scriptures: string;
  score: number;
};

type SpiritualGiftTieSummary = {
  cleanTopThree?: boolean;
  topFiveWouldOmitTiedGifts?: boolean;
  topTierCount?: number;
};

function giftCorrelation(gift: SpiritualGiftReportGift) {
  const reflections = gift.reflections ?? {};

  return ["Architect", "Artisan", "Shepherd", "Steward"]
    .map((reflection) => {
      const text = reflections[reflection];
      return text ? `${reflection}: ${text}` : "";
    })
    .filter(Boolean)
    .join("\n");
}

function tieNote(tieSummary: SpiritualGiftTieSummary) {
  if (tieSummary.topFiveWouldOmitTiedGifts) {
    return "Several gifts scored closely around your Top 5 cutoff. We are showing a focused Top 5 for clarity, but nearby gifts may also deserve prayer, service, and confirmation from trusted people.";
  }

  if ((tieSummary.topTierCount ?? 0) > 1) {
    return "More than one gift shared your highest score. Treat the order as a helpful starting point, and pay special attention to the repeated themes God may be highlighting across those gifts.";
  }

  if (tieSummary.cleanTopThree === false) {
    return "Some gifts scored closely together. Use the Top 3 deep dive as a focused starting point rather than a final label.";
  }

  return "Your Top 3 gifts separated clearly enough to give you a focused place to begin reflection, prayer, and trusted confirmation.";
}

function giftFields(gift: SpiritualGiftReportGift | undefined, index: number) {
  const prefix = `Top${index}`;

  return {
    [`${prefix}_AnchorScripture`]: gift?.maturity?.anchorScripture ?? "",
    [`${prefix}_Blurb`]: gift?.reportBlurb ?? "",
    [`${prefix}_Correlation`]: gift ? giftCorrelation(gift) : "",
    [`${prefix}_Definition`]: gift?.definition ?? "",
    [`${prefix}_GrowthAreas`]: gift?.maturity?.growthAreas ?? "",
    [`${prefix}_MaturityDescription`]: gift?.maturity?.description ?? "",
    [`${prefix}_Name`]: gift?.label ?? "",
    [`${prefix}_Score`]: gift?.score ?? "",
    [`${prefix}_Scripture`]: gift?.scriptures ?? "",
    [`${prefix}_SignsOfImmaturity`]: gift?.maturity?.signsOfImmaturity ?? "",
    [`${prefix}_StepsToGrow`]: gift?.maturity?.stepsToGrow ?? "",
  };
}

export function buildSpiritualGiftsPdfMonkeyPayload({
  nextStepReflection,
  participantEmail,
  participantName,
  deepDiveGifts,
  tieSummary,
  topGifts,
}: {
  nextStepReflection?: string;
  participantEmail: string;
  participantName: string;
  deepDiveGifts: SpiritualGiftReportGift[];
  tieSummary: SpiritualGiftTieSummary;
  topGifts: SpiritualGiftReportGift[];
}) {
  return {
    Email_Address: participantEmail,
    Full_Name: participantName,
    Generated_Date: new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    Result_Note:
      "Use these results as a prayerful starting point. Spiritual gifts are best confirmed through Scripture, faithful service, and trusted people who have seen your life in motion.",
    Next_Step_Reflection: nextStepReflection?.trim() ?? "",
    Tie_Note: tieNote(tieSummary),
    ...giftFields(topGifts[0], 1),
    ...giftFields(topGifts[1], 2),
    ...giftFields(topGifts[2], 3),
    ...giftFields(topGifts[3], 4),
    ...giftFields(topGifts[4], 5),
    Deep_Dive_Gifts: deepDiveGifts.map((gift) => gift.label).join(", "),
  };
}
