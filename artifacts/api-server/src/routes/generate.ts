import { Router, type IRouter } from "express";
import { GenerateScriptBody } from "@workspace/api-zod";

const router: IRouter = Router();

const YANDEX_API_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";

const SYSTEM_PROMPT = `Ты — профессиональный сценарист для микро-блогеров и создателей короткого видеоконтента (TikTok, Instagram Reels, YouTube Shorts).

Твоя задача: написать цепляющий, динамичный сценарий видео на основе ниши и идеи, которые укажет пользователь.

ВАЖНО: Всегда отвечай на русском языке, независимо от языка ввода.

Структура сценария:
1. КРЮЧОК (0–3 секунды) — Одна фраза, которая останавливает скролл. Максимум 15 слов. Используй вопрос, неожиданный факт или смелое утверждение.
2. ТЕЛО (4–45 секунд) — 3–4 конкретных, динамичных тезиса или сюжетных хода. Каждый тезис с новой строки. Без маркеров. Каждый тезис короткий и звучит естественно в речи.
3. ПРИЗЫВ К ДЕЙСТВИЮ — Одна убедительная фраза, побуждающая подписаться, прокомментировать или сохранить.

Правила стиля:
- Звучи естественно в разговорной речи — никакого канцелярита
- Будь конкретным, а не общим
- Избегай клише и слов-паразитов
- Подбирай энергетику под нишу (например: автомобили — дерзко, садоводство — тепло)

Верни ТОЛЬКО валидный JSON — без markdown, без кавычек кода, без лишнего текста:
{
  "hook": "...",
  "body": "...",
  "cta": "..."
}`;

interface YandexGPTResponse {
  result?: {
    alternatives?: Array<{
      message?: {
        text?: string;
      };
      status?: string;
    }>;
  };
  error?: {
    message?: string;
    code?: number;
  };
}

router.post("/generate", async (req, res) => {
  const parseResult = GenerateScriptBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request: niche and idea are required." });
    return;
  }

  const { niche, idea } = parseResult.data;
  const folderId = process.env.YANDEX_FOLDER_ID!;
  const apiKey = process.env.YANDEX_API_KEY!;

  try {
    const response = await fetch(YANDEX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Api-Key ${apiKey}`,
        "x-folder-id": folderId,
      },
      body: JSON.stringify({
        modelUri: `gpt://${folderId}/yandexgpt/latest`,
        completionOptions: {
          stream: false,
          temperature: 0.7,
          maxTokens: "800",
        },
        messages: [
          { role: "system", text: SYSTEM_PROMPT },
          { role: "user", text: `Ниша: ${niche}\nИдея видео: ${idea}` },
        ],
      }),
    });

    const data = (await response.json()) as YandexGPTResponse;

    if (!response.ok) {
      const errMsg = data.error?.message ?? `YandexGPT API error (HTTP ${response.status})`;
      req.log.error({ status: response.status, err: data.error }, "YandexGPT API error");
      res.status(502).json({ error: errMsg });
      return;
    }

    const raw = data.result?.alternatives?.[0]?.message?.text ?? "{}";
    let parsed: { hook?: string; body?: string; cta?: string };

    // Strip any accidental markdown code fences
    const cleaned = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      req.log.error({ raw }, "Failed to parse YandexGPT JSON response");
      res.status(500).json({ error: "AI вернул неожиданный ответ. Попробуйте ещё раз." });
      return;
    }

    const hook = parsed.hook?.trim() ?? "";
    const body = parsed.body?.trim() ?? "";
    const cta = parsed.cta?.trim() ?? "";

    if (!hook || !body || !cta) {
      req.log.error({ parsed }, "YandexGPT response missing required fields");
      res.status(500).json({ error: "Сценарий сформирован не полностью. Попробуйте ещё раз." });
      return;
    }

    res.json({ hook, body, cta });
  } catch (err: unknown) {
    req.log.error({ err }, "YandexGPT request failed");
    res.status(500).json({ error: "Не удалось сгенерировать сценарий. Попробуйте ещё раз." });
  }
});

export default router;
