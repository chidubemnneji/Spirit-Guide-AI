import type { Express, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { speechToText, synthesizeSpeech } from "./replit_integrations/audio/client";
import { requireAuth } from "./middleware/auth";

// Voice endpoints call paid audio models, so they require auth, are rate
// limited, and cap payload sizes to prevent cost abuse.
const voiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: "Too many voice requests. Please wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ~10MB of base64 audio, ~2000 chars of TTS text.
const MAX_AUDIO_BASE64 = 10 * 1024 * 1024;
const MAX_TTS_CHARS = 2000;

export function registerVoiceRoutes(app: Express) {
  app.post("/api/voice/transcribe", requireAuth, voiceLimiter, async (req: Request, res: Response) => {
    try {
      const { audio, format = "webm" } = req.body;

      if (!audio || typeof audio !== "string") {
        return res.status(400).json({ error: "No audio data provided" });
      }
      if (audio.length > MAX_AUDIO_BASE64) {
        return res.status(413).json({ error: "Audio payload too large" });
      }

      const audioBuffer = Buffer.from(audio, "base64");
      // iOS records audio/mp4 — pass as m4a which Whisper accepts
      const normalizedFormat = format === "mp4" ? "m4a" : (format as "wav" | "mp3" | "webm" | "m4a");
      const transcript = await speechToText(audioBuffer, normalizedFormat as any);

      res.json({ transcript });
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  app.post("/api/voice/speak", requireAuth, voiceLimiter, async (req: Request, res: Response) => {
    try {
      const { text, voice = "nova" } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "No text provided" });
      }
      if (text.length > MAX_TTS_CHARS) {
        return res.status(413).json({ error: "Text too long" });
      }

      const audioBuffer = await synthesizeSpeech(text, voice, "mp3");
      const audioBase64 = audioBuffer.toString("base64");

      res.json({ audio: audioBase64, format: "mp3" });
    } catch (error) {
      console.error("Text-to-speech error:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });
}
