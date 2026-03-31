import type { Express, Request, Response } from "express";
import { speechToText, textToSpeech } from "./replit_integrations/audio/client";

export function registerVoiceRoutes(app: Express) {
  app.post("/api/voice/transcribe", async (req: Request, res: Response) => {
    try {
      const { audio, format = "webm" } = req.body;
      
      if (!audio) {
        return res.status(400).json({ error: "No audio data provided" });
      }

      const audioBuffer = Buffer.from(audio, "base64");
      // mp4 audio from iOS — treat as mp3 for Whisper compatibility
      const normalizedFormat = format === "mp4" ? "mp3" : format as "wav" | "mp3" | "webm";
      const transcript = await speechToText(audioBuffer, normalizedFormat);
      
      res.json({ transcript });
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  app.post("/api/voice/speak", async (req: Request, res: Response) => {
    try {
      const { text, voice = "nova" } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      const audioBuffer = await textToSpeech(text, voice, "mp3");
      const audioBase64 = audioBuffer.toString("base64");
      
      res.json({ audio: audioBase64, format: "mp3" });
    } catch (error) {
      console.error("Text-to-speech error:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });
}
