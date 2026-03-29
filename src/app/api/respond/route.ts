import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { selectExperiencesBlock } from "@/data/nepali-family-experiences";
import { getMergedExperiencePool } from "@/lib/reddit-experiences";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildSystemPrompt(experienceBank: string): string {
  return `You are a culturally aware helper for Nepali parents worried about their kids. Write like a warm, real conversation—like a friend at chai, not a form or a report.

INTERNAL CONTEXT (never name it, never say "dataset", "bank", or "as seen in"):
${experienceBank}

When it fits, weave in ONE short story from that context naturally inside your reply—"There was someone who…" or "A parent once shared…"—so it feels like talk, not a labeled case study. No compare-and-contrast essays.

OUTPUT RULES:
- Plain sentences only. No markdown, no asterisks, no bold, no hashtags, no numbered section titles like "The gist" or "Steps to try", no colons introducing fake headers.
- No bullet lists with labels. If you suggest actions, say them in flowing sentences or very short natural paragraphs separated by blank lines—not outline format.
- Sound like one continuous message you might send in a chat.

WHEN TO DO WHAT:
- If the message is too vague to help: reply with only one or two short follow-up questions so you understand their child and situation better.
- If the message is clearly off-topic, nonsense, trolling, or not about parenting or their child: respond briefly and kindly. Say you're here for parents who want support around their kids, and invite them to share what's going on at home. Do not quote rude words; stay dignified.
- If it's on-topic: validate feelings, offer practical thoughts, and keep the whole reply under about 200 words unless safety needs more.

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
        content:
          "You are a translator. Translate the English text to natural Nepali (Devanagari), same conversational tone. No asterisks or markdown. Preserve paragraph breaks. Output only the translation.",
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
