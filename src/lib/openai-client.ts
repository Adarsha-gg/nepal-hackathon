import OpenAI from "openai";

/** Default: fast, good quality for hackathon demos */
export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

export function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey: key });
}
