import { Router, type IRouter } from "express";

const router: IRouter = Router();

const YANDEX_API_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";

const TRENDING_SYSTEM_PROMPT = `Ты — стратег вирального видеоконтента для TikTok, Reels и Shorts с 10-летним опытом.

ЯЗЫК: Всегда отвечай ТОЛЬКО на русском языке. Используй профессиональный сленг контент-мейкеров.

ЗАДАЧА: Пользователь указал нишу. Придумай 3 актуальных, высоковирусных видео-формата/концепта для этой ниши. Для ЛУЧШЕГО концепта создай полный покадровый сценарий.

━━━ СТРУКТУРА ВЫВОДА (строго JSON) ━━━

{
  "trending_ideas": [
    "Название формата: краткое описание (1–2 предложения) почему это виральный формат прямо сейчас",
    "Название формата: ...",
    "Название формата: ..."
  ],
  "best_idea_index": 0,
  "best_script": {
    "hooks": [
      { "text": "Крючок-вопрос — интригующий вопрос", "style": "вопрос" },
      { "text": "Крючок-факт — шокирующий факт или статистика", "style": "факт" },
      { "text": "Крючок-провокация — смелое утверждение", "style": "провокация" }
    ],
    "shots": [
      {
        "id": 1,
        "section": "Крючок",
        "timing": "0–3 сек",
        "visual": "КОНКРЕТНЫЙ кадр: ракурс, движение камеры, что в фокусе, освещение, реквизит",
        "voiceover": "Точный текст — разговорный, живой стиль",
        "overlay": "ТЕКСТ НА ЭКРАНЕ + эмодзи (1–5 слов)",
        "sfx": "Конкретный звук: whoosh / bass hit / ding / silence"
      }
    ],
    "music": "Жанр + BPM + настроение + примеры треков",
    "totalDuration": "45 сек"
  }
}

━━━ ТРЕБОВАНИЯ К TRENDING IDEAS ━━━

Используй конкретные виральные форматы:
• POV-видео («POV: ты впервые попробовал X»)
• «То, о чём молчат» / разоблачение мифов
• «3 ошибки, которые делают все» / антисоветы
• Day-in-a-life / рутина эксперта
• Before/After трансформация
• Challenge или дуэт-провокация
• «Меня попросили — я сделал» (запрос от подписчика)

Для сценария: минимум 5–7 шотов, чередуй ракурсы, конкретные тексты оверлеев, точные звуки.

Верни ТОЛЬКО валидный JSON без markdown-блоков, без пояснений.`;

interface HookVariant {
  text: string;
  style: string;
}

interface Shot {
  id: number;
  section: string;
  timing: string;
  visual: string;
  voiceover: string;
  overlay: string;
  sfx: string;
}

interface RichScript {
  hooks: HookVariant[];
  shots: Shot[];
  music: string;
  totalDuration: string;
}

interface TrendingOutput {
  trending_ideas: string[];
  best_idea_index: number;
  best_script: RichScript;
}

interface YandexGPTResponse {
  result?: {
    alternatives?: Array<{
      message?: { text?: string };
    }>;
  };
  error?: { message?: string; code?: number };
}

router.post("/trending", async (req, res) => {
  const niche = typeof req.body?.niche === "string" ? req.body.niche.trim() : "";
  if (!niche) {
    res.status(400).json({ error: "Укажите нишу." });
    return;
  }

  const folderId = process.env.YANDEX_FOLDER_ID;
  const apiKey = process.env.YANDEX_API_KEY;

  if (!folderId || !apiKey) {
    res.status(500).json({ error: "Сервис не настроен. Обратитесь к администратору." });
    return;
  }

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
          temperature: 0.85,
          maxTokens: "3000",
        },
        messages: [
          { role: "system", text: TRENDING_SYSTEM_PROMPT },
          { role: "user", text: `Ниша пользователя: ${niche}` },
        ],
      }),
    });

    const data = (await response.json()) as YandexGPTResponse;

    if (!response.ok) {
      const errMsg = data.error?.message ?? `YandexGPT API error (HTTP ${response.status})`;
      req.log.error({ status: response.status, err: data.error }, "YandexGPT trending error");
      res.status(502).json({ error: errMsg });
      return;
    }

    const raw = data.result?.alternatives?.[0]?.message?.text ?? "{}";
    const cleaned = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

    let parsed: TrendingOutput;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      req.log.error({ raw }, "Failed to parse YandexGPT trending JSON");
      res.status(500).json({ error: "AI вернул неожиданный ответ. Попробуйте ещё раз." });
      return;
    }

    if (
      !Array.isArray(parsed.trending_ideas) ||
      parsed.trending_ideas.length === 0 ||
      !parsed.best_script ||
      !Array.isArray(parsed.best_script.hooks) ||
      !Array.isArray(parsed.best_script.shots)
    ) {
      req.log.error({ parsed }, "Invalid trending response shape");
      res.status(500).json({ error: "Не удалось найти тренды. Попробуйте ещё раз." });
      return;
    }

    res.json(parsed);
  } catch (err: unknown) {
    req.log.error({ err }, "Trending request failed");
    res.status(500).json({ error: "Не удалось найти тренды. Попробуйте ещё раз." });
  }
});

export default router;
