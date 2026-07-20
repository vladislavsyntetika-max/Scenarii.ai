import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { GenerateScriptBody } from "@workspace/api-zod";

const router: IRouter = Router();

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required but not set.");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an expert script writer for micro-bloggers and short-form video creators (TikTok, Instagram Reels, YouTube Shorts).

Your job: write a punchy, engaging video script based on the niche and video idea provided by the user.

CRITICAL LANGUAGE RULE: Detect the language of the user's input (niche + idea). Respond ENTIRELY in that same language. If the user writes in Russian, respond in Russian. If in English, respond in English. Never mix languages.

Script structure:
1. HOOK (0–3 seconds) — A single attention-grabbing sentence that stops the scroll. Maximum 15 words. Make it a question, surprising fact, or bold statement.
2. BODY (4–45 seconds) — 3 to 4 punchy, specific points or story beats. Each point on a new line. No bullet symbols. Keep each point short and spoken-word-friendly.
3. CALL TO ACTION — One compelling sentence that drives follows, comments, or saves.

Style rules:
- Sound natural when spoken aloud — no stiff or corporate language
- Be specific, not generic
- Avoid clichés and filler phrases
- Match the energy level to the niche (e.g. automotive = bold, gardening = warm)

Return ONLY valid JSON — no markdown, no code fences, no extra text:
{
  "hook": "...",
  "body": "...",
  "cta": "..."
}`;

router.post("/generate", async (req, res) => {
  const parseResult = GenerateScriptBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request: niche and idea are required." });
    return;
  }

  const { niche, idea } = parseResult.data;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Niche: ${niche}\nVideo idea: ${idea}`,
        },
      ],
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: { hook?: string; body?: string; cta?: string };

    try {
      parsed = JSON.parse(raw);
    } catch {
      req.log.error({ raw }, "Failed to parse OpenAI JSON response");
      res.status(500).json({ error: "AI returned an unexpected response. Please try again." });
      return;
    }

    const hook = parsed.hook?.trim() ?? "";
    const body = parsed.body?.trim() ?? "";
    const cta = parsed.cta?.trim() ?? "";

    if (!hook || !body || !cta) {
      req.log.error({ parsed }, "OpenAI response missing required fields");
      res.status(500).json({ error: "Incomplete script generated. Please try again." });
      return;
    }

    res.json({ hook, body, cta });
  } catch (err: unknown) {
    req.log.error({ err }, "OpenAI API error");
    const message =
      err instanceof OpenAI.APIError
        ? `OpenAI error: ${err.message}`
        : "Failed to generate script. Please try again.";
    res.status(500).json({ error: message });
  }
});

export default router;
