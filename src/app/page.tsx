"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseStepsToLines, parseStructuredAdvice } from "@/lib/parse-advice";

interface Message {
  role: "user" | "assistant";
  content: string;
  display: string;
}

type PageId = "home" | "ask" | "crisis";

function StructuredAdviceReply({
  display,
  content,
  language,
  t,
}: {
  display: string;
  content: string;
  language: "ne" | "en";
  t: (en: string, ne: string) => string;
}) {
  const parsed =
    parseStructuredAdvice(display, language) || parseStructuredAdvice(content, "en");
  if (!parsed) {
    return (
      <div className="resp-understanding">
        <p style={{ whiteSpace: "pre-wrap" }}>{display}</p>
      </div>
    );
  }
  const stepLines = parseStepsToLines(parsed.steps);
  return (
    <div className="advice-structured">
      {parsed.gist ? (
        <div className="advice-gist">
          <div className="resp-label" style={{ marginBottom: 8 }}>
            <span className="icon">
              <svg viewBox="0 0 24 24" style={{ stroke: "var(--indigo)" }}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </span>
            {t("The gist", "सार")}
          </div>
          <div className="resp-understanding advice-body">
            <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{parsed.gist}</p>
          </div>
        </div>
      ) : null}
      {parsed.story ? (
        <div className="advice-story-box">
          <div className="advice-story-kicker">{t("Someone else's story", "अरू कोहीको कथा")}</div>
          <div className="advice-story-body" style={{ whiteSpace: "pre-wrap" }}>
            {parsed.story}
          </div>
        </div>
      ) : null}
      {stepLines.length > 0 ? (
        <div className="advice-gist">
          <div className="resp-label" style={{ marginBottom: 8 }}>
            <span className="icon">
              <svg viewBox="0 0 24 24" style={{ stroke: "var(--sage)" }}>
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </span>
            {t("Steps to try", "के गर्ने")}
          </div>
          <ul className="advice-steps-list">
            {stepLines.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {parsed.daily ? (
        <div className="advice-daily-box">
          <div className="advice-daily-kicker">{t("Your daily habit", "दैनिक बानी")}</div>
          <div className="advice-daily-body">{parsed.daily}</div>
        </div>
      ) : null}
    </div>
  );
}

const TOPICS = [
  { key: "study", en: "Study", ne: "पढाइ" },
  { key: "anger", en: "Anger", ne: "रिसाहा" },
  { key: "phone", en: "Phone use", ne: "फोन लत" },
  { key: "friends", en: "Friends", ne: "साथी" },
  { key: "interest", en: "Interests", ne: "रुचि" },
  { key: "confidence", en: "Confidence", ne: "आत्मविश्वास" },
] as const;

const TOPIC_SNIPPETS: Record<string, { en: string; ne: string }> = {
  study: { en: "My child won't focus on studies. ", ne: "मेरो बच्चा पढाइमा ध्यान दिँदैन। " },
  anger: { en: "My child gets angry easily. ", ne: "मेरो बच्चा धेरै रिसाउँछ। " },
  phone: { en: "My child spends too much time on the phone. ", ne: "मेरो बच्चा फोनमा धेरै समय बिताउँछ। " },
  friends: { en: "My child spends too much time with friends. ", ne: "मेरो बच्चा साथीहरूसँग धेरै समय बिताउँछ। " },
  interest: { en: "My child has different interests than I expected. ", ne: "मेरो बच्चाको रुचि अलग छ। " },
  confidence: { en: "My child lacks confidence. ", ne: "मेरो बच्चामा आत्मविश्वास कम छ। " },
};

const LS_LANG_OK = "mero-bachcha-lang-ok";

export default function Home() {
  const [view, setView] = useState<PageId>("home");
  const [language, setLanguage] = useState<"ne" | "en">("ne");
  const [langOverlay, setLangOverlay] = useState(true);
  const [overlayPick, setOverlayPick] = useState<"en" | "ne">("ne");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [input, setInput] = useState("");
  const [inputShake, setInputShake] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set());
  const [saveFlash, setSaveFlash] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const responseRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(LS_LANG_OK)) {
      setLangOverlay(false);
    }
  }, []);

  useEffect(() => {
    if (messages.length && responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messages.length]);

  const t = useCallback((en: string, ne: string) => (language === "ne" ? ne : en), [language]);

  const fetchAdvice = useCallback(
    async (text: string, historySnapshot: { role: "user" | "assistant"; content: string }[]) => {
      const respondRes = await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, language, history: historySnapshot }),
      });
      if (!respondRes.ok) {
        const err = await respondRes.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Request failed");
      }
      return respondRes.json() as Promise<{ response: string; nepaliResponse?: string | null }>;
    },
    [language]
  );

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setStatus(t("Transcribing…", "ट्रान्सक्राइब हुँदै…"));
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("language", language);
    const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: formData });
    const transcribeData = await transcribeRes.json();
    if (!transcribeRes.ok) {
      setStatus(t("Couldn't transcribe. Try again.", "ट्रान्सक्रिप्ट हुन सकेन। फेरि प्रयास गर्नुहोस्।"));
      setIsProcessing(false);
      return;
    }
    const text = (transcribeData as { text?: string }).text?.trim() || "";
    if (!text) {
      setStatus(t("Couldn't catch that. Try again.", "बुझ्न सकिएन। फेरि प्रयास गर्नुहोस्।"));
      setIsProcessing(false);
      return;
    }
    setInput(text);
    const historySnapshot = messagesRef.current.map((m) => ({ role: m.role, content: m.content }));
    const userMessage: Message = { role: "user", content: text, display: text };
    setMessages((prev) => [...prev, userMessage]);
    setStatus(t("Thinking…", "सोच्दै…"));
    try {
      const respondData = await fetchAdvice(text, historySnapshot);
      const assistantMessage: Message = {
        role: "assistant",
        content: respondData.response,
        display: respondData.nepaliResponse || respondData.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStatus("");
    } catch {
      setMessages((prev) => prev.slice(0, -1));
      setStatus(t("Something went wrong. Try again.", "केही गडबड भयो। फेरि प्रयास गर्नुहोस्।"));
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      await processAudio(new Blob(chunksRef.current, { type: "audio/webm" }));
    };
    mediaRecorder.start();
    setIsRecording(true);
    setStatus(t("Listening… tap stop when done.", "सुन्दै… सकिएपछि रोक्नुहोस्।"));
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const submitText = async () => {
    const text = input.trim();
    if (!text || isProcessing) {
      if (!text.trim()) {
        setInputShake(true);
        setTimeout(() => setInputShake(false), 1500);
      }
      return;
    }
    setIsProcessing(true);
    setStatus(t("Thinking…", "सोच्दै…"));
    const historySnapshot = messagesRef.current.map((m) => ({ role: m.role, content: m.content }));
    const userMessage: Message = { role: "user", content: text, display: text };
    setMessages((prev) => [...prev, userMessage]);
    try {
      const respondData = await fetchAdvice(text, historySnapshot);
      const assistantMessage: Message = {
        role: "assistant",
        content: respondData.response,
        display: respondData.nepaliResponse || respondData.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setInput("");
      setActiveChips(new Set());
      setStatus("");
    } catch {
      setMessages((prev) => prev.slice(0, -1));
      setStatus(t("Something went wrong. Try again.", "केही गडबड भयो। फेरि प्रयास गर्नुहोस्।"));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAsk = () => {
    setMessages([]);
    setInput("");
    setActiveChips(new Set());
    setStatus("");
  };

  const toggleChip = (key: string) => {
    setActiveChips((prev) => {
      const next = new Set(prev);
      const adding = !next.has(key);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      if (adding) {
        const snippet = TOPIC_SNIPPETS[key];
        if (snippet) {
          const line = language === "ne" ? snippet.ne : snippet.en;
          queueMicrotask(() => setInput((v) => (v.includes(line.trim()) ? v : v + line)));
        }
      }
      return next;
    });
  };

  const confirmLangOverlay = () => {
    setLanguage(overlayPick);
    localStorage.setItem(LS_LANG_OK, "1");
    setLangOverlay(false);
  };

  const copyLatestAdvice = async () => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last) return;
    try {
      await navigator.clipboard.writeText(last.display);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const showPage = (id: PageId) => {
    setView(id);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  const langClass = language === "ne" ? "lang-ne" : "lang-en";
  const micClass = [
    "voice-mic-btn",
    isRecording ? "rec" : "",
    isProcessing && !isRecording ? "busy" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const voiceHint = isRecording
    ? status ||
      t("Listening… tap the mic again when you’re done.", "सुन्दै… सकिएपछि माइक फेरि थिच्नुहोस्।")
    : isProcessing && !isRecording
      ? status || t("Working…", "काम गर्दै…")
      : status
        ? status
        : t("Tap to speak — Nepali or English.", "बोल्न थिच्नुहोस् — नेपाली वा अङ्ग्रेजी।");

  return (
    <div className={`mero-app ${langClass}`}>
      {/* Language picker (first visit) */}
      <div className={langOverlay ? "lang-overlay" : "lang-overlay hidden"}>
        <div className="lang-picker">
          <div className="lp-logo">
            <svg viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <div className="lp-name">Mero Bachcha</div>
          <div className="lp-ne">मेरो बच्चा</div>
          <div className="lp-tagline">
            A safe space for Nepali parents to understand
            <br />
            and support their children.
          </div>
          <div className="lp-prompt">Choose your language</div>
          <div className="lp-cards">
            <button
              type="button"
              className={`lp-card${overlayPick === "en" ? " selected" : ""}`}
              onClick={() => setOverlayPick("en")}
            >
              <div className="lp-flag">EN</div>
              <div className="lp-lang-name">English</div>
              <div className="lp-lang-sub">Full support</div>
              <div className="lp-tick">{overlayPick === "en" ? "✓" : ""}</div>
            </button>
            <button
              type="button"
              className={`lp-card${overlayPick === "ne" ? " selected" : ""}`}
              onClick={() => setOverlayPick("ne")}
            >
              <div className="lp-flag">ने</div>
              <div className="lp-lang-name">नेपाली</div>
              <div className="lp-lang-sub">पूर्ण सहयोग</div>
              <div className="lp-tick">{overlayPick === "ne" ? "✓" : ""}</div>
            </button>
          </div>
          <div className="lp-note">You can change language anytime from the navigation bar.</div>
          <button type="button" className="lp-btn" onClick={confirmLangOverlay}>
            {overlayPick === "ne" ? "Continue — जारी राख्नुहोस्" : "Continue"}
          </button>
        </div>
      </div>

      <nav>
        <div className="nav-inner">
          <button type="button" className="nav-logo" onClick={() => showPage("home")}>
            <div className="nav-logo-icon">
              <svg viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div className="nav-logo-text">Mero Bachcha</div>
          </button>
          <div className="nav-links">
            <button type="button" onClick={() => showPage("home")}>
              {t("Home", "गृहपृष्ठ")}
            </button>
            <button type="button" onClick={() => showPage("ask")}>
              {t("Ask", "सोध्नुहोस्")}
            </button>
            <button type="button" className="crisis-link" onClick={() => showPage("crisis")}>
              {t("Crisis help", "तत्काल सहायता")}
            </button>
          </div>
          <div className="nav-right">
            <div className="lang-toggle">
              <button
                type="button"
                className={`lang-btn${language === "en" ? " active" : ""}`}
                onClick={() => setLanguage("en")}
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-btn${language === "ne" ? " active" : ""}`}
                onClick={() => setLanguage("ne")}
              >
                ने
              </button>
            </div>
            <button type="button" className="nav-cta" onClick={() => showPage("ask")}>
              {t("Ask now", "सोध्नुहोस्")}
            </button>
          </div>
        </div>
      </nav>

      <div className="mero-main">
        {/* HOME */}
        <div className={`page${view === "home" ? " active" : ""}`}>
          <div className="hero">
            <div>
              <div className="hero-badge">
                <span className="icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                {t("Free · Private · For Nepali families", "निःशुल्क · गोपनीय · नेपाली परिवारका लागि")}
              </div>
              <div className="hero-title">{t("Understand your child, gently.", "आफ्नो बच्चालाई बुझ्नुहोस्।")}</div>
              <p className="hero-desc">
                {t(
                  "A culturally-aware space where Nepali parents can ask questions about their children and receive empathetic, thoughtful guidance.",
                  "नेपाली अभिभावकहरूका लागि एक सुरक्षित ठाउँ — जहाँ तपाईं आफ्नो बच्चाबारे प्रश्न सोध्न र सहानुभूतिपूर्ण सल्लाह पाउन सक्नुहुन्छ।"
                )}
              </p>
              <div className="hero-btns">
                <button type="button" className="btn-primary" onClick={() => showPage("ask")}>
                  {t("Ask a question", "प्रश्न सोध्नुहोस्")}
                </button>
                <button type="button" className="btn-outline" onClick={() => showPage("crisis")}>
                  {t("Get urgent help", "तत्काल सहायता")}
                </button>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-card">
                <div className="hv-question">
                  <div className="hv-question-label">
                    <span className="icon">
                      <svg viewBox="0 0 24 24">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                    {t("Parent asks", "अभिभावकको प्रश्न")}
                  </div>
                  <div className="hv-question-text">
                    {t(
                      '"My son doesn\'t focus on studies, only on sport..."',
                      '"मेरो छोरा पढाइमा ध्यान दिँदैन, खेलमा मात्र छ..."'
                    )}
                  </div>
                </div>
                <div className="hv-answer">
                  <div className="hv-answer-label">
                    <span className="icon">
                      <svg viewBox="0 0 24 24">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </span>
                    {t("Gentle advice", "सहज सल्लाह")}
                  </div>
                  <div className="hv-answer-text">
                    {t(
                      "He's not avoiding you — he needs space to grow. Sport builds discipline, teamwork, and resilience. Listen before advising.",
                      "उनको खेलमा रुचि छ — सम्झाउनुको सट्टा सुन्नुहोस्। विश्वास बढाउनुहोस्।"
                    )}
                  </div>
                </div>
                <div className="hv-tip">
                  <div className="hv-tip-label">
                    <span className="icon">
                      <svg viewBox="0 0 24 24">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </span>
                    {t("Try this", "यो गर्नुहोस्")}
                  </div>
                  <div className="hv-tip-text">
                    {t(
                      "Ask about his sport without criticism. This builds trust for study conversations later.",
                      "उनको खेलबारे सोध्नुहोस् — आलोचना नगरी। यसले विश्वास बढाउँछ।"
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="how-section cross-stitch">
            <div className="how-inner">
              <div className="section-tag">{t("How it works", "कसरी काम गर्छ")}</div>
              <div className="section-title">{t("Simple. Private. Yours.", "सरल। गोपनीय। तपाईंको।")}</div>
              <div className="section-sub">
                {t(
                  "No jargon, no judgment — thoughtful guidance tailored to your family.",
                  "कुनै जटिलता छैन — तपाईंको परिवारअनुसार मार्गदर्शन।"
                )}
              </div>
              <div className="steps-grid">
                <div className="step-card">
                  <div className="step-num">1</div>
                  <div className="step-icon" style={{ background: "var(--terracotta-light)" }}>
                    <svg viewBox="0 0 24 24" style={{ stroke: "var(--terracotta)" }}>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                  <div className="step-title">{t("Speak or type", "बोल्नुहोस् वा लेख्नुहोस्")}</div>
                  <div className="step-desc">
                    {t(
                      "Use your voice (tap the mic) or type — Nepali or English.",
                      "आफ्नो आवाज (माइक) वा टाइप प्रयोग गर्नुहोस् — नेपाली वा अङ्ग्रेजी।"
                    )}
                  </div>
                </div>
                <div className="step-card">
                  <div className="step-num">2</div>
                  <div className="step-icon" style={{ background: "var(--indigo-light)" }}>
                    <svg viewBox="0 0 24 24" style={{ stroke: "var(--indigo)" }}>
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </div>
                  <div className="step-title">{t("Get gentle advice", "सल्लाह पाउनुहोस्")}</div>
                  <div className="step-desc">
                    {t(
                      "Receive culturally-aware guidance drawn from research and experts.",
                      "अनुसन्धान र विशेषज्ञबाट सांस्कृतिक मार्गदर्शन पाउनुहोस्।"
                    )}
                  </div>
                </div>
                <div className="step-card">
                  <div className="step-num">3</div>
                  <div className="step-icon" style={{ background: "var(--sage-light)" }}>
                    <svg viewBox="0 0 24 24" style={{ stroke: "var(--sage)" }}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div className="step-title">{t("Stay safe always", "सधैं सुरक्षित")}</div>
                  <div className="step-desc">
                    {t(
                      "Your conversations are private. Crisis support is always one tap away.",
                      "तपाईंको कुराकानी गोपनीय छ। तत्काल सहायता सधैं उपलब्ध।"
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="trust-section">
            <div className="trust-grid">
              <div className="trust-card">
                <div className="trust-icon" style={{ background: "var(--indigo-light)" }}>
                  <svg viewBox="0 0 24 24" style={{ stroke: "var(--indigo)" }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div className="trust-title">{t("Private & secure", "गोपनीय र सुरक्षित")}</div>
                <div className="trust-desc">
                  {t(
                    "No data stored. No account required. Your family's privacy comes first.",
                    "कुनै डेटा भण्डारण छैन। खाता आवश्यक छैन।"
                  )}
                </div>
              </div>
              <div className="trust-card">
                <div className="trust-icon" style={{ background: "var(--sage-light)" }}>
                  <svg viewBox="0 0 24 24" style={{ stroke: "var(--sage)" }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="trust-title">{t("Culturally aware", "सांस्कृतिक रूपमा सचेत")}</div>
                <div className="trust-desc">
                  {t(
                    "Advice respects Nepali family values, traditions, and parenting norms.",
                    "सल्लाह नेपाली पारिवारिक मूल्य र परम्परालाई सम्मान गर्छ।"
                  )}
                </div>
              </div>
              <div className="trust-card">
                <div className="trust-icon" style={{ background: "var(--terracotta-light)" }}>
                  <svg viewBox="0 0 24 24" style={{ stroke: "var(--terracotta)" }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </div>
                <div className="trust-title">{t("Not a replacement", "विकल्प होइन")}</div>
                <div className="trust-desc">
                  {t(
                    "For serious concerns, always consult a professional. Crisis help is built in.",
                    "गम्भीर चिन्ताका लागि पेशेवरसँग परामर्श गर्नुहोस्।"
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="crisis-bar">
            <div className="crisis-bar-inner">
              <div className="crisis-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="crisis-text">
                {language === "en" ? (
                  <>
                    If your child is in danger — <strong>Nepal Helpline: 1166</strong>
                  </>
                ) : (
                  <>
                    यदि तपाईंको बच्चा खतरामा छ — <strong>नेपाल हेल्पलाइन: ११६६</strong>
                  </>
                )}
              </div>
              <button type="button" className="crisis-btn-bar" onClick={() => showPage("crisis")}>
                {t("Get help", "सहायता")}
              </button>
            </div>
          </div>
        </div>

        {/* ASK */}
        <div className={`page${view === "ask" ? " active" : ""}`}>
          <div className="page-header">
            <div className="page-header-inner">
              <div className="ph-title">{t("Ask a question", "प्रश्न सोध्नुहोस्")}</div>
              <div className="ph-sub">
                {t(
                  "Start with your voice (mic) or type below — Nepali or English.",
                  "पहिले आवाज (माइक) वा तल टाइप — नेपाली वा अङ्ग्रेजी।"
                )}
              </div>
            </div>
          </div>
          <div className="ask-layout">
            <div className="ask-main">
              <div className="voice-primary">
                <div className="ask-label" style={{ marginBottom: 10, textAlign: "center" }}>
                  {t("Speak your question", "आफ्नो प्रश्न बोल्नुहोस्")}
                </div>
                <button
                  type="button"
                  className={micClass}
                  disabled={isProcessing}
                  onClick={isRecording ? stopRecording : startRecording}
                  aria-label={isRecording ? t("Stop", "रोक्नुहोस्") : t("Speak", "बोल्नुहोस्")}
                >
                  {isProcessing && !isRecording ? "…" : isRecording ? "⏹" : "🎤"}
                </button>
                <p className="voice-status">{voiceHint}</p>
              </div>

              <div className="ask-voice-divider" />

              <div>
                <div className="ask-label" style={{ marginBottom: 8 }}>
                  {t("What's on your mind?", "तपाईंको मनमा के छ?")}
                </div>
                <textarea
                  className="text-input-area"
                  rows={5}
                  value={input}
                  disabled={isProcessing}
                  onChange={(e) => setInput(e.target.value)}
                  style={
                    inputShake
                      ? { borderColor: "var(--red)", borderStyle: "solid" }
                      : undefined
                  }
                  placeholder={
                    language === "ne" ? "यहाँ आफ्नो प्रश्न लेख्नुहोस्..." : "Type your question here..."
                  }
                />
              </div>
              <div>
                <div className="ask-label" style={{ marginBottom: 8 }}>
                  {t("Or pick a topic", "वा विषय छान्नुहोस्")}
                </div>
                <div className="topic-chips">
                  {TOPICS.map(({ key, en, ne }) => (
                    <button
                      key={key}
                      type="button"
                      className={`chip${activeChips.has(key) ? " active" : ""}`}
                      onClick={() => toggleChip(key)}
                    >
                      {t(en, ne)}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="submit-btn"
                id="submit-btn"
                disabled={isProcessing || !input.trim()}
                onClick={submitText}
              >
                <span className="icon">
                  <svg viewBox="0 0 24 24">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </span>
                {isProcessing && !isRecording
                  ? t("Thinking…", "सोच्दै…")
                  : t("Get advice", "सल्लाह पाउनुहोस्")}
              </button>

              <div ref={responseRef} className={`response-area${messages.length > 0 ? " open" : ""}`}>
                {messages.map((msg, i) =>
                  msg.role === "user" ? (
                    <div key={i} className="resp-section">
                      <div className="resp-label">
                        <span className="icon">
                          <svg viewBox="0 0 24 24" style={{ stroke: "var(--terracotta)" }}>
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </span>
                        {t("You", "तपाईं")}
                      </div>
                      <div className="resp-understanding" style={{ borderLeftColor: "var(--terracotta)" }}>
                        <p style={{ whiteSpace: "pre-wrap" }}>{msg.display}</p>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="resp-section">
                      <StructuredAdviceReply
                        display={msg.display}
                        content={msg.content}
                        language={language}
                        t={t}
                      />
                    </div>
                  )
                )}
                {messages.length > 0 && (
                  <div className="resp-actions">
                    <button
                      type="button"
                      className="save-btn"
                      onClick={copyLatestAdvice}
                      style={saveFlash ? { background: "var(--sage-dark)" } : undefined}
                    >
                      {saveFlash ? "✓ " : ""}
                      {saveFlash
                        ? t("Saved!", "सुरक्षित!")
                        : t("Save advice", "सुरक्षित गर्नुहोस्")}
                    </button>
                    <button type="button" className="again-btn" onClick={resetAsk}>
                      {t("Ask again", "फेरि सोध्नुहोस्")}
                    </button>
                  </div>
                )}
              </div>

              <div className="ask-info">
                <div className="ask-info-title">
                  <span className="icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </span>
                  {t("Your privacy matters", "तपाईंको गोपनीयता महत्त्वपूर्ण छ")}
                </div>
                <div className="ask-info-text">
                  {t(
                    "This is not a substitute for professional help. If your child is in danger, please call the Nepal Helpline at 1166 immediately.",
                    "यो पेशेवर सहायताको विकल्प होइन। यदि तपाईंको बच्चा खतरामा छ भने, कृपया तुरुन्तै नेपाल हेल्पलाइन ११६६ मा फोन गर्नुहोस्।"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CRISIS */}
        <div className={`page${view === "crisis" ? " active" : ""}`}>
          <div
            className="page-header"
            style={{ background: "var(--red-light)", borderBottom: "2px dashed var(--red-border)" }}
          >
            <div className="page-header-inner">
              <div className="ph-title" style={{ color: "#4A1515" }}>
                {t("Urgent help", "तत्काल सहायता")}
              </div>
              <div className="ph-sub" style={{ color: "#7A2E2E" }}>
                {t("Free, confidential support — available right now", "निःशुल्क, गोपनीय सहायता — अहिले उपलब्ध")}
              </div>
            </div>
          </div>
          <div className="crisis-layout">
            <div className="crisis-alert-box">
              <div className="crisis-alert-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <div>
                <div className="crisis-alert-title">{t("You are not alone.", "तपाईं एक्लो हुनुहुन्न।")}</div>
                <div className="crisis-alert-desc">
                  {t(
                    "If your child is in danger or you are struggling, these resources are free and confidential. You do not need to have all the answers right now.",
                    "यदि तपाईंको बच्चा खतरामा छ वा तपाईं कठिनाइमा हुनुहुन्छ भने, यी सेवाहरू निःशुल्क र गोपनीय छन्।"
                  )}
                </div>
              </div>
            </div>

            <a className="crisis-action" href="tel:1166" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="ca-icon" style={{ background: "var(--red-light)" }}>
                <svg viewBox="0 0 24 24" style={{ stroke: "var(--red)" }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <div className="ca-title">
                  {t("Nepal Mental Health Helpline — 1166", "नेपाल मानसिक स्वास्थ्य हेल्पलाइन — ११६६")}
                </div>
                <div className="ca-sub">{t("Free · 24/7 · Confidential", "निःशुल्क · दिनरात · गोपनीय")}</div>
              </div>
              <div className="ca-arrow">
                <svg viewBox="0 0 24 24">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </a>

            <div className="crisis-action">
              <div className="ca-icon" style={{ background: "var(--indigo-light)" }}>
                <svg viewBox="0 0 24 24" style={{ stroke: "var(--indigo)" }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <div className="ca-title">{t("Chat with a counsellor", "परामर्शदातासँग च्याट गर्नुहोस्")}</div>
                <div className="ca-sub">{t("Online · Free · Available now", "अनलाइन · निःशुल्क · अहिले उपलब्ध")}</div>
              </div>
              <div className="ca-arrow">
                <svg viewBox="0 0 24 24">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>

            <div className="crisis-action">
              <div className="ca-icon" style={{ background: "var(--sage-light)" }}>
                <svg viewBox="0 0 24 24" style={{ stroke: "var(--sage)" }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <div className="ca-title">{t("Find nearest support centre", "नजिकको सहायता केन्द्र खोज्नुहोस्")}</div>
                <div className="ca-sub">{t("Across Nepal · Walk-in welcome", "नेपालभर · सोझै आउन सकिन्छ")}</div>
              </div>
              <div className="ca-arrow">
                <svg viewBox="0 0 24 24">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>

            <div className="crisis-divider">
              <div className="crisis-divider-line" />
              <span className="crisis-divider-text">{t("or", "वा")}</span>
              <div className="crisis-divider-line" />
            </div>

            <button type="button" className="btn-crisis" onClick={() => showPage("ask")}>
              {t("Talk to Mero Bachcha now", "अहिले Mero Bachcha सँग कुरा गर्नुहोस्")}
            </button>
          </div>
        </div>
      </div>

      <footer>
        <div className="footer-inner">
          <div>
            <div className="footer-logo">Mero Bachcha</div>
            <div className="footer-note">
              {t(
                "Not a substitute for professional mental health services.",
                "यो पेशेवर मानसिक स्वास्थ्य सेवाको विकल्प होइन।"
              )}
            </div>
          </div>
          <div className="footer-links">
            <span style={{ opacity: 0.6 }}>{t("Privacy", "गोपनीयता")}</span>
            <span style={{ opacity: 0.6 }}>{t("About", "हाम्रोबारे")}</span>
            <button type="button" onClick={() => showPage("crisis")}>
              {t("Crisis help", "तत्काल सहायता")}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
