/**
 * Anonymized patterns distilled from themes common in Nepali / diaspora online
 * discussions (e.g. Reddit r/Nepal, parenting threads, mental-health subs).
 * Used to ground model replies—not verbatim quotes.
 */
export type FamilyExperience = {
  id: string;
  keywords: string[];
  /** One or two sentences; English for the model */
  pattern: string;
};

export const FAMILY_EXPERIENCES: FamilyExperience[] = [
  {
    id: "e1",
    keywords: ["unheard", "ignore", "listen", "respect", "talk", "silent", "shut"],
    pattern:
      "Parents often say kids stopped sharing after teens; the child may feel judged when parents jump to advice instead of listening first.",
  },
  {
    id: "e2",
    keywords: ["phone", "screen", "mobile", "internet", "game", "addict"],
    pattern:
      "Many families fight about phones; kids sometimes use screens to escape academic stress or loneliness, not only 'laziness'.",
  },
  {
    id: "e3",
    keywords: ["study", "marks", "exam", "school", "college", "grade", "fail"],
    pattern:
      "High marks are tied to family honour; fear of disappointing parents can show as avoidance, anger, or lying about results.",
  },
  {
    id: "e4",
    keywords: ["abroad", "foreign", "usa", "australia", "student", "visa", "migrate"],
    pattern:
      "Diaspora parents report kids drifting culturally—arguments mix guilt ('we sacrificed') with the child's need to fit in locally.",
  },
  {
    id: "e5",
    keywords: ["depression", "anxiety", "sad", "mental", "therapy", "counsellor"],
    pattern:
      "Stigma is real: families may call clinical depression 'weakness' or 'phase', delaying help until a crisis.",
  },
  {
    id: "e6",
    keywords: ["anger", "shout", "hit", "violent", "rage"],
    pattern:
      "Repeated shouting can make children hypervigilant; they may seem 'disrespectful' when they are actually defensive.",
  },
  {
    id: "e7",
    keywords: ["cousin", "compare", "sharma", "neighbour", "relative"],
    pattern:
      "Comparing to cousins or neighbours is common; teens often read it as conditional love and withdraw.",
  },
  {
    id: "e8",
    keywords: ["grandparent", "grandma", "grandpa", "elder", "in-law"],
    pattern:
      "Three-generation homes can blur rules; kids exploit gaps when grandparents override parents.",
  },
  {
    id: "e9",
    keywords: ["girl", "daughter", "son", "gender", "marriage", "curfew"],
    pattern:
      "Stricter rules for daughters than sons breed resentment; secrecy increases when trust feels uneven.",
  },
  {
    id: "e10",
    keywords: ["friend", "peer", "boyfriend", "girlfriend", "relationship"],
    pattern:
      "Romantic friendships may be hidden; discovery often triggers shame-based punishment instead of calm safety talk.",
  },
  {
    id: "e11",
    keywords: ["work", "money", "job", "remittance", "overseas", "earn"],
    pattern:
      "Parents working abroad sometimes bond mainly through money; kids say they miss presence, not gifts.",
  },
  {
    id: "e12",
    keywords: ["eat", "food", "weight", "thin", "body"],
    pattern:
      "Comments on weight or eating are frequent; some young people hide disordered eating behind 'picky' eating.",
  },
  {
    id: "e13",
    keywords: ["sleep", "night", "tired", "wake"],
    pattern:
      "Sleep schedules clash when kids are on global time zones for study or gaming; parents see it as discipline, not fatigue.",
  },
  {
    id: "e14",
    keywords: ["lie", "lying", "hide", "secret"],
    pattern:
      "Lying about school or outings often starts when truth led to big punishment before; fear drives concealment.",
  },
  {
    id: "e15",
    keywords: ["sibling", "brother", "sister", "younger", "older"],
    pattern:
      "Favouritism—real or perceived—between siblings fuels rivalry and long-term distance from parents.",
  },
  {
    id: "e16",
    keywords: ["identity", "culture", "nepali", "language", "speak nepali"],
    pattern:
      "Kids raised abroad may reject Nepali language or rituals; parents feel rejected personally, not culturally curious.",
  },
  {
    id: "e17",
    keywords: ["suicide", "self-harm", "hurt", "die", "kill"],
    pattern:
      "Any mention of self-harm needs urgent professional and local crisis support—not only family advice.",
  },
  {
    id: "e18",
    keywords: ["confidence", "shy", "fear", "speak up", "introvert"],
    pattern:
      "Shyness is sometimes framed as rudeness in public; pressure to perform in front of relatives increases anxiety.",
  },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Pick up to 4 experiences from the pool: keyword matches first, then deterministic variety.
 * Pool should include Reddit-backed entries (real threads) when available, plus static fallback.
 */
export function selectExperiencesBlock(userMessageEn: string, pool: FamilyExperience[]): string {
  const t = userMessageEn.toLowerCase();
  const scored = pool.map((e) => ({
    e,
    s: e.keywords.reduce((acc, k) => acc + (t.includes(k.toLowerCase()) ? 1 : 0), 0),
  })).sort((a, b) => b.s - a.s);

  const picked: FamilyExperience[] = [];
  const used = new Set<string>();

  for (const row of scored) {
    if (row.s > 0 && picked.length < 4) {
      picked.push(row.e);
      used.add(row.e.id);
    }
  }

  const h = hashString(userMessageEn);
  let i = 0;
  while (picked.length < 4 && i < pool.length) {
    const e = pool[(h + i) % pool.length];
    i++;
    if (!used.has(e.id)) {
      picked.push(e);
      used.add(e.id);
    }
  }

  return picked
    .slice(0, 4)
    .map((e, idx) => `(${idx + 1}) ${e.pattern}`)
    .join("\n");
}
