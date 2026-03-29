import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai-client";

export async function POST(req: NextRequest) {
  try {
    const { text } = (await req.json()) as { text?: string };
    if (!text || text.length > 4000) {
      return NextResponse.json({ error: "text required (max 4000 chars)" }, { status: 400 });
    }

    const openai = getOpenAI();
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "onyx",
      input: text,
    });

    return new NextResponse(mp3.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "TTS failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
