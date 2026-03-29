export type ParsedAdvice = {
  gist: string;
  story: string;
  steps: string;
  daily: string;
};

type Lang = "en" | "ne";

/** Ordered header patterns (match first occurrence in remainder) */
const BLOCKS: Record<
  Lang,
  { gist: string; story: string; steps: string; daily: string }
> = {
  en: {
    gist: "The gist:",
    story: "Someone else's story:",
    steps: "Steps:",
    daily: "Your daily habit:",
  },
  ne: {
    gist: "सार:",
    story: "अरू कोहीको कथा:",
    steps: "के गर्ने:",
    daily: "दैनिक बानी:",
  },
};

function extractBetween(full: string, startLabel: string, endLabel: string | null): string {
  const i = full.indexOf(startLabel);
  if (i < 0) return "";
  const from = i + startLabel.length;
  const rest = full.slice(from);
  if (!endLabel) return rest.trim();
  const j = rest.indexOf(endLabel);
  if (j < 0) return rest.trim();
  return rest.slice(0, j).trim();
}

function parseWithLabels(full: string, L: "en" | "ne"): ParsedAdvice | null {
  const b = BLOCKS[L];
  if (!full.includes(b.gist)) return null;
  const gist = extractBetween(full, b.gist, b.story);
  const story = extractBetween(full, b.story, b.steps);
  const steps = extractBetween(full, b.steps, b.daily);
  const daily = extractBetween(full, b.daily, null);
  if (!gist && !story && !steps && !daily) return null;
  return { gist, story, steps, daily };
}

export function parseStructuredAdvice(text: string, lang: Lang): ParsedAdvice | null {
  const t = text.trim();
  if (!t) return null;
  if (lang === "ne") {
    const ne = parseWithLabels(t, "ne");
    if (ne && (ne.gist || ne.story || ne.steps || ne.daily)) return ne;
    const enInNe = parseWithLabels(t, "en");
    if (enInNe && (enInNe.gist || enInNe.story || enInNe.steps || enInNe.daily)) return enInNe;
  }
  const en = parseWithLabels(t, "en");
  if (en && (en.gist || en.story || en.steps || en.daily)) return en;
  return null;
}

export function parseStepsToLines(stepsBlock: string): string[] {
  return stepsBlock
    .split(/\n/)
    .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}
