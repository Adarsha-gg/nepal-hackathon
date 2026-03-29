import type { FamilyExperience } from "@/data/nepali-family-experiences";
import { FAMILY_EXPERIENCES } from "@/data/nepali-family-experiences";
import prefilled from "@/data/prefilled-real-experiences.json";

type PrefillRow = {
  id: string;
  source: string;
  pattern: string;
  keywords: string[];
};

/**
 * Real public threads from r/Nepal (summarized / anonymized excerpts) + theme notes.
 * Prefilled JSON is the primary “database” so advice is grounded without live Reddit calls.
 */
function prefilledToPool(): FamilyExperience[] {
  const rows = prefilled as PrefillRow[];
  return rows.map((r) => ({
    id: r.id,
    keywords: r.keywords,
    pattern: `[${r.source} — real community thread] ${r.pattern}`,
  }));
}

/** Merged pool: prefilled real experiences first, then static theme cards as backup. */
export async function getMergedExperiencePool(): Promise<FamilyExperience[]> {
  return [...prefilledToPool(), ...FAMILY_EXPERIENCES];
}
