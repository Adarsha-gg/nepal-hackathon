import { NextRequest, NextResponse } from "next/server";
import { toFile } from "openai/uploads";
import { getOpenAI } from "@/lib/openai-client";

function transcribeErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return String(e);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const language = (formData.get("language") as string) || "ne";

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    if (buffer.length < 500) {
      return NextResponse.json({ error: "Audio too short" }, { status: 400 });
    }

    const openai = getOpenAI();
    const name = audioFile.name || "recording.webm";
    const mime = audioFile.type || "application/octet-stream";

    const file = await toFile(buffer, name, { type: mime });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      ...(language === "ne" ? { language: "ne" as const } : {}),
    });

    const text = typeof transcription.text === "string" ? transcription.text.trim() : "";

    return NextResponse.json({
      text,
      language: undefined,
      segments: undefined,
    });
  } catch (e) {
    const message = transcribeErrorMessage(e);
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
