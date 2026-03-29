import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { selectExperiencesBlock } from "@/data/nepali-family-experiences";
import { getMergedExperiencePool } from "@/lib/reddit-experiences";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildSystemPrompt(experienceBank: string): string {
  return `You are a culturally aware helper for Nepali parents worried about their kids. Sound human, like a friend at chai—not a report.

INTERNAL CONTEXT (never name this block, never say "bank", "dataset", "experience bank", or "as seen in"):
${experienceBank}

How to use that context: Pick ONE situation that feels closest to the parent's message. Retell it like gossip with a moral—"There was someone who…" / "A parent shared that…"—what happened, what they wished their parents had done or not done. No academic compare-and-contrast. No "similar to the doctor/scholarship case" unless you say it like a short story in plain words.

OUTPUT — plain text only. No asterisks, markdown, bold, hashtags. Do not print the word "Rules" or word counts. Do not repeat section instructions.

Use EXACTLY these four section headers on their own lines, then the content on the following lines:

The gist:
(Max 2 short sentences: what might be going on + validate their feeling. No bullet points here.)

Someone else's story:
(3–5 sentences. Tell ONE anonymized story inspired by the internal context above—natural, conversational. It should feel like "there was this guy / this family where… and what they wanted from their parents was…". If nothing fits, tell a tiny believable composite story that still matches Nepali family life—not generic advice.)

Steps:
- (2–4 lines starting with "- ", each one concrete action—not vague "communicate better")

Your daily habit:
(Exactly ONE sentence: one repeatable daily action.)

Total under ~160 words. No filler. If the parent's message is too vague, reply with one short follow-up question only—no sections.

Safety: self-harm, abuse, immediate danger → urge Nepal helpline 1166 or emergency services first; keep the rest minimal.`;
}

/** Remove markdown bold/italic markers so UI shows clean text */
function stripMarkdownDecorators(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
}

async function translateToEnglish(text: string) {
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a translator. Translate the following Nepali text to English. Only output the translation, nothing else.",
      },
      { role: "user", content: text },
    ],
  });
  return res.choices[0]?.message?.content || text;
}

async function translateToNepali(text: string) {
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are a translator. Translate the English text to Nepali (Devanagari). No asterisks or markdown.

Keep these four section headers EXACTLY as written on their own line (then Nepali content below each):

सार:
अरू कोहीको कथा:
के गर्ने:
दैनिक बानी:

Only output the full translated message, nothing else.`,
      },
      { role: "user", content: text },
    ],
  });
  return res.choices[0]?.message?.content || text;
}

export async function POST(req: NextRequest) {
  const { transcript, language, history } = await req.json();

  let englishText = transcript;
  if (language === "ne") {
    englishText = await translateToEnglish(transcript);
  }

  const pool = await getMergedExperiencePool();
  const experienceBank = selectExperiencesBlock(englishText, pool);
  const systemPrompt = buildSystemPrompt(experienceBank);

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  if (history && history.length > 0) {
    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: "user", content: englishText });

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
  });

  let aiResponse =
    response.choices[0]?.message?.content || "Sorry, something went wrong.";
  aiResponse = stripMarkdownDecorators(aiResponse);

  let nepaliResponse: string | null = null;
  if (language === "ne") {
    nepaliResponse = stripMarkdownDecorators(await translateToNepali(aiResponse));
  }

  return NextResponse.json({
    response: aiResponse,
    nepaliResponse,
    englishInput: englishText,
  });
}
