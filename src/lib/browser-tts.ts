/**
 * Web Speech API helpers. Nepali (ne-NP) voices are rare; Hindi (hi) reads
 * Devanagari script and is the usual workable fallback on desktop browsers.
 */

export function ensureVoicesLoaded(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const syn = window.speechSynthesis;
  if (syn.getVoices().length > 0) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      syn.removeEventListener("voiceschanged", onVoices);
      resolve();
    };
    const onVoices = () => {
      if (syn.getVoices().length > 0) finish();
    };
    syn.addEventListener("voiceschanged", onVoices);
    syn.getVoices();
    window.setTimeout(finish, 1200);
  });
}

function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find((v) => v.lang.startsWith("en-US")) ||
    voices.find((v) => v.lang.startsWith("en-GB")) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    null
  );
}

/** Nepali first; then Hindi/Marathi (Devanagari); many systems have no ne-NP at all. */
export function pickVoiceForLanguage(
  voices: SpeechSynthesisVoice[],
  lang: "ne" | "en"
): SpeechSynthesisVoice | null {
  if (lang === "en") return pickEnglishVoice(voices);

  const ne =
    voices.find((v) => /^ne(-|$)/i.test(v.lang)) || voices.find((v) => /nepal/i.test(v.name));
  if (ne) return ne;

  const hi =
    voices.find((v) => v.lang.startsWith("hi-")) ||
    voices.find((v) => /hindi|हिन्दी/i.test(v.name));
  if (hi) return hi;

  const mr =
    voices.find((v) => v.lang.startsWith("mr-")) || voices.find((v) => /marathi/i.test(v.name));
  if (mr) return mr;

  return null;
}

export function speakBrowserTts(
  text: string,
  lang: "ne" | "en",
  onEnd: () => void,
  onError: () => void
): void {
  if (typeof window === "undefined") return;
  const syn = window.speechSynthesis;
  const voices = syn.getVoices();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.92;

  const voice = pickVoiceForLanguage(voices, lang);
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  } else if (lang === "ne") {
    u.lang = "hi-IN";
  } else {
    u.lang = "en-US";
  }

  u.onend = onEnd;
  u.onerror = onError;
  syn.speak(u);
}
